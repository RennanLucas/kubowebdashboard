-- Complete the existing invitation link flow without exposing invite hashes.
-- Existing accept_invite still performs recipient/status/expiry checks.
CREATE OR REPLACE FUNCTION public.accept_invite_token(invite_token text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_invite_id uuid;
  v_org_id uuid;
BEGIN
  IF auth.uid() IS NULL OR invite_token IS NULL
    OR invite_token !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Invite not found or not valid';
  END IF;
  SELECT i.id, i.organization_id INTO v_invite_id, v_org_id
  FROM public.organization_invites i
  JOIN auth.users u ON u.id = auth.uid()
  WHERE i.token_hash = encode(sha256(convert_to(invite_token, 'UTF8')), 'hex')
    AND lower(i.email) = lower(u.email)
    AND u.email_confirmed_at IS NOT NULL
    AND i.status = 'pending' AND i.expires_at > now()
  FOR UPDATE OF i;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or not valid';
  END IF;
  PERFORM public.accept_invite(v_invite_id);
  RETURN v_org_id;
END;
$$;
REVOKE ALL ON FUNCTION public.accept_invite_token(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_invite_token(text) TO authenticated;
