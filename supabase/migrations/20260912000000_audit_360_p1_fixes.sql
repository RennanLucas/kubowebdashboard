-- ==============================================================================
-- Migração: Correções P1/P2 da Auditoria 360° (K01, K02, K07, K18, K20)
-- 1. Idempotência em aggregate_analytics_jit (elimina soma entre lotes)
-- 2. Alimentação de analytics_daily_tech, sessions e bounces reais
-- 3. RLS de ai_insights compatível com o modelo B2B multi-tenant (organizations)
-- 4. Trava de autoria em feedback_posts (user_id = auth.uid())
-- 5. Fix de search_path em classificadores
-- ==============================================================================

-- 1. Classificadores com search_path seguro e detecção refinada (K16, K20)
CREATE OR REPLACE FUNCTION public.parse_device(ua text) 
RETURNS text 
LANGUAGE plpgsql 
IMMUTABLE 
SET search_path = public AS $$
DECLARE
  lower_ua text := lower(ua);
BEGIN
  IF ua IS NULL OR ua = '' THEN RETURN 'Desconhecido'; END IF;
  IF lower_ua LIKE '%tablet%' OR lower_ua LIKE '%ipad%' THEN RETURN 'Tablet'; END IF;
  IF lower_ua LIKE '%mobile%' OR lower_ua LIKE '%android%' OR lower_ua LIKE '%iphone%' THEN RETURN 'Mobile'; END IF;
  RETURN 'Desktop';
END;
$$;

CREATE OR REPLACE FUNCTION public.classify_source(referrer text) 
RETURNS text 
LANGUAGE plpgsql 
IMMUTABLE 
SET search_path = public AS $$
DECLARE
  ref_host text;
BEGIN
  IF referrer IS NULL OR referrer = '' THEN RETURN 'Direto'; END IF;
  
  ref_host := substring(referrer from '^https?://(?:www\.)?([^/:]+)');
  IF ref_host IS NULL THEN RETURN 'Outro'; END IF;
  
  IF ref_host = 'google.com' OR ref_host LIKE '%.google.%' OR ref_host = 'google' THEN RETURN 'Google'; END IF;
  IF ref_host = 'bing.com' OR ref_host LIKE '%.bing.%' THEN RETURN 'Bing'; END IF;
  IF ref_host = 'yahoo.com' OR ref_host LIKE '%.yahoo.%' THEN RETURN 'Yahoo'; END IF;
  IF ref_host LIKE '%facebook%' OR ref_host LIKE '%fb.%' THEN RETURN 'Facebook'; END IF;
  IF ref_host LIKE '%instagram%' THEN RETURN 'Instagram'; END IF;
  IF ref_host LIKE '%twitter%' OR ref_host LIKE 'x.%' OR ref_host = 't.co' THEN RETURN 'X (Twitter)'; END IF;
  IF ref_host LIKE '%linkedin%' THEN RETURN 'LinkedIn'; END IF;
  IF ref_host LIKE '%tiktok%' THEN RETURN 'TikTok'; END IF;
  IF ref_host LIKE '%youtube%' THEN RETURN 'YouTube'; END IF;
  IF ref_host LIKE '%pinterest%' THEN RETURN 'Pinterest'; END IF;
  IF ref_host LIKE '%whatsapp%' THEN RETURN 'WhatsApp'; END IF;
  IF ref_host LIKE '%lovable%' THEN RETURN 'Direto'; END IF;
  
  RETURN ref_host;
EXCEPTION WHEN OTHERS THEN
  RETURN 'Outro';
END;
$$;

