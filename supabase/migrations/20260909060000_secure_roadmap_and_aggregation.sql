BEGIN;

-- Internal job bookkeeping is not a client-facing API.
ALTER TABLE public.aggregation_status ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.aggregation_status FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.aggregation_status TO service_role;

-- The existing SECURITY DEFINER job otherwise provides a public write bypass.
-- All application callers invoke this job from Edge Functions with service_role.
REVOKE ALL ON FUNCTION public.aggregate_analytics_jit(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aggregate_analytics_jit(uuid) TO service_role;

-- Keep aggregate totals without granting access to voter identities or org IDs.
-- Do not add this schema to the Data API's exposed schemas.
CREATE SCHEMA IF NOT EXISTS kubo_roadmap_private;
REVOKE ALL ON SCHEMA kubo_roadmap_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA kubo_roadmap_private TO authenticated;

CREATE OR REPLACE FUNCTION kubo_roadmap_private.public_vote_count(item_id uuid)
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT count(*)
  FROM public.roadmap_votes AS votes
  JOIN public.roadmap_items AS items ON items.id = votes.roadmap_item_id
  WHERE items.id = item_id
    AND items.public IS TRUE
    AND (SELECT auth.uid()) IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION kubo_roadmap_private.public_vote_count(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION kubo_roadmap_private.public_vote_count(uuid) TO authenticated;

CREATE OR REPLACE VIEW public.roadmap_item_votes
WITH (security_invoker = true)
AS
SELECT items.id AS roadmap_item_id,
       kubo_roadmap_private.public_vote_count(items.id) AS vote_count
FROM public.roadmap_items AS items
WHERE items.public IS TRUE;

REVOKE ALL ON TABLE public.roadmap_item_votes FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.roadmap_item_votes TO authenticated;

-- Preserve the existing PostgREST embed roadmap_item_votes(vote_count).
-- A computed to-many relationship avoids FK inference through private votes.
CREATE OR REPLACE FUNCTION public.roadmap_item_votes(public.roadmap_items)
RETURNS SETOF public.roadmap_item_votes
ROWS 1000
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT totals.* FROM public.roadmap_item_votes AS totals
  WHERE totals.roadmap_item_id = ($1).id;
$$;
REVOKE ALL ON FUNCTION public.roadmap_item_votes(public.roadmap_items) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.roadmap_item_votes(public.roadmap_items) TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
