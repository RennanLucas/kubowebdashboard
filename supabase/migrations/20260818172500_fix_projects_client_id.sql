-- Make client_id nullable in projects to support B2B organizations
ALTER TABLE public.projects ALTER COLUMN client_id DROP NOT NULL;
