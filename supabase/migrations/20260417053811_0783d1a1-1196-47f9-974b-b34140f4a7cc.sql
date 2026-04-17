CREATE POLICY "Users can delete own projects"
ON public.projects
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM clients
  WHERE clients.id = projects.client_id
    AND clients.user_id = auth.uid()
));