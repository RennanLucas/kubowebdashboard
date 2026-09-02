-- Migration: hardening de SECURITY DEFINER + correção do accept_invite
-- Data: 2026-09-01
--
-- Auditoria da camada de banco encontrou três problemas:
--
--   1. public.cleanup_old_raw_data() é SECURITY DEFINER, deleta pageviews/events
--      em lote e não tinha search_path fixo nem REVOKE. Executável por PUBLIC:
--      qualquer usuário autenticado podia disparar deleção destrutiva.
--   2. Os wrappers pgmq (enqueue_email, read_email_batch, delete_email,
--      move_to_dlq) na definição de 20260419030222 não fixavam search_path.
--      Já estavam revogados de PUBLIC/anon/authenticated, então é hardening.
--   3. public.accept_invite() filtrava o convite apenas por (id, email) —
--      aceitava convite expirado, revogado ou já usado, e não protegia contra
--      membership duplicada.


-- ---------------------------------------------------------------------------
-- 1. cleanup_old_raw_data: search_path fixo + execução restrita
-- ---------------------------------------------------------------------------
-- Sem search_path fixo um caller com schema próprio no search_path poderia
-- resolver `pageviews`/`events` para tabelas plantadas por ele.
ALTER FUNCTION public.cleanup_old_raw_data() SET search_path = public;

-- pg_cron roda como o dono do job (postgres), que continua podendo executar.
-- Nenhum caminho de aplicação chama esta função.
REVOKE EXECUTE ON FUNCTION public.cleanup_old_raw_data() FROM PUBLIC, anon, authenticated;


-- ---------------------------------------------------------------------------
-- 2. Wrappers de fila de email: search_path fixo
-- ---------------------------------------------------------------------------
-- Precisam de pgmq no search_path além de public (chamam pgmq.send/read/delete).
ALTER FUNCTION public.enqueue_email(TEXT, JSONB) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(TEXT, INT, INT) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(TEXT, BIGINT) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) SET search_path = public, pgmq;

-- Reafirma a restrição (idempotente; 20260525021916 já revogava).
REVOKE EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(TEXT, INT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(TEXT, BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(TEXT, TEXT, BIGINT, JSONB) TO service_role;


-- ---------------------------------------------------------------------------
-- 3. aggregate_all_projects: restringe execução
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER que varre todos os projetos da instância. Só o cron precisa.
REVOKE EXECUTE ON FUNCTION public.aggregate_all_projects() FROM PUBLIC, anon, authenticated;

-- aggregate_analytics_jit é chamada pelas Edge Functions com service_role.
REVOKE EXECUTE ON FUNCTION public.aggregate_analytics_jit(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aggregate_analytics_jit(UUID) TO service_role;


-- ---------------------------------------------------------------------------
-- 4. accept_invite: valida status, expiração e membership duplicada
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_invite(invite_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_org_id UUID;
  v_role TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'Invite not found or not valid';
  END IF;

  -- Trava a linha do convite: sem FOR UPDATE, duas chamadas concorrentes podem
  -- ambas passar pela validação antes de qualquer uma marcar como aceito.
  --
  -- Comparação de email case-insensitive: create-invite grava lowercase, mas
  -- auth.users pode ter capitalização diferente conforme o provedor.
  -- Condições de validade (as três ausentes antes desta migration):
  --   status = 'pending'  → rejeita convite revogado ou já aceito
  --   expires_at > now()  → rejeita convite fora da janela de 7 dias
  SELECT organization_id, role INTO v_org_id, v_role
  FROM public.organization_invites
  WHERE id = invite_id
    AND lower(email) = lower(v_user_email)
    AND status = 'pending'
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Mensagem única para convite inexistente / email divergente / expirado /
    -- revogado: distinguir os casos permitiria sondar ids de convite válidos.
    RAISE EXCEPTION 'Invite not found or not valid';
  END IF;

  -- Já é membro: marca o convite como aceito e retorna sem violar o
  -- UNIQUE(organization_id, user_id) de organization_members.
  IF EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = v_org_id AND user_id = v_user_id
  ) THEN
    UPDATE public.organization_invites
    SET status = 'accepted'
    WHERE id = invite_id;
    RETURN TRUE;
  END IF;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, v_user_id, v_role);

  -- Antes o convite era deletado. Manter a linha com status='accepted' preserva
  -- a trilha de auditoria (quem convidou quem, quando) e torna a função
  -- idempotente — reexecutar cai no filtro status='pending' e falha limpo.
  UPDATE public.organization_invites
  SET status = 'accepted'
  WHERE id = invite_id;

  RETURN TRUE;
END;
$$;

-- Só o próprio usuário autenticado aceita seu convite (a função resolve a
-- identidade via auth.uid(), então não há como aceitar em nome de outro).
REVOKE EXECUTE ON FUNCTION public.accept_invite(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_invite(UUID) TO authenticated;

-- create_organization é chamada de src/pages/Onboarding.tsx pelo usuário logado.
REVOKE EXECUTE ON FUNCTION public.create_organization(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_organization(TEXT, TEXT, TEXT) TO authenticated;


-- ---------------------------------------------------------------------------
-- 5. Expiração automática de convites vencidos
-- ---------------------------------------------------------------------------
-- Convites vencidos ficavam com status='pending' para sempre, aparecendo em
-- InvitesManager como se ainda fossem válidos. accept_invite já os rejeita
-- pelo expires_at; isto apenas mantém a listagem honesta.
CREATE OR REPLACE FUNCTION public.expire_stale_invites()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.organization_invites
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at <= now();
$$;

REVOKE EXECUTE ON FUNCTION public.expire_stale_invites() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule(
  'expire-stale-invites',
  '17 4 * * *',
  'SELECT public.expire_stale_invites()'
);

CREATE INDEX IF NOT EXISTS idx_organization_invites_pending
  ON public.organization_invites (organization_id, expires_at)
  WHERE status = 'pending';
