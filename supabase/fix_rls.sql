CREATE POLICY "Users can view own legacy subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = user_id AND organization_id IS NULL);
