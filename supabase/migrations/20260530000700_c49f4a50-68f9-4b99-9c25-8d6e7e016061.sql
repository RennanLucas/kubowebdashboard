
DROP POLICY IF EXISTS "Users insert own ai insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users view own ai insights" ON public.ai_insights;
DROP POLICY IF EXISTS "Users delete own ai insights" ON public.ai_insights;

CREATE POLICY "Users insert own ai insights"
ON public.ai_insights
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (
    project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE p.id = ai_insights.project_id AND c.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users view own ai insights"
ON public.ai_insights
FOR SELECT
USING (
  auth.uid() = user_id
  AND (
    project_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.clients c ON c.id = p.client_id
      WHERE p.id = ai_insights.project_id AND c.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users delete own ai insights"
ON public.ai_insights
FOR DELETE
USING (auth.uid() = user_id);
