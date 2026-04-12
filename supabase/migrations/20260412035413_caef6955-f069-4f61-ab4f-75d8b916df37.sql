
-- Add new columns to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS analytics_property_id TEXT;

-- Allow users to insert their own client
CREATE POLICY "Users can insert own client" ON public.clients
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own client
CREATE POLICY "Users can update own client" ON public.clients
FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to insert their own projects
CREATE POLICY "Users can insert own projects" ON public.projects
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.clients WHERE clients.id = projects.client_id AND clients.user_id = auth.uid())
);

-- Allow users to update their own projects
CREATE POLICY "Users can update own projects" ON public.projects
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.clients WHERE clients.id = projects.client_id AND clients.user_id = auth.uid())
);
