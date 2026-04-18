CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID,
  content TEXT NOT NULL,
  period_days INTEGER NOT NULL DEFAULT 7,
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_insights_user_created ON public.ai_insights(user_id, created_at DESC);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ai insights"
ON public.ai_insights FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own ai insights"
ON public.ai_insights FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own ai insights"
ON public.ai_insights FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Service role manages ai insights"
ON public.ai_insights FOR ALL
TO service_role
USING (true) WITH CHECK (true);