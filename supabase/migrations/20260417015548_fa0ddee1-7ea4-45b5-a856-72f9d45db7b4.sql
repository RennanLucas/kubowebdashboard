drop policy if exists "Service role can manage subscriptions" on public.subscriptions;

create policy "Service role manages subscriptions"
  on public.subscriptions
  as permissive
  for all
  to service_role
  using (true)
  with check (true);