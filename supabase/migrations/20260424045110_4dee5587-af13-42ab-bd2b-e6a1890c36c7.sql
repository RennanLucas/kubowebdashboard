-- 1. Goals table
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  month DATE NOT NULL,
  visitors_target INTEGER NOT NULL DEFAULT 0,
  leads_target INTEGER NOT NULL DEFAULT 0,
  revenue_target NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (project_id, month)
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own goals"
ON public.goals
FOR ALL
USING (EXISTS (
  SELECT 1 FROM projects p
  JOIN clients c ON c.id = p.client_id
  WHERE p.id = goals.project_id AND c.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM projects p
  JOIN clients c ON c.id = p.client_id
  WHERE p.id = goals.project_id AND c.user_id = auth.uid()
));

CREATE TRIGGER goals_set_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_goals_project_month ON public.goals(project_id, month DESC);

-- 2. Web Vitals table
CREATE TABLE public.web_vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  session_id TEXT,
  page_path TEXT NOT NULL DEFAULT '/',
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  rating TEXT,
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.web_vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert web vitals"
ON public.web_vitals
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Project owners can view web vitals"
ON public.web_vitals
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM projects p
  JOIN clients c ON c.id = p.client_id
  WHERE p.id = web_vitals.project_id AND c.user_id = auth.uid()
));

CREATE INDEX idx_web_vitals_project_created ON public.web_vitals(project_id, created_at DESC);
CREATE INDEX idx_web_vitals_metric ON public.web_vitals(project_id, metric_name, created_at DESC);

-- 3. Dashboard layouts table
CREATE TABLE public.dashboard_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  layout JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own dashboard layout"
ON public.dashboard_layouts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER dashboard_layouts_set_updated_at
BEFORE UPDATE ON public.dashboard_layouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Monthly ad spend on clients
ALTER TABLE public.clients
ADD COLUMN monthly_ad_spend NUMERIC NOT NULL DEFAULT 0;