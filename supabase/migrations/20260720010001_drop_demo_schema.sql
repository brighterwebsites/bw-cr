-- BW-CRM: wipe demo/training tables from the original setup-supabase*.sql era.
-- Safe: no production users; data was disposable demo only.

-- Auth-era helpers/tables that FKs into old customers (TEXT ids)
drop function if exists public.is_admin() cascade;
drop table if exists public.profiles cascade;

drop table if exists public.tasks cascade;
drop table if exists public.projects cascade;
drop table if exists public.customers cascade;

-- Any partial v1 objects from a failed apply
drop table if exists public.competitor_snapshots cascade;
drop table if exists public.metrics_snapshots cascade;
drop table if exists public.artifacts cascade;
drop table if exists public.assets cascade;
drop table if exists public.project_deliverables cascade;
drop table if exists public.project_stages cascade;

-- Leftover types from earlier experiments / failed applies
drop type if exists public.customer_lifecycle cascade;
drop type if exists public.deliverable_type cascade;
drop type if exists public.deliverable_status cascade;
drop type if exists public.task_status cascade;
drop type if exists public.task_type cascade;
drop type if exists public.asset_type cascade;
drop type if exists public.artifact_type cascade;
drop type if exists public.artifact_status cascade;
drop type if exists public.content_type cascade;
drop type if exists public.snapshot_type cascade;
drop type if exists public.competitor_type cascade;
drop type if exists public.connection_status cascade;
