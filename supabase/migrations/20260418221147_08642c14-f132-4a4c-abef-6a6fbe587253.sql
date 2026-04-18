-- Enable realtime for pageviews
ALTER TABLE public.pageviews REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pageviews;

-- Alerts table
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_project_created ON public.alerts(project_id, created_at DESC);
CREATE INDEX idx_alerts_unread ON public.alerts(project_id, read) WHERE read = false;

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own alerts" ON public.alerts FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.projects p
  JOIN public.clients c ON c.id = p.client_id
  WHERE p.id = alerts.project_id AND c.user_id = auth.uid()
));

CREATE POLICY "Users update own alerts" ON public.alerts FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.projects p
  JOIN public.clients c ON c.id = p.client_id
  WHERE p.id = alerts.project_id AND c.user_id = auth.uid()
));

CREATE POLICY "Users delete own alerts" ON public.alerts FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.projects p
  JOIN public.clients c ON c.id = p.client_id
  WHERE p.id = alerts.project_id AND c.user_id = auth.uid()
));

CREATE POLICY "Service role manages alerts" ON public.alerts FOR ALL
TO service_role USING (true) WITH CHECK (true);

-- Alert preferences (thresholds + leads goal)
CREATE TABLE public.alert_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  traffic_threshold_pct integer NOT NULL DEFAULT 20,
  leads_goal_daily integer DEFAULT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alert_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own alert prefs" ON public.alert_preferences FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.projects p
  JOIN public.clients c ON c.id = p.client_id
  WHERE p.id = alert_preferences.project_id AND c.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.projects p
  JOIN public.clients c ON c.id = p.client_id
  WHERE p.id = alert_preferences.project_id AND c.user_id = auth.uid()
));

CREATE POLICY "Service role reads alert prefs" ON public.alert_preferences FOR SELECT
TO service_role USING (true);

CREATE TRIGGER update_alert_prefs_updated_at
BEFORE UPDATE ON public.alert_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable extensions for cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;