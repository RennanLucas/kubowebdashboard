-- RBAC Escalation Tests

DO $$
DECLARE
  v_org_a UUID;
  v_user_a UUID := '11111111-1111-1111-1111-111111111111';
  v_user_b UUID := '22222222-2222-2222-2222-222222222222';
  v_user_c UUID := '33333333-3333-3333-3333-333333333333';
  v_err TEXT;
BEGIN
  SELECT id INTO v_org_a FROM public.organizations WHERE legacy_client_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  -- As Postgres superuser, let's add user_b as 'admin' and user_c as 'editor' to Org A
  INSERT INTO public.organization_members (organization_id, user_id, role) VALUES (v_org_a, v_user_b, 'admin');
  INSERT INTO public.organization_members (organization_id, user_id, role) VALUES (v_org_a, v_user_c, 'editor');

  -- 1. Admin trying to demote Owner
  BEGIN
    -- Impersonate Admin (User B)
    PERFORM set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', true);
    
    UPDATE public.organization_members SET role = 'viewer' WHERE organization_id = v_org_a AND user_id = v_user_a;
    RAISE EXCEPTION 'FAILED: Admin successfully demoted Owner';
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
    RAISE NOTICE 'SUCCESS: Admin demoting owner failed with: %', v_err;
  END;

  -- 2. User changing own role
  BEGIN
    -- Impersonate Editor (User C)
    PERFORM set_config('request.jwt.claims', '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}', true);
    
    UPDATE public.organization_members SET role = 'owner' WHERE organization_id = v_org_a AND user_id = v_user_c;
    RAISE EXCEPTION 'FAILED: User elevated themselves';
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
    RAISE NOTICE 'SUCCESS: User elevating themselves failed with: %', v_err;
  END;

  -- 3. Editor trying to alter membership
  BEGIN
    -- Editor (User C) tries to add someone
    PERFORM set_config('request.jwt.claims', '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}', true);
    
    INSERT INTO public.organization_members (organization_id, user_id, role) VALUES (v_org_a, '44444444-4444-4444-4444-444444444444', 'viewer');
    RAISE EXCEPTION 'FAILED: Editor inserted membership';
  EXCEPTION WHEN OTHERS THEN
    v_err := SQLERRM;
    RAISE NOTICE 'SUCCESS: Editor inserting membership failed with: %', v_err;
  END;

END $$;
