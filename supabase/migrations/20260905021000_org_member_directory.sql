create function public.list_organization_members(p_organization_id uuid)
returns table(user_id uuid, role text, created_at timestamptz, email text, full_name text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.organization_members m
    where m.organization_id = p_organization_id and m.user_id = auth.uid()
  ) then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;
  return query
    select m.user_id, m.role::text, m.created_at, u.email::text, p.full_name
    from public.organization_members m
    left join auth.users u on u.id = m.user_id
    left join public.profiles p on p.user_id = m.user_id
    where m.organization_id = p_organization_id
    order by m.created_at;
end;
$$;
revoke all on function public.list_organization_members(uuid) from public, anon;
grant execute on function public.list_organization_members(uuid) to authenticated;
