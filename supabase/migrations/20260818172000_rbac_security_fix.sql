-- 1. RPC to securely create an organization and insert the owner
CREATE OR REPLACE FUNCTION public.create_organization(org_name TEXT, org_domain TEXT, project_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Insert Organization
  INSERT INTO public.organizations (name, domain)
  VALUES (org_name, org_domain)
  RETURNING id INTO v_org_id;

  -- Insert Owner
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'owner');

  -- Insert Default Project
  INSERT INTO public.projects (organization_id, name, url)
  VALUES (v_org_id, project_name, org_domain);

  RETURN v_org_id;
END;
$$;

-- 2. RPC to securely accept an invitation
CREATE OR REPLACE FUNCTION public.accept_invite(invite_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_org_id UUID;
  v_role TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Find the invite
  SELECT organization_id, role INTO v_org_id, v_role
  FROM public.organization_invites
  WHERE id = invite_id AND email = v_user_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or email does not match';
  END IF;

  -- Insert member
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, v_user_id, v_role);

  -- Delete the invite
  DELETE FROM public.organization_invites WHERE id = invite_id;

  RETURN TRUE;
END;
$$;
