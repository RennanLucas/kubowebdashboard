
-- 1) Tighten email infrastructure tables: restrict policies to service_role role explicitly

-- email_send_log
DROP POLICY IF EXISTS "Service role can insert send log" ON public.email_send_log;
DROP POLICY IF EXISTS "Service role can read send log" ON public.email_send_log;
DROP POLICY IF EXISTS "Service role can update send log" ON public.email_send_log;

CREATE POLICY "Service role manages send log"
ON public.email_send_log
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- email_send_state
DROP POLICY IF EXISTS "Service role can manage send state" ON public.email_send_state;

CREATE POLICY "Service role manages send state"
ON public.email_send_state
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- email_unsubscribe_tokens
DROP POLICY IF EXISTS "Service role can insert tokens" ON public.email_unsubscribe_tokens;
DROP POLICY IF EXISTS "Service role can mark tokens as used" ON public.email_unsubscribe_tokens;
DROP POLICY IF EXISTS "Service role can read tokens" ON public.email_unsubscribe_tokens;

CREATE POLICY "Service role manages unsubscribe tokens"
ON public.email_unsubscribe_tokens
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- suppressed_emails
DROP POLICY IF EXISTS "Service role can insert suppressed emails" ON public.suppressed_emails;
DROP POLICY IF EXISTS "Service role can read suppressed emails" ON public.suppressed_emails;

CREATE POLICY "Service role manages suppressed emails"
ON public.suppressed_emails
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2) Revoke EXECUTE on internal SECURITY DEFINER email-queue helpers from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
