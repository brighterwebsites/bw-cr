-- private schema tables aren't reachable via PostgREST (only 'public' is
-- exposed by default, per pgrst.db_schemas) — every integrations-save/
-- -status call was failing with 500 because .schema('private') isn't a
-- valid REST target, even from a service-role client. Move to public +
-- RLS-enabled-no-policies + explicit revokes, matching the existing
-- asset_connection_secrets lockdown pattern.

drop table private.integrations;

create table public.integrations (
  provider      text primary key check (provider in ('email')),
  config        jsonb not null default '{}',
  secret        text,
  secret_last4  text not null default '',
  updated_at    timestamptz not null default now(),
  updated_by    uuid references public.profiles (id) on delete set null
);

alter table public.integrations enable row level security;
revoke all on public.integrations from public, anon, authenticated;
