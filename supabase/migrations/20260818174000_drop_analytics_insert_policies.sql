-- Drop public insert policies since analytics insertion is handled securely via Edge Function (track) using service_role
DROP POLICY IF EXISTS "Anyone can insert events" ON public.events;
DROP POLICY IF EXISTS "Anyone can insert pageviews" ON public.pageviews;
