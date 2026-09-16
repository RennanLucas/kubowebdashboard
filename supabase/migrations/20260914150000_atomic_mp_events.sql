-- Serialization does not assume the old non-unique external_id index is unique.
-- Historical signup trials used the invalid label "production". Normalize
-- those still-valid rows, then make future drift impossible.
UPDATE public.subscriptions SET environment = 'live' WHERE environment = 'production';

-- Administrative access must be granted deliberately by service_role. Keeping
-- an email-address bootstrap trigger would silently restore elevated access if
-- that address were deleted and registered again.
DROP TRIGGER IF EXISTS assign_admin_on_signup_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.assign_admin_on_signup();
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_environment_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_environment_check
  CHECK (environment IN ('live','sandbox')) NOT VALID;
ALTER TABLE public.subscriptions VALIDATE CONSTRAINT subscriptions_environment_check;

-- A Free signup must remain Free. Pro/trial access begins only through the
-- explicit checkout flow, which records a provider-backed bounded period.
DROP TRIGGER IF EXISTS on_auth_user_created_trial ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_trial();

CREATE SCHEMA IF NOT EXISTS kubo_limits_private;
REVOKE ALL ON SCHEMA kubo_limits_private FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION kubo_limits_private.payment_environment()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE current_setting('app.settings.payment_environment',true)
    WHEN 'sandbox' THEN 'sandbox'
    ELSE 'live'
  END;
$$;
REVOKE ALL ON FUNCTION kubo_limits_private.payment_environment() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION kubo_limits_private.history_days(org_id uuid, actor uuid)
RETURNS integer LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE sub record; active_environment text := kubo_limits_private.payment_environment();
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=actor AND role='admin') THEN RETURN 365; END IF;
  SELECT status,current_period_end INTO sub FROM public.subscriptions
    WHERE organization_id=org_id AND environment=active_environment ORDER BY created_at DESC LIMIT 1;
  IF FOUND AND lower(sub.status) IN ('active','trialing','authorized','approved','canceled','cancelled')
    AND sub.current_period_end > now() THEN RETURN 365; END IF;
  SELECT status,current_period_end INTO sub FROM public.subscriptions
    WHERE user_id=actor AND organization_id IS NULL AND environment=active_environment
    ORDER BY created_at DESC LIMIT 1;
  IF FOUND AND lower(sub.status) IN ('active','trialing','authorized','approved','canceled','cancelled')
    AND sub.current_period_end > now() THEN RETURN 365; END IF;
  RETURN 7;
