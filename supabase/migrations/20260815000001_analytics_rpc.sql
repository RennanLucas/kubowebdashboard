-- Helpers para parsing igual ao do Deno (Frontend/Edge)
CREATE OR REPLACE FUNCTION public.parse_device(ua text) RETURNS text AS $$
DECLARE
  lower_ua text := lower(ua);
BEGIN
  IF ua IS NULL OR ua = '' THEN RETURN 'Desconhecido'; END IF;
  IF lower_ua LIKE '%mobile%' OR lower_ua LIKE '%android%' OR lower_ua LIKE '%iphone%' THEN RETURN 'Mobile'; END IF;
  IF lower_ua LIKE '%tablet%' OR lower_ua LIKE '%ipad%' THEN RETURN 'Tablet'; END IF;
  RETURN 'Desktop';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.classify_source(referrer text) RETURNS text AS $$
DECLARE
  ref_host text;
BEGIN
  IF referrer IS NULL OR referrer = '' THEN RETURN 'Direto'; END IF;
  
  ref_host := substring(referrer from '^https?://(?:www\.)?([^/:]+)');
  IF ref_host IS NULL THEN RETURN 'Outro'; END IF;
  
  IF ref_host LIKE '%google%' THEN RETURN 'Google'; END IF;
  IF ref_host LIKE '%bing%' THEN RETURN 'Bing'; END IF;
  IF ref_host LIKE '%yahoo%' THEN RETURN 'Yahoo'; END IF;
  IF ref_host LIKE '%facebook%' OR ref_host LIKE '%fb.%' THEN RETURN 'Facebook'; END IF;
  IF ref_host LIKE '%instagram%' THEN RETURN 'Instagram'; END IF;
  IF ref_host LIKE '%twitter%' OR ref_host LIKE 'x.%' THEN RETURN 'X (Twitter)'; END IF;
  IF ref_host LIKE '%linkedin%' THEN RETURN 'LinkedIn'; END IF;
  IF ref_host LIKE '%tiktok%' THEN RETURN 'TikTok'; END IF;
  IF ref_host LIKE '%youtube%' THEN RETURN 'YouTube'; END IF;
  IF ref_host LIKE '%pinterest%' THEN RETURN 'Pinterest'; END IF;
  IF ref_host LIKE '%lovable%' THEN RETURN 'Direto'; END IF;
  
  RETURN ref_host;
EXCEPTION WHEN OTHERS THEN
  RETURN 'Outro';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.parse_browser(ua text) RETURNS text AS $$
BEGIN
  IF ua IS NULL OR ua = '' THEN RETURN 'Outro'; END IF;
  IF ua LIKE '%Edg/%' OR ua LIKE '%Edge/%' THEN RETURN 'Edge'; END IF;
  IF ua LIKE '%OPR/%' OR ua LIKE '%Opera%' THEN RETURN 'Opera'; END IF;
  IF ua LIKE '%Chrome/%' AND ua NOT LIKE '%Edg/%' THEN RETURN 'Chrome'; END IF;
  IF ua LIKE '%Safari/%' AND ua NOT LIKE '%Chrome/%' THEN RETURN 'Safari'; END IF;
  IF ua LIKE '%Firefox/%' THEN RETURN 'Firefox'; END IF;
  RETURN 'Outro';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.parse_os(ua text) RETURNS text AS $$
BEGIN
  IF ua IS NULL OR ua = '' THEN RETURN 'Outro'; END IF;
  IF ua LIKE '%Windows%' THEN RETURN 'Windows'; END IF;
  IF ua LIKE '%Mac OS%' THEN RETURN 'macOS'; END IF;
  IF ua LIKE '%Android%' THEN RETURN 'Android'; END IF;
  IF ua LIKE '%iPhone%' OR ua LIKE '%iPad%' OR ua LIKE '%iOS%' THEN RETURN 'iOS'; END IF;
  IF ua LIKE '%Linux%' THEN RETURN 'Linux'; END IF;
  RETURN 'Outro';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função principal de Agregação JIT (Just in Time)
