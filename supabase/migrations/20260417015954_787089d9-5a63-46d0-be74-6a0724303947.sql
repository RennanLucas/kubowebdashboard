-- Enum de papéis
do $$ begin
  create type public.app_role as enum ('admin', 'user');
exception when duplicate_object then null; end $$;

-- Tabela de papéis
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

drop policy if exists "Users can view own roles" on public.user_roles;
create policy "Users can view own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Service role manages roles" on public.user_roles;
create policy "Service role manages roles"
  on public.user_roles
  as permissive
  for all
  to service_role
  using (true)
  with check (true);

-- Função has_role (security definer evita recursão de RLS)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- Promove o admin existente (se já cadastrado)
insert into public.user_roles (user_id, role)
select id, 'admin'::app_role
from auth.users
where lower(email) = 'rennanlucas27oficial@gmail.com'
on conflict (user_id, role) do nothing;

-- Trigger para promover automaticamente caso o admin se (re)cadastre
create or replace function public.assign_admin_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(new.email) = 'rennanlucas27oficial@gmail.com' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin'::app_role)
    on conflict (user_id, role) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists assign_admin_on_signup_trigger on auth.users;
create trigger assign_admin_on_signup_trigger
after insert on auth.users
for each row execute function public.assign_admin_on_signup();