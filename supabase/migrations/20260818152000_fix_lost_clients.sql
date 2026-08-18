-- 1. Migrar clients esquecidos para organizations
INSERT INTO public.organizations (name, legacy_client_id, domain, analytics_property_id, lead_value, monthly_ad_spend)
SELECT company_name, id, domain, analytics_property_id, lead_value, COALESCE(monthly_ad_spend, 0)
FROM public.clients c
WHERE NOT EXISTS (
  SELECT 1 FROM public.organizations o WHERE o.legacy_client_id = c.id
);

-- 2. Inserir membros owners para as organizações migradas
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT o.id, c.user_id, 'owner'
FROM public.clients c
JOIN public.organizations o ON o.legacy_client_id = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_members m 
  WHERE m.organization_id = o.id AND m.user_id = c.user_id
);

-- 3. Atualizar projects vinculando a nova organization
UPDATE public.projects p
SET organization_id = o.id
FROM public.clients c
JOIN public.organizations o ON o.legacy_client_id = c.id
WHERE p.client_id = c.id AND p.organization_id IS NULL;