CREATE OR REPLACE FUNCTION public.aggregate_analytics_jit(p_project_id UUID) 
RETURNS void AS $$
DECLARE
  v_last_agg TIMESTAMPTZ;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Bloqueia a linha do projeto para evitar concorrência (múltiplos requests simultâneos)
  SELECT last_aggregated_at INTO v_last_agg 
  FROM public.aggregation_status 
  WHERE project_id = p_project_id FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    -- Pode não existir ou estar trancada por outro request
    IF EXISTS (SELECT 1 FROM public.aggregation_status WHERE project_id = p_project_id) THEN
      -- Está trancada por outro processo fazendo a agregação agora.
      -- Retornamos imediatamente (JIT concorrente resolvido sem bloqueio)
      RETURN;
    ELSE
      BEGIN
        INSERT INTO public.aggregation_status (project_id, last_aggregated_at) 
        VALUES (p_project_id, '2000-01-01T00:00:00Z')
        RETURNING last_aggregated_at INTO v_last_agg;
      EXCEPTION WHEN unique_violation THEN
        -- Outro processo inseriu milissegundos antes
        RETURN;
      END;
    END IF;
  END IF;

  -- Se agregou nos últimos 1 minuto, ignora (Throttle para performance)
  IF v_now - v_last_agg < interval '1 minute' THEN
    RETURN;
  END IF;

  -- 1. Agrega Pageviews (Overview)
  INSERT INTO public.analytics_daily_overview (project_id, date, source, device, visitors, views)
  SELECT 
    project_id,
    date(created_at),
    public.classify_source(referrer),
    public.parse_device(user_agent),
    count(DISTINCT COALESCE(session_id, id::text)),
    count(*)
  FROM public.pageviews
  WHERE project_id = p_project_id AND created_at > v_last_agg AND created_at <= v_now
  GROUP BY 1, 2, 3, 4
  ON CONFLICT (project_id, date, source, device) 
  DO UPDATE SET 
    visitors = analytics_daily_overview.visitors + EXCLUDED.visitors,
    views = analytics_daily_overview.views + EXCLUDED.views;

  -- 2. Agrega Pageviews (Top Pages)
  INSERT INTO public.analytics_daily_pages (project_id, date, source, device, page_path, views, visitors)
  SELECT 
    project_id,
    date(created_at),
    public.classify_source(referrer),
    public.parse_device(user_agent),
    COALESCE(page_path, '/'),
    count(*),
    count(DISTINCT COALESCE(session_id, id::text))
  FROM public.pageviews
  WHERE project_id = p_project_id AND created_at > v_last_agg AND created_at <= v_now
  GROUP BY 1, 2, 3, 4, 5
  ON CONFLICT (project_id, date, source, device, page_path) 
  DO UPDATE SET 
    visitors = analytics_daily_pages.visitors + EXCLUDED.visitors,
    views = analytics_daily_pages.views + EXCLUDED.views;

  -- 3. Agrega Geo
  INSERT INTO public.analytics_daily_geo (project_id, date, source, device, country, city, views, visitors)
  SELECT 
    project_id,
    date(created_at),
    public.classify_source(referrer),
    public.parse_device(user_agent),
    COALESCE(country, 'Unknown'),
    COALESCE(city, 'Unknown'),
    count(*),
    count(DISTINCT COALESCE(session_id, id::text))
  FROM public.pageviews
  WHERE project_id = p_project_id AND country IS NOT NULL AND created_at > v_last_agg AND created_at <= v_now
  GROUP BY 1, 2, 3, 4, 5, 6
  ON CONFLICT (project_id, date, source, device, country, city) 
  DO UPDATE SET 
    visitors = analytics_daily_geo.visitors + EXCLUDED.visitors,
    views = analytics_daily_geo.views + EXCLUDED.views;

  -- 4. Agrega Eventos
  INSERT INTO public.analytics_daily_events (project_id, date, source, device, event_type, count)
  SELECT 
    e.project_id,
    date(e.created_at),
    -- Para fonte e dispositivo, fazemos join com o pageview da sessão, se não houver, assume Direto/Desktop
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

  -- Atualiza o cursor temporal
  UPDATE public.aggregation_status 
  SET last_aggregated_at = v_now 
  WHERE project_id = p_project_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