CREATE OR REPLACE FUNCTION public.parse_browser(ua text) 
RETURNS text 
LANGUAGE plpgsql 
IMMUTABLE 
SET search_path = public AS $$
BEGIN
  IF ua IS NULL OR ua = '' THEN RETURN 'Outro'; END IF;
  IF ua LIKE '%Edg/%' OR ua LIKE '%Edge/%' THEN RETURN 'Edge'; END IF;
  IF ua LIKE '%OPR/%' OR ua LIKE '%Opera%' THEN RETURN 'Opera'; END IF;
  IF ua LIKE '%Chrome/%' AND ua NOT LIKE '%Edg/%' THEN RETURN 'Chrome'; END IF;
  IF ua LIKE '%Safari/%' AND ua NOT LIKE '%Chrome/%' THEN RETURN 'Safari'; END IF;
  IF ua LIKE '%Firefox/%' THEN RETURN 'Firefox'; END IF;
  RETURN 'Outro';
END;
$$;

CREATE OR REPLACE FUNCTION public.parse_os(ua text) 
RETURNS text 
LANGUAGE plpgsql 
IMMUTABLE 
SET search_path = public AS $$
BEGIN
  IF ua IS NULL OR ua = '' THEN RETURN 'Outro'; END IF;
  IF ua LIKE '%Windows%' THEN RETURN 'Windows'; END IF;
  IF ua LIKE '%iPhone%' OR ua LIKE '%iPad%' OR ua LIKE '%iOS%' THEN RETURN 'iOS'; END IF;
  IF ua LIKE '%Android%' THEN RETURN 'Android'; END IF;
  IF ua LIKE '%Mac OS%' THEN RETURN 'macOS'; END IF;
  IF ua LIKE '%Linux%' THEN RETURN 'Linux'; END IF;
  RETURN 'Outro';
END;
$$;

-- 2. Refatoração de aggregate_analytics_jit (K01 & K02)
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

  -- 5. Agrega Eventos novos
  INSERT INTO public.analytics_daily_events (project_id, date, source, device, event_type, count)
  SELECT 
    e.project_id,
    date(e.created_at),
    COALESCE((SELECT public.classify_source(referrer) FROM public.pageviews pv WHERE pv.session_id = e.session_id LIMIT 1), 'Direto'),
    COALESCE((SELECT public.parse_device(user_agent) FROM public.pageviews pv WHERE pv.session_id = e.session_id LIMIT 1), 'Desktop'),
    e.event_type,
    count(*)
  FROM public.events e
  WHERE e.project_id = p_project_id AND e.created_at > v_last_agg AND e.created_at <= v_now
  GROUP BY 1, 2, 3, 4, 5
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

-- 3. RLS de ai_insights compatível com Organizations (K07)
DROP POLICY IF EXISTS "Users insert own ai insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users view own ai insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users delete own ai insights" ON public.ai_insights;

CREATE POLICY "Users insert own ai insights"
ON public.ai_insights FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.clients c ON c.id = p.client_id
      LEFT JOIN public.organization_members om ON om.organization_id = p.organization_id AND om.user_id = auth.uid()
      WHERE p.id = ai_insights.project_id
        AND (c.user_id = auth.uid() OR om.user_id IS NOT NULL OR p.organization_id IS NULL)
    )
  )
);

CREATE POLICY "Users view own ai insights"
ON public.ai_insights FOR SELECT
USING (
  auth.uid() = user_id
  AND (
    project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.projects p
      LEFT JOIN public.clients c ON c.id = p.client_id
      LEFT JOIN public.organization_members om ON om.organization_id = p.organization_id AND om.user_id = auth.uid()
      WHERE p.id = ai_insights.project_id
        AND (c.user_id = auth.uid() OR om.user_id IS NOT NULL OR p.organization_id IS NULL)
    )
  )
);

CREATE POLICY "Users delete own ai insights"
ON public.ai_insights FOR DELETE
USING (auth.uid() = user_id);

-- 4. Trava de autoria em feedback (K18)
DROP POLICY IF EXISTS "Users can insert feedback" ON public.feedback;
CREATE POLICY "Users can insert feedback"
ON public.feedback FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
  AND (
    organization_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = feedback.organization_id
        AND om.user_id = auth.uid()
    )
  )
);

