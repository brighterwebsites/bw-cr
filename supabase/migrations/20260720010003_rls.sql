-- BW-CRM schema v1 — RLS + grants
-- Solo admin for now: authenticated full access; anon blocked.
-- Tighten per-row ownership when profiles / multi-user land.

-- ── Enable RLS ─────────────────────────────────────────────────────────
alter table public.project_stages       enable row level security;
alter table public.customers            enable row level security;
alter table public.projects             enable row level security;
alter table public.project_deliverables enable row level security;
alter table public.assets               enable row level security;
alter table public.artifacts            enable row level security;
alter table public.tasks                enable row level security;
alter table public.metrics_snapshots    enable row level security;
alter table public.competitor_snapshots enable row level security;

-- ── Grants ─────────────────────────────────────────────────────────────
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;

-- project_stages is reference data — read for all authenticated
create policy "project_stages_select_authenticated"
  on public.project_stages
  for select
  to authenticated
  using (true);

-- Mutating reference data: authenticated for now (solo); lock down later
create policy "project_stages_write_authenticated"
  on public.project_stages
  for all
  to authenticated
  using (true)
  with check (true);

-- ── CRUD policies (authenticated, all rows) ────────────────────────────
create policy "customers_all_authenticated"
  on public.customers for all to authenticated
  using (true) with check (true);

create policy "projects_all_authenticated"
  on public.projects for all to authenticated
  using (true) with check (true);

create policy "project_deliverables_all_authenticated"
  on public.project_deliverables for all to authenticated
  using (true) with check (true);

create policy "assets_all_authenticated"
  on public.assets for all to authenticated
  using (true) with check (true);

create policy "artifacts_all_authenticated"
  on public.artifacts for all to authenticated
  using (true) with check (true);

create policy "tasks_all_authenticated"
  on public.tasks for all to authenticated
  using (true) with check (true);

create policy "metrics_snapshots_all_authenticated"
  on public.metrics_snapshots for all to authenticated
  using (true) with check (true);

create policy "competitor_snapshots_all_authenticated"
  on public.competitor_snapshots for all to authenticated
  using (true) with check (true);