END;
$$;
REVOKE ALL ON FUNCTION kubo_limits_private.history_days(uuid,uuid) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.apply_mp_subscription_event(p_payload jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE incoming public.subscriptions%ROWTYPE; existing public.subscriptions%ROWTYPE; duplicate_count integer;
BEGIN
  incoming := jsonb_populate_record(NULL::public.subscriptions,p_payload);
  IF incoming.external_id IS NULL OR incoming.external_id !~ '^[A-Za-z0-9_-]{1,128}$'
    OR incoming.user_id IS NULL OR incoming.last_event_ts IS NULL
    OR incoming.environment IS NULL OR incoming.environment NOT IN ('live','sandbox')
    OR incoming.provider IS DISTINCT FROM 'mercadopago' OR incoming.plan_id IS NULL
    OR incoming.status IS NULL OR incoming.status NOT IN ('active','trialing','pending','unpaid','rejected','refunded','charged_back','in_process','paused','canceled','cancelled')
    OR incoming.amount<0 THEN RAISE EXCEPTION 'MP_INVALID_PAYLOAD' USING ERRCODE='22023'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('mp:'||incoming.environment||':'||incoming.external_id,0));
  SELECT count(*) INTO duplicate_count FROM public.subscriptions
    WHERE provider=incoming.provider AND environment=incoming.environment AND external_id=incoming.external_id;
  IF duplicate_count>1 THEN RAISE EXCEPTION 'MP_DUPLICATE_SUBSCRIPTIONS'; END IF;
  SELECT * INTO existing FROM public.subscriptions
    WHERE provider=incoming.provider AND environment=incoming.environment AND external_id=incoming.external_id FOR UPDATE;
  IF FOUND THEN
    IF existing.user_id<>incoming.user_id OR existing.provider<>incoming.provider
      OR existing.environment<>incoming.environment OR existing.plan_id<>incoming.plan_id
      OR (incoming.organization_id IS NOT NULL AND existing.organization_id IS NOT NULL AND incoming.organization_id<>existing.organization_id) THEN
      RAISE EXCEPTION 'MP_SUBSCRIPTION_IDENTITY_CONFLICT' USING ERRCODE='42501';
    END IF;
    IF existing.last_event_ts>=incoming.last_event_ts THEN RETURN false; END IF;
    incoming.organization_id := coalesce(incoming.organization_id,existing.organization_id);
    incoming.current_period_start := coalesce(incoming.current_period_start,existing.current_period_start);
    incoming.current_period_end := coalesce(incoming.current_period_end,existing.current_period_end);
    incoming.trial_end := coalesce(incoming.trial_end,existing.trial_end);
    incoming.amount := coalesce(incoming.amount,existing.amount);
    incoming.payer_email := coalesce(incoming.payer_email,existing.payer_email);
  END IF;
  -- Never grant an unbounded active subscription from an incomplete snapshot.
  IF incoming.status IN ('active','trialing') AND incoming.current_period_end IS NULL THEN incoming.status:='pending'; END IF;
  IF existing.id IS NULL THEN
    INSERT INTO public.subscriptions(user_id,organization_id,provider,external_id,plan_id,status,amount,payer_email,
      current_period_start,current_period_end,trial_end,last_event_ts,environment,stripe_subscription_id,stripe_customer_id,
      product_id,price_id,cancel_at_period_end)
    VALUES(incoming.user_id,incoming.organization_id,'mercadopago',incoming.external_id,incoming.plan_id,incoming.status,
      incoming.amount,incoming.payer_email,incoming.current_period_start,incoming.current_period_end,incoming.trial_end,
      incoming.last_event_ts,incoming.environment,'mp_'||incoming.environment||'_'||incoming.external_id,
      incoming.stripe_customer_id,incoming.plan_id,incoming.plan_id,incoming.status IN ('canceled','cancelled'));
  ELSE
    UPDATE public.subscriptions SET organization_id=incoming.organization_id,plan_id=incoming.plan_id,
      status=incoming.status,amount=incoming.amount,payer_email=incoming.payer_email,
      current_period_start=incoming.current_period_start,current_period_end=incoming.current_period_end,
      trial_end=incoming.trial_end,last_event_ts=incoming.last_event_ts,updated_at=clock_timestamp(),
      cancel_at_period_end=incoming.status IN ('canceled','cancelled')
    WHERE id=existing.id;
  END IF;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.apply_mp_subscription_event(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_mp_subscription_event(jsonb) TO service_role;

-- The original helper lost its environment predicate in a historical
-- migration. Keep sandbox purchases completely isolated from live access and
-- require a bounded access period for every paid/trial grant.
CREATE OR REPLACE FUNCTION public.has_active_subscription(
  user_uuid uuid,
  check_env text DEFAULT 'live'::text
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT check_env IN ('live','sandbox') AND EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE user_id = user_uuid
      AND environment = check_env
      AND current_period_end > now()
      AND status IN ('active','trialing','authorized','approved','canceled','cancelled')
  );
$$;
REVOKE ALL ON FUNCTION public.has_active_subscription(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid,text) TO service_role;

-- The B2B policy intentionally exposes organization subscriptions to members,
-- but it also removed access to pre-organization rows. Restore only the
-- authenticated customer's own legacy row; no other user's row is visible.
DROP POLICY IF EXISTS "Users can view own legacy subscription" ON public.subscriptions;
CREATE POLICY "Users can view own legacy subscription" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (organization_id IS NULL AND user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_lookup
  ON public.subscriptions(provider,environment,external_id)
  WHERE external_id IS NOT NULL;

-- Keep only the newest pending invite per address and organization, preserving
-- older rows as revoked audit records rather than deleting history.
WITH ranked_invites AS (
  SELECT id,row_number() OVER (
    PARTITION BY organization_id,lower(email) ORDER BY created_at DESC,id DESC
  ) AS position
  FROM public.organization_invites WHERE status='pending'
)
UPDATE public.organization_invites AS invite SET status='revoked'
FROM ranked_invites AS ranked
WHERE invite.id=ranked.id AND ranked.position>1;

CREATE UNIQUE INDEX IF NOT EXISTS organization_invites_one_pending_email
  ON public.organization_invites(organization_id,lower(email))
  WHERE status='pending';
