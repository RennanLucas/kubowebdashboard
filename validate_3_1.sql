SELECT 'Organizations Count' as step, count(*) as cnt FROM public.organizations
UNION ALL
SELECT 'Orgs missing legacy_client_id', count(*) FROM public.organizations WHERE legacy_client_id IS NULL
UNION ALL
SELECT 'Members Count', count(*) FROM public.organization_members
UNION ALL
SELECT 'Projects missing org', count(*) FROM public.projects WHERE organization_id IS NULL
UNION ALL
SELECT 'Subscriptions WITH org', count(*) FROM public.subscriptions WHERE organization_id IS NOT NULL
UNION ALL
SELECT 'Scenario C Orgs', count(*) FROM public.organization_members WHERE user_id = '33333333-3333-3333-3333-333333333333';
