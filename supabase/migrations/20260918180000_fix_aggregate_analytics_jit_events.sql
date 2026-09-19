-- ==============================================================================
-- Migração: Correção de subqueries no GROUP BY em aggregate_analytics_jit
-- Data: 2026-09-18
-- Descrição: O PostgreSQL não permite subqueries correlacionadas diretamente
-- dentro da cláusula GROUP BY. O agrupamento de eventos agora é executado
-- sobre uma subquery interna (derived table) com colunas escalares.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.aggregate_analytics_jit(p_project_id UUID) 
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public AS $$
DECLARE
  v_last_agg TIMESTAMPTZ;
  v_now TIMESTAMPTZ := now();
  r_date RECORD;
BEGIN
  SELECT last_aggregated_at INTO v_last_agg 
  FROM public.aggregation_status 
  WHERE project_id = p_project_id FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM public.aggregation_status WHERE project_id = p_project_id) THEN
      RETURN;
    ELSE
      BEGIN
        INSERT INTO public.aggregation_status (project_id, last_aggregated_at) 
        VALUES (p_project_id, '2000-01-01T00:00:00Z')
        RETURNING last_aggregated_at INTO v_last_agg;
      EXCEPTION WHEN unique_violation THEN
        RETURN;
      END;
    END IF;
  END IF;

  IF v_now - v_last_agg < interval '1 minute' THEN
    RETURN;
  END IF;

  FOR r_date IN 
    SELECT DISTINCT date(created_at) AS dt
    FROM public.pageviews
    WHERE project_id = p_project_id 
      AND created_at > v_last_agg 
      AND created_at <= v_now
  LOOP
    -- 1. Agrega Overview Diário de forma idempotente
    INSERT INTO public.analytics_daily_overview (
      project_id, date, source, device, visitors, views, sessions, bounces, total_duration
    )
    SELECT 
      project_id,
      r_date.dt,
      public.classify_source(referrer),
      public.parse_device(user_agent),
      count(DISTINCT COALESCE(session_id, id::text)) AS visitors,
      count(*) AS views,
      count(DISTINCT session_id) AS sessions,
      count(DISTINCT session_id) FILTER (WHERE session_pageviews = 1) AS bounces,
      0 AS total_duration
    FROM (
      SELECT 
        pv.*,
        count(*) OVER (PARTITION BY pv.session_id, date(pv.created_at)) AS session_pageviews
      FROM public.pageviews pv
      WHERE pv.project_id = p_project_id AND date(pv.created_at) = r_date.dt
    ) sub
    GROUP BY 1, 2, 3, 4
    ON CONFLICT (project_id, date, source, device) 
    DO UPDATE SET 
      visitors = EXCLUDED.visitors,
      views = EXCLUDED.views,
      sessions = EXCLUDED.sessions,
      bounces = EXCLUDED.bounces,
      total_duration = EXCLUDED.total_duration;

    -- 2. Agrega Top Pages de forma idempotente
    INSERT INTO public.analytics_daily_pages (
      project_id, date, source, device, page_path, views, visitors, sessions, bounces, total_duration
    )
    SELECT 
      project_id,
      r_date.dt,
      public.classify_source(referrer),
      public.parse_device(user_agent),
      COALESCE(page_path, '/'),
      count(*) AS views,
      count(DISTINCT COALESCE(session_id, id::text)) AS visitors,
      count(DISTINCT session_id) AS sessions,
      0 AS bounces,
      0 AS total_duration
    FROM public.pageviews
    WHERE project_id = p_project_id AND date(created_at) = r_date.dt
    GROUP BY 1, 2, 3, 4, 5
    ON CONFLICT (project_id, date, source, device, page_path) 
    DO UPDATE SET 
      visitors = EXCLUDED.visitors,
      views = EXCLUDED.views,
      sessions = EXCLUDED.sessions;

    -- 3. Agrega Geo de forma idempotente
    INSERT INTO public.analytics_daily_geo (
      project_id, date, source, device, country, city, views, visitors
    )
    SELECT 
      project_id,
      r_date.dt,
      public.classify_source(referrer),
      public.parse_device(user_agent),
      COALESCE(country, 'Unknown'),
      COALESCE(city, 'Unknown'),
      count(*) AS views,
      count(DISTINCT COALESCE(session_id, id::text)) AS visitors
    FROM public.pageviews
    WHERE project_id = p_project_id AND date(created_at) = r_date.dt AND country IS NOT NULL
    GROUP BY 1, 2, 3, 4, 5, 6
    ON CONFLICT (project_id, date, source, device, country, city) 
    DO UPDATE SET 
      visitors = EXCLUDED.visitors,
      views = EXCLUDED.views;

    -- 4. Agrega Tecnologia (Navegadores & OS)
    INSERT INTO public.analytics_daily_tech (
      project_id, date, source, device, browser, os, views, visitors
    )
    SELECT 
      project_id,
      r_date.dt,
      public.classify_source(referrer),
      public.parse_device(user_agent),
      public.parse_browser(user_agent),
      public.parse_os(user_agent),
      count(*) AS views,
      count(DISTINCT COALESCE(session_id, id::text)) AS visitors
    FROM public.pageviews
    WHERE project_id = p_project_id AND date(created_at) = r_date.dt
    GROUP BY 1, 2, 3, 4, 5, 6
    ON CONFLICT (project_id, date, source, device, browser, os) 
    DO UPDATE SET 
      visitors = EXCLUDED.visitors,
      views = EXCLUDED.views;
  END LOOP;

  -- 5. Agrega Eventos novos (corrigido para PostgreSQL: subquery para evitar erro de subquery no GROUP BY)
  INSERT INTO public.analytics_daily_events (project_id, date, source, device, event_type, count)
  SELECT 
    sub.project_id,
    sub.event_date,
    sub.source,
    sub.device,
    sub.event_type,
    count(*)
  FROM (
    SELECT 
      e.project_id,
      date(e.created_at) AS event_date,
      COALESCE((SELECT public.classify_source(pv.referrer) FROM public.pageviews pv WHERE pv.session_id = e.session_id LIMIT 1), 'Direto') AS source,
      COALESCE((SELECT public.parse_device(pv.user_agent) FROM public.pageviews pv WHERE pv.session_id = e.session_id LIMIT 1), 'Desktop') AS device,
      e.event_type
    FROM public.events e
    WHERE e.project_id = p_project_id 
      AND e.created_at > v_last_agg 
      AND e.created_at <= v_now
  ) sub
  GROUP BY sub.project_id, sub.event_date, sub.source, sub.device, sub.event_type
  ON CONFLICT (project_id, date, source, device, event_type) 
  DO UPDATE SET 
    count = analytics_daily_events.count + EXCLUDED.count;

  UPDATE public.aggregation_status 
  SET last_aggregated_at = v_now 
  WHERE project_id = p_project_id;

END;
$$;

REVOKE ALL ON FUNCTION public.aggregate_analytics_jit(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aggregate_analytics_jit(uuid) TO service_role;

