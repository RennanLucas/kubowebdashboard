SELECT 'users' as table_name, count(*) FROM auth.users WHERE email LIKE '%@example.test'
UNION ALL
SELECT 'clients', count(*) FROM public.clients
UNION ALL
SELECT 'projects', count(*) FROM public.projects
UNION ALL
SELECT 'subscriptions', count(*) FROM public.subscriptions
UNION ALL
SELECT 'pageviews', count(*) FROM public.pageviews
UNION ALL
SELECT 'events', count(*) FROM public.events;
