-- Test RLS as User A
SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', true);
SET LOCAL role = authenticated;

SELECT 'User A Organizations Count (Expected 1)' as step, count(*) FROM public.organizations
UNION ALL
SELECT 'User A Projects Count (Expected 1)', count(*) FROM public.projects
UNION ALL
SELECT 'User A Pageviews Count (Expected 2)', count(*) FROM public.pageviews
UNION ALL
SELECT 'User A Events Count (Expected 1)', count(*) FROM public.events;
