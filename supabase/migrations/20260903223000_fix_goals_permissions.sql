-- Make goals writes reliable while retaining project and organization isolation.
CREATE OR REPLACE FUNCTION public.can_view_project_goals(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE p.id = p_project_id
      AND om.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1
    FROM public.projects p
    JOIN public.clients c ON c.id = p.client_id
    WHERE p.id = p_project_id
      AND p.organization_id IS NULL
      AND c.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_project_goals(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    JOIN public.organization_members om ON om.organization_id = p.organization_id
    WHERE p.id = p_project_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'editor')
  ) OR EXISTS (
    SELECT 1
    FROM public.projects p
    JOIN public.clients c ON c.id = p.client_id
    WHERE p.id = p_project_id
      AND p.organization_id IS NULL
      AND c.user_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.can_view_project_goals(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_manage_project_goals(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_project_goals(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_project_goals(UUID) TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
REVOKE ALL ON public.goals FROM anon;

DROP POLICY IF EXISTS "Organization members can view goals" ON public.goals;
DROP POLICY IF EXISTS "Organization editors can manage goals" ON public.goals;

CREATE POLICY "Organization members can view goals"
ON public.goals FOR SELECT TO authenticated
USING (public.can_view_project_goals(project_id));

CREATE POLICY "Organization editors can manage goals"
ON public.goals FOR ALL TO authenticated
USING (public.can_manage_project_goals(project_id))
WITH CHECK (public.can_manage_project_goals(project_id));
