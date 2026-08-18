-- Validar organizações
SELECT '--- ORGANIZATIONS ---' AS step;
SELECT id, legacy_client_id, name FROM public.organizations;

-- Validar membros
SELECT '--- ORGANIZATION MEMBERS ---' AS step;
SELECT id, organization_id, user_id, role FROM public.organization_members;

-- Validar projetos
SELECT '--- PROJECTS VINCULADOS ---' AS step;
SELECT id, client_id, organization_id, name FROM public.projects;
