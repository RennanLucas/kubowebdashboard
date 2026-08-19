-- Drop the trigger and function that automatically assigns admin based on email
DROP TRIGGER IF EXISTS assign_admin_on_signup_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.assign_admin_on_signup();
