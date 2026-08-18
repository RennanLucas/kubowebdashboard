-- 1. Criação das Tabelas
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  domain TEXT,
  analytics_property_id TEXT,
  lead_value NUMERIC NOT NULL DEFAULT 25,
  monthly_ad_spend NUMERIC NOT NULL DEFAULT 0,
  legacy_client_id UUID UNIQUE, -- Mapeamento Idempotente seguro
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Modificações Idempotentes em Tabelas Existentes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='organization_id') THEN
    ALTER TABLE public.projects ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='organization_id') THEN
    ALTER TABLE public.subscriptions ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Índices Mínimos Exigidos
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON public.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON public.subscriptions(organization_id);

-- 4. ETL Migration Seguro (Idempotente)
-- 4A. Migração de Clientes para Orgs
INSERT INTO public.organizations (name, legacy_client_id, domain, analytics_property_id, lead_value, monthly_ad_spend)
SELECT company_name, id, domain, analytics_property_id, lead_value, COALESCE(monthly_ad_spend, 0)
FROM public.clients c
WHERE NOT EXISTS (
  SELECT 1 FROM public.organizations o WHERE o.legacy_client_id = c.id
);

-- 4B. Membros (Owners)
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT o.id, c.user_id, 'owner'
FROM public.clients c
JOIN public.organizations o ON o.legacy_client_id = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_members m 
  WHERE m.organization_id = o.id AND m.user_id = c.user_id
);

-- 4C. Projetos (Vínculo com a nova Org baseada no client_id legado)
UPDATE public.projects p
SET organization_id = o.id
FROM public.clients c
JOIN public.organizations o ON o.legacy_client_id = c.id
WHERE p.client_id = c.id AND p.organization_id IS NULL;

-- ATENÇÃO (P0): Subscriptions Migration Marcada como PENDENTE
-- Não podemos vincular confiavelmente por user_id, pois 1 user = N orgs.
-- O vínculo atual está amarrado ao user_id sem proxy de projeto ou cliente.
-- As assinaturas existentes ficarão com organization_id = NULL e deverão ser 
-- resolvidas manualmente (ver relatório) ou no próximo touch via Webhook do Mercado Pago.


