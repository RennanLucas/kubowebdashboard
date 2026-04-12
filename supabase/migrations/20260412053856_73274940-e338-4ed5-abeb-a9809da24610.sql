
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_label TEXT,
  page_path TEXT NOT NULL DEFAULT '/',
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert events" ON public.events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Project owners can view events" ON public.events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects p
    JOIN clients c ON c.id = p.client_id
    WHERE p.id = events.project_id AND c.user_id = auth.uid()
  ));

CREATE INDEX idx_events_project_created ON public.events (project_id, created_at);
CREATE INDEX idx_events_type ON public.events (event_type);
