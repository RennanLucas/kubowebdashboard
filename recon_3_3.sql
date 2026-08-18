SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE organization_id IS NULL) AS sem_organization
FROM public.subscriptions;

SELECT
  id,
  user_id,
  organization_id,
  status,
  external_id
FROM public.subscriptions
ORDER BY id;
