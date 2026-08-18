-- MIGRATION: Fase 3.3 - Billing Multi-tenant & Mercado Pago Webhooks

-- 1. ADICIONA COLUNA DE PROTEÇÃO DE IDEMPOTÊNCIA/ORDENAÇÃO
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='last_event_ts') THEN
    ALTER TABLE public.subscriptions ADD COLUMN last_event_ts TIMESTAMPTZ;
  END IF;
END $$;

-- 2. ETL: MAPEAMENTO SEGURO DE SUBSCRIPTIONS LEGADAS PARA ORGS
DO $$
DECLARE
  v_sub RECORD;
  v_org_count INT;
  v_target_org UUID;
  v_orgs_with_projects_count INT;
BEGIN
  -- Percorre apenas as assinaturas que AINDA NÃO FORAM MIGRADAS (organization_id IS NULL)
  -- e que pertencem a usuários.
  FOR v_sub IN (SELECT id, user_id FROM public.subscriptions WHERE organization_id IS NULL AND user_id IS NOT NULL)
  LOOP
    -- Verifica de quantas Orgs esse usuário é owner
    SELECT COUNT(*) INTO v_org_count
    FROM public.organization_members
    WHERE user_id = v_sub.user_id AND role = 'owner';

    IF v_org_count = 1 THEN
      -- Se for owner de apenas 1 org, é seguro mapear para essa org!
      SELECT organization_id INTO v_target_org
      FROM public.organization_members
      WHERE user_id = v_sub.user_id AND role = 'owner' LIMIT 1;
      
      UPDATE public.subscriptions
      SET organization_id = v_target_org
      WHERE id = v_sub.id;

    ELSIF v_org_count > 1 THEN
      -- Se for owner de múltiplas orgs, verifica qual delas possui projetos
      SELECT COUNT(DISTINCT om.organization_id) INTO v_orgs_with_projects_count
      FROM public.organization_members om
      JOIN public.projects p ON p.organization_id = om.organization_id
      WHERE om.user_id = v_sub.user_id AND om.role = 'owner';

      IF v_orgs_with_projects_count = 1 THEN
        -- Apenas uma das orgs possui projetos. É seguro mapear para ela.
        SELECT om.organization_id INTO v_target_org
        FROM public.organization_members om
        JOIN public.projects p ON p.organization_id = om.organization_id
        WHERE om.user_id = v_sub.user_id AND om.role = 'owner'
        LIMIT 1;

        UPDATE public.subscriptions
        SET organization_id = v_target_org
        WHERE id = v_sub.id;
      ELSE
        -- Ambíguo (0 ou >1 orgs com projetos). Não fazemos o mapeamento automático.
        -- Essas inscrições permanecerão com organization_id IS NULL (migration_pending).
        RAISE NOTICE 'Ambiguidade ao migrar subscription % (user: %). Várias orgs elegíveis.', v_sub.id, v_sub.user_id;
      END IF;
    ELSE
      -- Usuário não é owner de nenhuma org? Ambíguo/Orfão.
      RAISE NOTICE 'Nenhuma org (owner) encontrada para subscription % (user: %).', v_sub.id, v_sub.user_id;
    END IF;
  END LOOP;
END $$;

-- 3. RELATÓRIO DE RECONCILIAÇÃO (Para checagem pós-migração)
-- As assinaturas que permanecerem na consulta abaixo precisam ser resolvidas manualmente.
-- SELECT id, user_id, status, plan_id FROM public.subscriptions WHERE organization_id IS NULL;
