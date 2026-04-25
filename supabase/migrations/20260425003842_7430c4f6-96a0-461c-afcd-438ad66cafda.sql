-- Move pg_net by recreating it in extensions schema (does not support SET SCHEMA)
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net WITH SCHEMA extensions;

-- Tighten permissive INSERT policies on tracking tables
DROP POLICY IF EXISTS "Anyone can insert pageviews" ON public.pageviews;
CREATE POLICY "Anyone can insert pageviews"
ON public.pageviews
FOR INSERT
TO anon, authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = pageviews.project_id));

DROP POLICY IF EXISTS "Anyone can insert events" ON public.events;
CREATE POLICY "Anyone can insert events"
ON public.events
FOR INSERT
TO anon, authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = events.project_id));

DROP POLICY IF EXISTS "Anyone can insert web vitals" ON public.web_vitals;
CREATE POLICY "Anyone can insert web vitals"
ON public.web_vitals
FOR INSERT
TO anon, authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = web_vitals.project_id));

-- Remove broad SELECT (listing) policy from public bucket
DROP POLICY IF EXISTS "Public read access for email-assets" ON storage.objects;