-- BW-CRM schema v1 — version bump + updated_at triggers

create or replace function private.bump_row_version()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Tables with version column
create trigger bump_customers_version
  before update on public.customers
  for each row execute function private.bump_row_version();

create trigger bump_projects_version
  before update on public.projects
  for each row execute function private.bump_row_version();

create trigger bump_assets_version
  before update on public.assets
  for each row execute function private.bump_row_version();

create trigger bump_artifacts_version
  before update on public.artifacts
  for each row execute function private.bump_row_version();

create trigger bump_tasks_version
  before update on public.tasks
  for each row execute function private.bump_row_version();

create trigger bump_metrics_snapshots_version
  before update on public.metrics_snapshots
  for each row execute function private.bump_row_version();

create trigger bump_competitor_snapshots_version
  before update on public.competitor_snapshots
  for each row execute function private.bump_row_version();

-- Deliverables: no version column — touch updated_at only
create trigger touch_project_deliverables_updated_at
  before update on public.project_deliverables
  for each row execute function private.touch_updated_at();
