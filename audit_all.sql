SELECT json_build_object(
  'organizations', (SELECT json_agg(t) FROM public.organizations t),
  'organization_members', (SELECT json_agg(t) FROM public.organization_members t),
  'clients', (SELECT json_agg(t) FROM public.clients t),
  'projects', (SELECT json_agg(t) FROM public.projects t),
  'subscriptions', (SELECT json_agg(t) FROM public.subscriptions t)
);
