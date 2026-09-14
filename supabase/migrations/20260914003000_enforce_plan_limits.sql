-- Database limits complement tenant RLS and cannot be bypassed through REST.
CREATE SCHEMA IF NOT EXISTS kubo_limits_private;
REVOKE ALL ON SCHEMA kubo_limits_private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION kubo_limits_private.history_days(org_id uuid, actor uuid)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE sub record;
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=actor AND role='admin') THEN RETURN 365; END IF;
  SELECT status,current_period_end INTO sub FROM public.subscriptions
    WHERE organization_id=org_id ORDER BY created_at DESC LIMIT 1;
  IF FOUND AND (
    (lower(sub.status) IN ('active','trialing','authorized','approved') AND
      (sub.current_period_end IS NULL OR sub.current_period_end > now()))
    OR (lower(sub.status) IN ('canceled','cancelled') AND sub.current_period_end > now())
  ) THEN RETURN 365; END IF;
  -- Preserve the explicitly supported legacy account subscription fallback.
  SELECT status,current_period_end INTO sub FROM public.subscriptions
    WHERE user_id=actor AND organization_id IS NULL ORDER BY created_at DESC LIMIT 1;
  IF FOUND AND (
    (lower(sub.status) IN ('active','trialing','authorized','approved') AND
      (sub.current_period_end IS NULL OR sub.current_period_end > now()))
    OR (lower(sub.status) IN ('canceled','cancelled') AND sub.current_period_end > now())
  ) THEN RETURN 365; END IF;
  RETURN 7;
END;
$$;
REVOKE ALL ON FUNCTION kubo_limits_private.history_days(uuid,uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.project_history_start(project uuid)
RETURNS date LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE org_id uuid; actor uuid := auth.uid(); days integer;
BEGIN
  IF actor IS NULL THEN RETURN NULL; END IF;
  SELECT p.organization_id INTO org_id FROM public.projects p
    LEFT JOIN public.clients c ON c.id=p.client_id
    WHERE p.id=project AND (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=actor AND role='admin')
      OR EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id=p.organization_id AND user_id=actor)
      OR (p.organization_id IS NULL AND c.user_id=actor)
    );
  IF NOT FOUND THEN RETURN NULL; END IF;
  days := kubo_limits_private.history_days(org_id,actor);
  RETURN (now() AT TIME ZONE 'UTC')::date - (days-1);
END;
$$;
REVOKE ALL ON FUNCTION public.project_history_start(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.project_history_start(uuid) TO authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['pageviews','events'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('DROP POLICY IF EXISTS "Plan history restriction" ON public.%I',t);
    EXECUTE format('CREATE POLICY "Plan history restriction" ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING (
      created_at >= public.project_history_start(project_id)::timestamp AT TIME ZONE ''UTC''
      AND created_at <= now())',t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['analytics_daily_overview','analytics_daily_pages','analytics_daily_geo',
    'analytics_daily_tech','analytics_daily_events','website_metrics'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('DROP POLICY IF EXISTS "Plan history restriction" ON public.%I',t);
    EXECUTE format('CREATE POLICY "Plan history restriction" ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING (
      date >= public.project_history_start(project_id) AND date <= (now() AT TIME ZONE ''UTC'')::date)',t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION kubo_limits_private.enforce_project_quota()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE actor uuid := auth.uid(); project_count bigint;
BEGIN
  -- Service-role ingestion/migrations continue using their explicit privileges.
  IF actor IS NULL THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' AND NEW.organization_id IS NOT DISTINCT FROM OLD.organization_id THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=actor AND role='admin') THEN RETURN NEW; END IF;
  IF NEW.organization_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id=NEW.organization_id AND user_id=actor AND role IN ('owner','admin','editor')
  ) THEN RAISE EXCEPTION 'Acesso negado à organização' USING ERRCODE='42501'; END IF;
  -- Serializes inserts/moves into the same organization across transactions.
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.organization_id::text, 0));
  IF kubo_limits_private.history_days(NEW.organization_id,actor)=365 THEN RETURN NEW; END IF;
  SELECT count(*) INTO project_count FROM public.projects
    WHERE organization_id=NEW.organization_id AND id IS DISTINCT FROM NEW.id;
  IF project_count >= 1 THEN
    RAISE EXCEPTION 'PROJECT_LIMIT_EXCEEDED: O plano gratuito permite 1 projeto.' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION kubo_limits_private.enforce_project_quota() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS enforce_plan_project_quota ON public.projects;
CREATE TRIGGER enforce_plan_project_quota BEFORE INSERT OR UPDATE OF organization_id
ON public.projects FOR EACH ROW EXECUTE FUNCTION kubo_limits_private.enforce_project_quota();

-- Close the legacy null-org loophole in the permissive insight policies.
DROP POLICY IF EXISTS "Insight tenant restriction" ON public.ai_insights;
CREATE POLICY "Insight tenant restriction" ON public.ai_insights AS RESTRICTIVE
FOR ALL TO authenticated
USING (user_id=auth.uid() AND project_id IS NOT NULL
  AND public.project_history_start(project_id) < (now() AT TIME ZONE 'UTC')::date - 6)
WITH CHECK (user_id=auth.uid() AND project_id IS NOT NULL
  AND public.project_history_start(project_id) < (now() AT TIME ZONE 'UTC')::date - 6);
