-- Reconcile complete UTC days, not distinct-per-batch sums.
-- Does not rebuild old history automatically; retain backups before backfills.
CREATE OR REPLACE FUNCTION public.classify_source(referrer text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE h text;
BEGIN
  IF coalesce(trim(referrer),'')='' THEN RETURN 'Direto'; END IF;
  h := substring(lower(referrer) from '^https?://([^/:?#]+)');
  IF h IS NULL OR h LIKE '%@%' THEN RETURN 'Outro'; END IF;
  IF h ~ '(^|[.])google[.](com|com[.]br|co[.]uk|pt|es|de|fr|ca|com[.]au)$' THEN RETURN 'Google'; END IF;
  IF h ~ '(^|[.])bing[.]com$' THEN RETURN 'Bing'; END IF;
  IF h ~ '(^|[.])yahoo[.](com|com[.]br|co[.]uk)$' THEN RETURN 'Yahoo'; END IF;
  IF h ~ '(^|[.])duckduckgo[.]com$' THEN RETURN 'DuckDuckGo'; END IF;
  IF h ~ '(^|[.])facebook[.]com$' OR h='fb.me' THEN RETURN 'Facebook'; END IF;
  IF h ~ '(^|[.])instagram[.]com$' THEN RETURN 'Instagram'; END IF;
  IF h ~ '(^|[.])(twitter|x)[.]com$' OR h='t.co' THEN RETURN 'X (Twitter)'; END IF;
  IF h ~ '(^|[.])linkedin[.]com$' OR h='lnkd.in' THEN RETURN 'LinkedIn'; END IF;
  IF h ~ '(^|[.])tiktok[.]com$' THEN RETURN 'TikTok'; END IF;
  IF h ~ '(^|[.])youtube[.]com$' OR h='youtu.be' THEN RETURN 'YouTube'; END IF;
  IF h ~ '(^|[.])pinterest[.](com|com[.]br)$' THEN RETURN 'Pinterest'; END IF;
  IF h ~ '(^|[.])whatsapp[.]com$' OR h='wa.me' THEN RETURN 'WhatsApp'; END IF;
  RETURN h;
END;
$$;

CREATE OR REPLACE FUNCTION public.analytics_source(referrer text, utm_source text, utm_medium text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN lower(utm_medium) IN ('cpc','ppc','paid','paid_social','paid_search','display','cpm') THEN 'Pago'
    WHEN lower(utm_medium) IN ('email','e-mail') THEN 'E-mail'
    WHEN lower(utm_medium) IN ('social','social-network','social_media') THEN 'Social'
    WHEN lower(utm_source) = 'google' THEN 'Google'
    WHEN lower(utm_source) = 'bing' THEN 'Bing'
    WHEN lower(utm_source) = 'linkedin' THEN 'LinkedIn'
    WHEN lower(utm_source) = 'tiktok' THEN 'TikTok'
    WHEN lower(utm_source) = 'youtube' THEN 'YouTube'
    WHEN lower(utm_source) = 'whatsapp' THEN 'WhatsApp'
    WHEN lower(utm_source) IN ('facebook','instagram','pinterest')
      THEN initcap(lower(utm_source))
    WHEN lower(utm_source) IN ('twitter','x') THEN 'X (Twitter)'
    ELSE public.classify_source(referrer)
  END;
$$;

CREATE OR REPLACE FUNCTION public.parse_device(ua text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN coalesce(ua,'') = '' THEN 'Desconhecido'
    WHEN lower(ua) LIKE '%ipad%' OR lower(ua) LIKE '%tablet%'
      OR (lower(ua) LIKE '%android%' AND lower(ua) NOT LIKE '%mobile%') THEN 'Tablet'
    WHEN lower(ua) LIKE '%mobile%' OR lower(ua) LIKE '%iphone%' THEN 'Mobile'
    ELSE 'Desktop' END;
$$;

CREATE OR REPLACE FUNCTION public.aggregate_analytics_jit(p_project_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_last timestamptz;
  v_now timestamptz := now();
  v_day date;
BEGIN
  INSERT INTO public.aggregation_status(project_id, last_aggregated_at)
    VALUES(p_project_id, '2000-01-01T00:00:00Z') ON CONFLICT DO NOTHING;
  SELECT last_aggregated_at INTO v_last FROM public.aggregation_status
    WHERE project_id = p_project_id FOR UPDATE SKIP LOCKED;
  IF NOT FOUND OR v_now - v_last < interval '1 minute' THEN RETURN; END IF;

  -- The overlap also recovers rows committed just after a previous cursor.
  FOR v_day IN
    SELECT (created_at AT TIME ZONE 'UTC')::date FROM public.pageviews
      WHERE project_id = p_project_id AND created_at >= v_last - interval '2 days' AND created_at <= v_now
    UNION
    SELECT (created_at AT TIME ZONE 'UTC')::date FROM public.events
      WHERE project_id = p_project_id AND created_at >= v_last - interval '2 days' AND created_at <= v_now
  LOOP
    DELETE FROM public.analytics_daily_overview WHERE project_id=p_project_id AND date=v_day;
    WITH raw AS (
      SELECT pv.*, coalesce(nullif(session_id,''), id::text) AS session_key
      FROM public.pageviews pv
      WHERE project_id = p_project_id
        AND created_at >= v_day::timestamp AT TIME ZONE 'UTC'
        AND created_at < (v_day + 1)::timestamp AT TIME ZONE 'UTC'
        AND created_at <= v_now
    ), facts AS (
      SELECT raw.*,
        first_value(public.analytics_source(referrer, utm_source, utm_medium)) OVER w AS source,
        first_value(public.parse_device(user_agent)) OVER w AS device,
        count(*) OVER w AS session_views,
        row_number() OVER w AS session_row,
        least(1800, extract(epoch FROM max(created_at) OVER w - min(created_at) OVER w)) AS duration,
        least(1800, coalesce(extract(epoch FROM lead(created_at) OVER w - created_at),0)) AS page_duration
      FROM raw WINDOW w AS (PARTITION BY session_key ORDER BY created_at, id
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
    )
    INSERT INTO public.analytics_daily_overview(project_id, date, source, device, visitors, views, sessions, bounces, total_duration)
    SELECT p_project_id, v_day, source, device, count(DISTINCT session_key), count(*), count(DISTINCT session_key), count(*) FILTER (WHERE session_views=1), coalesce(sum(duration) FILTER (WHERE session_row=1),0) FROM facts GROUP BY source, device;

    DELETE FROM public.analytics_daily_pages WHERE project_id=p_project_id AND date=v_day;
    WITH raw AS (
      SELECT pv.*, coalesce(nullif(session_id,''), id::text) AS session_key
      FROM public.pageviews pv
      WHERE project_id = p_project_id
        AND created_at >= v_day::timestamp AT TIME ZONE 'UTC'
        AND created_at < (v_day + 1)::timestamp AT TIME ZONE 'UTC'
        AND created_at <= v_now
    ), facts AS (
      SELECT raw.*,
        first_value(public.analytics_source(referrer, utm_source, utm_medium)) OVER w AS source,
        first_value(public.parse_device(user_agent)) OVER w AS device,
        count(*) OVER w AS session_views,
        row_number() OVER w AS session_row,
        least(1800, extract(epoch FROM max(created_at) OVER w - min(created_at) OVER w)) AS duration,
        least(1800, coalesce(extract(epoch FROM lead(created_at) OVER w - created_at),0)) AS page_duration
      FROM raw WINDOW w AS (PARTITION BY session_key ORDER BY created_at, id
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
    )
    INSERT INTO public.analytics_daily_pages(project_id, date, source, device, page_path, visitors, views, sessions, bounces, total_duration)
    SELECT p_project_id, v_day, source, device, coalesce(page_path,'/'), count(DISTINCT session_key), count(*), count(DISTINCT session_key), count(*) FILTER (WHERE session_views=1), sum(page_duration) FROM facts GROUP BY source, device, coalesce(page_path,'/');

    DELETE FROM public.analytics_daily_geo WHERE project_id=p_project_id AND date=v_day;
    WITH raw AS (
      SELECT pv.*, coalesce(nullif(session_id,''), id::text) AS session_key
      FROM public.pageviews pv
      WHERE project_id = p_project_id
        AND created_at >= v_day::timestamp AT TIME ZONE 'UTC'
        AND created_at < (v_day + 1)::timestamp AT TIME ZONE 'UTC'
        AND created_at <= v_now
    ), facts AS (
      SELECT raw.*,
        first_value(public.analytics_source(referrer, utm_source, utm_medium)) OVER w AS source,
        first_value(public.parse_device(user_agent)) OVER w AS device,
        count(*) OVER w AS session_views,
        row_number() OVER w AS session_row,
        least(1800, extract(epoch FROM max(created_at) OVER w - min(created_at) OVER w)) AS duration,
        least(1800, coalesce(extract(epoch FROM lead(created_at) OVER w - created_at),0)) AS page_duration
      FROM raw WINDOW w AS (PARTITION BY session_key ORDER BY created_at, id
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
    )
    INSERT INTO public.analytics_daily_geo(project_id, date, source, device, country, city, visitors, views)
    SELECT p_project_id, v_day, source, device, coalesce(country,'Unknown'), coalesce(city,'Unknown'), count(DISTINCT session_key), count(*) FROM facts GROUP BY source, device, coalesce(country,'Unknown'), coalesce(city,'Unknown');

    DELETE FROM public.analytics_daily_tech WHERE project_id=p_project_id AND date=v_day;
    WITH raw AS (
      SELECT pv.*, coalesce(nullif(session_id,''), id::text) AS session_key
      FROM public.pageviews pv
      WHERE project_id = p_project_id
        AND created_at >= v_day::timestamp AT TIME ZONE 'UTC'
        AND created_at < (v_day + 1)::timestamp AT TIME ZONE 'UTC'
        AND created_at <= v_now
    ), facts AS (
      SELECT raw.*,
        first_value(public.analytics_source(referrer, utm_source, utm_medium)) OVER w AS source,
        first_value(public.parse_device(user_agent)) OVER w AS device,
        count(*) OVER w AS session_views,
        row_number() OVER w AS session_row,
        least(1800, extract(epoch FROM max(created_at) OVER w - min(created_at) OVER w)) AS duration,
        least(1800, coalesce(extract(epoch FROM lead(created_at) OVER w - created_at),0)) AS page_duration
      FROM raw WINDOW w AS (PARTITION BY session_key ORDER BY created_at, id
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
    )
    INSERT INTO public.analytics_daily_tech(project_id, date, source, device, browser, os, visitors, views)
    SELECT p_project_id, v_day, source, device, public.parse_browser(user_agent), public.parse_os(user_agent), count(DISTINCT session_key), count(*) FROM facts GROUP BY source, device, public.parse_browser(user_agent), public.parse_os(user_agent);

    DELETE FROM public.analytics_daily_events WHERE project_id=p_project_id AND date=v_day;
    INSERT INTO public.analytics_daily_events(project_id,date,source,device,event_type,count)
    SELECT p_project_id, v_day, coalesce(attribution.source,'Desconhecido'),
      coalesce(attribution.device,'Desconhecido'), e.event_type, count(*)
    FROM public.events e
    LEFT JOIN LATERAL (
      SELECT public.analytics_source(pv.referrer,pv.utm_source,pv.utm_medium) AS source,
        public.parse_device(pv.user_agent) AS device
      FROM public.pageviews pv
      WHERE pv.project_id=e.project_id AND pv.session_id=e.session_id
        AND pv.created_at <= e.created_at
      ORDER BY pv.created_at, pv.id LIMIT 1
    ) attribution ON true
    WHERE e.project_id=p_project_id
      AND e.created_at >= v_day::timestamp AT TIME ZONE 'UTC'
      AND e.created_at < (v_day+1)::timestamp AT TIME ZONE 'UTC'
      AND e.created_at <= v_now
    GROUP BY attribution.source, attribution.device, e.event_type;
  END LOOP;
  UPDATE public.aggregation_status SET last_aggregated_at=v_now WHERE project_id=p_project_id;
END;
$$;
REVOKE ALL ON FUNCTION public.aggregate_analytics_jit(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aggregate_analytics_jit(uuid) TO service_role;
