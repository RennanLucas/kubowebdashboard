
-- Raw pageviews table for custom tracking
CREATE TABLE public.pageviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL DEFAULT '/',
  referrer TEXT,
  user_agent TEXT,
  country TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_pageviews_project_date ON public.pageviews (project_id, created_at DESC);
CREATE INDEX idx_pageviews_session ON public.pageviews (project_id, session_id);

-- Enable RLS
ALTER TABLE public.pageviews ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anon (tracking script sends data without auth)
CREATE POLICY "Anyone can insert pageviews"
ON public.pageviews
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only project owners can read their pageviews
CREATE POLICY "Project owners can view pageviews"
ON public.pageviews
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN clients c ON c.id = p.client_id
    WHERE p.id = pageviews.project_id
    AND c.user_id = auth.uid()
  )
);
