-- BW-CRM: restore profiles for auth (crm.html + future React RBAC)
-- Bootstrap: support@brighterwebsites.com.au as admin

create type public.app_role as enum ('admin', 'designer', 'customer');

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null default '',
  full_name   text not null default '',
  role        public.app_role not null,
  customer_id bigint null references public.customers (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

alter table public.profiles enable row level security;

grant select on public.profiles to authenticated;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

-- First admin (solo operator)
insert into public.profiles (id, email, full_name, role)
values (
  '9e18e9a5-9ec8-4e6a-a5ac-5b22c389a914',
  'support@brighterwebsites.com.au',
  'Vanessa Wood',
  'admin'
)
on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      role = excluded.role;
