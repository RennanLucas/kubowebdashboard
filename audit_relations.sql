SELECT id, name, legacy_client_id FROM public.organizations;
SELECT id, organization_id, user_id, role FROM public.organization_members;
SELECT id, user_id, company_name, domain FROM public.clients;
SELECT id, client_id, organization_id, name FROM public.projects;
SELECT id, organization_id, status FROM public.subscriptions;
