-- Make monthly goals multi-tenant safe and persist Clarity per project.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS clarity_project_id TEXT;

DROP POLICY IF EXISTS "Users manage own goals" ON public.goals;
DROP POLICY IF EXISTS "Organization members can view goals" ON public.goals;
DROP POLICY IF EXISTS "Organization editors can manage goals" ON public.goals;

CREATE POLICY "Organization members can view goals"
ON public.goals FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.projects p
  JOIN public.organization_members om ON om.organization_id = p.organization_id
  WHERE p.id = goals.project_id AND om.user_id = auth.uid()
));

CREATE POLICY "Organization editors can manage goals"
ON public.goals FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.projects p
  JOIN public.organization_members om ON om.organization_id = p.organization_id
  WHERE p.id = goals.project_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin', 'editor')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.projects p
  JOIN public.organization_members om ON om.organization_id = p.organization_id
  WHERE p.id = goals.project_id
    AND om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin', 'editor')
));

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_clarity_project_id_format;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_clarity_project_id_format
  CHECK (clarity_project_id IS NULL OR clarity_project_id ~ '^[A-Za-z0-9_-]{5,64}$');