-- 5. Funções Auxiliares RLS Seguras (Segurança Endurecida)
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.get_user_organizations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_organizations() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.user_has_role(p_org_id UUID, p_required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE organization_id = p_org_id 
      AND user_id = auth.uid() 
      AND role = ANY(p_required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.user_has_role(UUID, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_has_role(UUID, TEXT[]) TO authenticated, service_role;

-- 6. Limpeza de Policies (Para Idempotência na Execução de Staging)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;
  DROP POLICY IF EXISTS "Admins and Owners can update their organizations" ON public.organizations;
  DROP POLICY IF EXISTS "Owners can delete their organizations" ON public.organizations;
  DROP POLICY IF EXISTS "Members can view other members in same org" ON public.organization_members;
  DROP POLICY IF EXISTS "Admins and Owners can manage members" ON public.organization_members;
  DROP POLICY IF EXISTS "Members can view invites for their org" ON public.organization_invites;
  DROP POLICY IF EXISTS "Admins and Owners can manage invites" ON public.organization_invites;
EXCEPTION WHEN OTHERS THEN NULL; 
END $$;

-- 7. RLS - ORGANIZATIONS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their organizations" ON public.organizations
  FOR SELECT USING (id IN (SELECT public.get_user_organizations()));
  
CREATE POLICY "Admins and Owners can update their organizations" ON public.organizations
  FOR UPDATE USING (public.user_has_role(id, ARRAY['owner', 'admin']));

CREATE POLICY "Owners can delete their organizations" ON public.organizations
  FOR DELETE USING (public.user_has_role(id, ARRAY['owner']));


-- 8. RLS & TRIGGERS - ORGANIZATION_MEMBERS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view other members in same org" ON public.organization_members
  FOR SELECT USING (organization_id IN (SELECT public.get_user_organizations()));
  
CREATE POLICY "Admins and Owners can manage members" ON public.organization_members
  FOR ALL USING (public.user_has_role(organization_id, ARRAY['owner', 'admin']));

-- TRIGGER P0: RBAC Stricto para gerência de membros (Admin não pode gerenciar Owner)
CREATE OR REPLACE FUNCTION public.check_member_rbac()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_role TEXT;
BEGIN
  -- Identifica o papel de quem estǭ fazendo a ação
  SELECT role INTO v_actor_role 
  FROM public.organization_members 
  WHERE organization_id = COALESCE(NEW.organization_id, OLD.organization_id) 
    AND user_id = auth.uid();
  
  -- Se o ator for admin, restringe ações sobre Owners e outros Admins
  IF v_actor_role = 'admin' THEN
    IF TG_OP = 'INSERT' AND NEW.role = 'owner' THEN
      RAISE EXCEPTION 'Admins cannot create owners.';
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
      IF OLD.role = 'owner' THEN
        RAISE EXCEPTION 'Admins cannot modify owners.';
      END IF;
      IF NEW.role = 'owner' THEN
        RAISE EXCEPTION 'Admins cannot elevate any user to owner.';
      END IF;
      IF OLD.role = 'admin' AND OLD.user_id != auth.uid() THEN
        RAISE EXCEPTION 'Admins cannot modify privileges of other admins.';
      END IF;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
      IF OLD.role = 'owner' THEN
        RAISE EXCEPTION 'Admins cannot remove owners.';
      END IF;
      IF OLD.role = 'admin' AND OLD.user_id != auth.uid() THEN
        RAISE EXCEPTION 'Admins cannot remove other admins.';
      END IF;
    END IF;
  END IF;

  -- NinguǸm pode mudar seu próprio role (evita exploit de auto-elevação)
  IF TG_OP = 'UPDATE' AND NEW.user_id = auth.uid() AND OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Users cannot elevate or change their own role directly.';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_member_rbac ON public.organization_members;
CREATE TRIGGER trg_enforce_member_rbac
  BEFORE INSERT OR UPDATE OR DELETE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.check_member_rbac();


-- 9. RLS & TRIGGERS - ORGANIZATION_INVITES
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view invites for their org" ON public.organization_invites
  FOR SELECT USING (organization_id IN (SELECT public.get_user_organizations()));
  
CREATE POLICY "Admins and Owners can manage invites" ON public.organization_invites
  FOR ALL USING (public.user_has_role(organization_id, ARRAY['owner', 'admin']));

-- TRIGGER P0: Admins não podem criar convites com role 'owner'
CREATE OR REPLACE FUNCTION public.check_invite_rbac()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_role TEXT;
BEGIN
  SELECT role INTO v_actor_role 
  FROM public.organization_members 
  WHERE organization_id = NEW.organization_id 
    AND user_id = auth.uid();

  IF v_actor_role = 'admin' AND NEW.role = 'owner' THEN
    RAISE EXCEPTION 'Admins cannot create invitations for the owner role.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_invite_rbac ON public.organization_invites;
CREATE TRIGGER trg_enforce_invite_rbac
  BEFORE INSERT OR UPDATE ON public.organization_invites
  FOR EACH ROW EXECUTE FUNCTION public.check_invite_rbac();


-- 10. RLS - SUBSCRIPTIONS (P0)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Members can view org subscriptions" ON public.subscriptions;

-- Leitura: Somente membros da Org correspondente
CREATE POLICY "Members can view org subscriptions" ON public.subscriptions
  FOR SELECT USING (organization_id IN (SELECT public.get_user_organizations()));

-- Escrita: NENHUMA pelo cliente. Somente Service Role (Webhooks/Backend) pode modificar
-- Subscriptions não ganham polticas explcitas de INSERT/UPDATE/DELETE.


-- 11. RLS - PROJECTS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own projects" ON public.projects;
DROP POLICY IF EXISTS "Members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Owner, Admin, Editor can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Owner, Admin, Editor can update projects" ON public.projects;
DROP POLICY IF EXISTS "Owner, Admin can delete projects" ON public.projects;

CREATE POLICY "Members can view projects" ON public.projects
  FOR SELECT USING (organization_id IN (SELECT public.get_user_organizations()));

CREATE POLICY "Owner, Admin, Editor can insert projects" ON public.projects
  FOR INSERT WITH CHECK (public.user_has_role(organization_id, ARRAY['owner', 'admin', 'editor']));

CREATE POLICY "Owner, Admin, Editor can update projects" ON public.projects
  FOR UPDATE USING (public.user_has_role(organization_id, ARRAY['owner', 'admin', 'editor']));

CREATE POLICY "Owner, Admin can delete projects" ON public.projects
  FOR DELETE USING (public.user_has_role(organization_id, ARRAY['owner', 'admin']));


-- 12. RLS - TABELAS ANALÍTICAS (P0: Isolamento absoluto de Rollups/Events/Pageviews)
DO $$ 
DECLARE
  table_name TEXT;
  tbls TEXT[] := ARRAY['pageviews', 'events', 'analytics_daily_overview', 'analytics_daily_pages', 'analytics_daily_geo', 'analytics_daily_tech', 'analytics_daily_events'];
BEGIN
  FOREACH table_name IN ARRAY tbls LOOP
    -- Habilita RLS de segurana máxima
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY;', table_name);
    
    -- Dropa a policy base se existir para evitar vzamentos de scripts antigos
    EXECUTE format('DROP POLICY IF EXISTS "View %I" ON public.%I;', table_name, table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Insert %I" ON public.%I;', table_name, table_name);
    
    -- Cria a policy de SELECT unificada baseada em membership do projeto
    -- Verifica se o projeto do dado analtico pertence a uma das orgs do user autenticado.
    EXECUTE format('
      CREATE POLICY "View %I" ON public.%I
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = %I.project_id 
            AND p.organization_id IN (SELECT public.get_user_organizations())
          )
        );
    ', table_name, table_name, table_name);
  END LOOP;
END $$;
