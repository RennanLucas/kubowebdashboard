-- Keep KUBOWEB safely inside the Gemini free tier while the product is in its
-- initial commercial phase. The browser never controls these limits.

-- The shared limiter also supports one UTC-aligned daily bucket.
CREATE OR REPLACE FUNCTION public.consume_request_limit(
  p_scope text, p_subject_hash text, p_limit integer, p_window_seconds integer DEFAULT 60
) RETURNS TABLE(allowed boolean, remaining integer, reset_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE request_time timestamptz := clock_timestamp(); start_time timestamptz; hits integer;
BEGIN
  IF p_scope IS NULL OR p_scope !~ '^[a-z0-9_:-]{1,80}$'
    OR p_subject_hash IS NULL OR p_subject_hash !~ '^[a-f0-9]{64}$'
    OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 10000
    OR p_window_seconds IS NULL OR p_window_seconds NOT BETWEEN 1 AND 86400 THEN
    RAISE EXCEPTION 'INVALID_RATE_LIMIT_ARGUMENTS' USING ERRCODE='22023';
  END IF;
  start_time := to_timestamp(floor(extract(epoch FROM request_time)/p_window_seconds)*p_window_seconds);
  INSERT INTO kubo_limits_private.request_limits AS bucket
    VALUES (p_scope,p_subject_hash,start_time,start_time+make_interval(secs=>p_window_seconds),1)
  ON CONFLICT (scope,subject_hash,window_start) DO UPDATE
    SET requests=least(bucket.requests+1,p_limit+1)
  RETURNING requests INTO hits;
  DELETE FROM kubo_limits_private.request_limits WHERE (scope,subject_hash,window_start) IN (
    SELECT scope,subject_hash,window_start FROM kubo_limits_private.request_limits
    WHERE expires_at < request_time - interval '1 day' ORDER BY expires_at LIMIT 100
  );
  RETURN QUERY SELECT hits<=p_limit, greatest(0,p_limit-hits), start_time+make_interval(secs=>p_window_seconds);
END;
$$;
REVOKE ALL ON FUNCTION public.consume_request_limit(text,text,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_request_limit(text,text,integer,integer) TO service_role;
