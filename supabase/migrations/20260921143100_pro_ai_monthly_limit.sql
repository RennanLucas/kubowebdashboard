-- Five generations per Pro organization/month. Free organizations remain at
-- zero and all existing idempotency/cost-ledger protections stay unchanged.
CREATE OR REPLACE FUNCTION public.manage_ai_generation(
  p_actor uuid, p_project uuid, p_action text,
  p_request uuid DEFAULT NULL, p_days integer DEFAULT 7,
  p_model text DEFAULT 'gemini-3.8-flash', p_content text DEFAULT NULL,
  p_usage jsonb DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE org_id uuid; actor_role text; platform_admin boolean; paid boolean;
  entry kubo_limits_private.ai_generations%ROWTYPE;
  month_start date := date_trunc('month',clock_timestamp() AT TIME ZONE 'UTC')::date;
  monthly_limit integer; used_count integer; saved jsonb; result jsonb;
BEGIN
  IF p_actor IS NULL OR p_project IS NULL OR p_days NOT IN (7,30)
    OR p_days IS NULL OR p_model IS DISTINCT FROM 'gemini-3.8-flash'
    OR p_action IS NULL OR p_action NOT IN ('status','reserve','start','complete','fail') THEN
    RAISE EXCEPTION 'INVALID_AI_REQUEST' USING ERRCODE='22023';
  END IF;
  SELECT organization_id INTO org_id FROM public.projects WHERE id=p_project;
  IF org_id IS NULL THEN RAISE EXCEPTION 'AI_PROJECT_NOT_FOUND' USING ERRCODE='42501'; END IF;
  SELECT role INTO actor_role FROM public.organization_members WHERE organization_id=org_id AND user_id=p_actor;
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=p_actor AND role='admin') INTO platform_admin;
  IF actor_role IS NULL AND NOT platform_admin THEN RAISE EXCEPTION 'AI_ACCESS_DENIED' USING ERRCODE='42501'; END IF;
  paid := kubo_limits_private.history_days(org_id,p_actor)=365;
  monthly_limit := CASE WHEN paid THEN 5 ELSE 0 END;
  PERFORM pg_advisory_xact_lock(hashtextextended('ai:'||org_id::text,0));
  UPDATE kubo_limits_private.ai_generations SET state='failed',updated_at=clock_timestamp()
    WHERE organization_id=org_id AND state='reserved' AND created_at < clock_timestamp()-interval '2 minutes';
  IF p_request IS NOT NULL THEN
    SELECT * INTO entry FROM kubo_limits_private.ai_generations WHERE request_id=p_request;
    IF FOUND AND (entry.organization_id<>org_id OR entry.project_id<>p_project
      OR entry.user_id<>p_actor OR entry.period_days<>p_days OR entry.model<>p_model) THEN
      RAISE EXCEPTION 'AI_REQUEST_ID_CONFLICT' USING ERRCODE='22023';
    END IF;
  END IF;
  IF p_action<>'status' AND p_request IS NULL THEN
    RAISE EXCEPTION 'INVALID_AI_REQUEST' USING ERRCODE='22023';
  END IF;
  IF p_action IN ('reserve','start') THEN
    IF NOT paid THEN RAISE EXCEPTION 'PLAN_REQUIRED' USING ERRCODE='42501'; END IF;
    IF NOT platform_admin AND actor_role NOT IN ('owner','admin','editor') THEN
      RAISE EXCEPTION 'AI_WRITE_DENIED' USING ERRCODE='42501';
    END IF;
  END IF;
  IF p_action='reserve' AND entry.request_id IS NULL THEN
    SELECT count(*) INTO used_count FROM kubo_limits_private.ai_generations
      WHERE organization_id=org_id AND quota_month=month_start AND state<>'failed';
    IF used_count>=monthly_limit THEN RAISE EXCEPTION 'AI_LIMIT_REACHED' USING ERRCODE='P0001'; END IF;
    BEGIN
      INSERT INTO kubo_limits_private.ai_generations(request_id,organization_id,user_id,project_id,period_days,model,quota_month,state)
        VALUES(p_request,org_id,p_actor,p_project,p_days,p_model,month_start,'reserved') RETURNING * INTO entry;
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'AI_REQUEST_ID_CONFLICT' USING ERRCODE='22023';
    END;
  ELSIF p_action IN ('start','complete','fail') AND entry.request_id IS NULL THEN
    RAISE EXCEPTION 'AI_REQUEST_NOT_FOUND' USING ERRCODE='22023';
  END IF;
  result := jsonb_build_object('started',false);
  IF p_action='start' AND entry.state='reserved' THEN
    UPDATE kubo_limits_private.ai_generations SET state='started',updated_at=clock_timestamp()
      WHERE request_id=p_request RETURNING * INTO entry;
    result := jsonb_build_object('started',true);
  ELSIF p_action='complete' AND entry.state='started' THEN
    IF p_content IS NULL OR length(btrim(p_content)) NOT BETWEEN 1 AND 30000 THEN
      RAISE EXCEPTION 'INVALID_AI_CONTENT' USING ERRCODE='22023';
    END IF;
    INSERT INTO public.ai_insights(user_id,project_id,period_days,model,content)
      VALUES(p_actor,p_project,p_days,p_model,p_content)
      RETURNING to_jsonb(ai_insights.*) INTO saved;
    UPDATE kubo_limits_private.ai_generations SET state='succeeded',insight_id=(saved->>'id')::uuid,
      usage=p_usage,updated_at=clock_timestamp() WHERE request_id=p_request RETURNING * INTO entry;
  ELSIF p_action='fail' AND entry.state IN ('reserved','started') THEN
    UPDATE kubo_limits_private.ai_generations SET state=CASE WHEN state='reserved' THEN 'failed' ELSE 'uncertain' END,
      updated_at=clock_timestamp() WHERE request_id=p_request RETURNING * INTO entry;
  END IF;
  IF entry.insight_id IS NOT NULL THEN
    SELECT to_jsonb(i.*) INTO saved FROM public.ai_insights i WHERE id=entry.insight_id AND user_id=p_actor AND project_id=p_project;
  END IF;
  SELECT count(*) INTO used_count FROM kubo_limits_private.ai_generations
    WHERE organization_id=org_id AND quota_month=month_start AND state<>'failed';
  RETURN result || jsonb_build_object('request_id',entry.request_id,'state',entry.state,'latest',saved,
    'used',used_count,'limit',monthly_limit,'remaining',greatest(0,monthly_limit-used_count),
    'resets_at',(month_start+interval '1 month') AT TIME ZONE 'UTC',
    'can_generate',paid AND (platform_admin OR actor_role IN ('owner','admin','editor')));
END;
$$;
REVOKE ALL ON FUNCTION public.manage_ai_generation(uuid,uuid,text,uuid,integer,text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.manage_ai_generation(uuid,uuid,text,uuid,integer,text,text,jsonb) TO service_role;
