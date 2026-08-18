-- Test RLS as User A
-- Set request.jwt.claims so auth.uid() returns User A's ID
SELECT set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', true);
SET LOCAL role = authenticated;

-- Queries
SELECT 'User A Organizations Count (Expected 1)', count(*) FROM public.organizations;
SELECT 'User A Projects Count (Expected 1)', count(*) FROM public.projects;
SELECT 'User A Pageviews Count (Expected 2)', count(*) FROM public.pageviews;
SELECT 'User A Events Count (Expected 1)', count(*) FROM public.events;

-- Let's try User B
SELECT set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', true);
SET LOCAL role = authenticated;

SELECT 'User B Organizations Count (Expected 1)', count(*) FROM public.organizations;
SELECT 'User B Projects Count (Expected 1)', count(*) FROM public.projects;
SELECT 'User B Pageviews Count (Expected 1)', count(*) FROM public.pageviews;
SELECT 'User B Events Count (Expected 1)', count(*) FROM public.events;
