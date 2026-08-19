-- ============================================================================================
-- MIGRATION: Migrate Legacy Users to B2B
-- DESCRIPTION: Generates organizations for users without one and migrates legacy subscriptions.
-- SAFE TO RETRY: Yes (Idempotent)
-- ============================================================================================

DO $$
DECLARE
    v_user RECORD;
    v_new_org_id UUID;
BEGIN
    -- 1. Create organizations and owner memberships for users without any organization
    FOR v_user IN 
        SELECT id, email 
        FROM auth.users 
        WHERE id NOT IN (SELECT user_id FROM public.organization_members)
    LOOP
        v_new_org_id := gen_random_uuid();
        
        -- Insert Organization
        INSERT INTO public.organizations (id, name)
        VALUES (v_new_org_id, 'Personal Workspace - ' || COALESCE(split_part(v_user.email, '@', 1), 'User'));
        
        -- Insert Membership as Owner
        INSERT INTO public.organization_members (organization_id, user_id, role)
        VALUES (v_new_org_id, v_user.id, 'owner');
        
        RAISE NOTICE 'Created organization % for user %', v_new_org_id, v_user.email;
    END LOOP;

    -- 2. Migrate legacy subscriptions that lack an organization_id
    -- We link it to the organization where the subscription's user is the 'owner'
    UPDATE public.subscriptions s
    SET organization_id = subquery.organization_id
    FROM (
        SELECT DISTINCT ON (user_id) user_id, organization_id 
        FROM public.organization_members 
        WHERE role = 'owner'
        ORDER BY user_id
    ) AS subquery
    WHERE s.organization_id IS NULL 
      AND s.user_id = subquery.user_id;

    RAISE NOTICE 'Migrated legacy subscriptions successfully.';
END $$;
