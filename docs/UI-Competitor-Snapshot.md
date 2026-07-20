# Competitor Snapshot UI

Nav: CRM → Assets → asset detail → **Competitor snapshots** accordion

## Phase status

| Phase | Scope | Status |
|---|---|---|
| 1 | Schema: `competitor_analysis_runs`, `run_id` on snapshots, `managed_website` asset type | Done |
| 2 | UI shell: form, queue `pending` runs, history + detail panel | Done |
| 3 | Supabase Edge Function + live DataForSEO bulk pull | Done |

## Data model

- **Run** (`competitor_analysis_runs`): one atomic analysis per asset
  - `search_location_code` / `search_location_name` — DataForSEO location (default Australia `2036`)
  - `search_language_code` — e.g. `en`
  - `competitor_inputs` — jsonb array of `{ business_name, url, location }` (competitors only)
  - `status`: `pending` → `running` → `done` \| `failed`
- **Snapshots** (`competitor_snapshots`): one row per domain in the run
  - `type`: `target` (asset URL) + up to 4 `competitor`
  - `run_id` FK groups rows from the same run
  - Metric columns filled by Phase 3 Edge Function

## UI (Assets detail)

1. **New analysis** — target URL (read-only from asset), search market preset, 2–4 competitor rows
2. **Run analysis** — creates run + snapshots, then invokes `run-competitor-analysis` Edge Function
3. **Run history** — table: date, market, competitor count, status
4. **Run detail panel** — snapshot comparison table
   - **Run now** — retry a `pending` / `failed` run (same run id, overwrites snapshot metrics)
   - **Run again** — clone same competitors + market into a **new run** (keeps history for before/after)

## Asset types

| Enum | Meaning | List default |
|---|---|---|
| `managed_website` | Live client site we manage | Shown |
| `staging` | Staging / preview | Shown |
| `website` | Proposal-stage URL (not yet managed) | Hidden until **Show all types** |
| `other` | Non-website asset | Hidden until **Show all types** |

Existing seeded assets were migrated `website` → `managed_website`.

## DataForSEO credentials (Phase 3)

**Do not** put credentials in React `.env`, git, or Supabase client config.

Set as **Supabase Edge Function secrets** (server-side only):

**Dashboard:** Project Settings → Edge Functions → Secrets

**CLI:**

```bash
supabase secrets set \
  DATAFORSEO_LOGIN=your_login \
  DATAFORSEO_PASSWORD=your_password \
  --project-ref uvgzchkejlrqrgiorvwf
```

| Secret | Purpose |
|---|---|
| `DATAFORSEO_LOGIN` | DataForSEO API login (Basic auth) |
| `DATAFORSEO_PASSWORD` | DataForSEO API password |

Default search market: **Australia (`2036`) + `en`**.

## Edge Function

`run-competitor-analysis` — invoked from the app with `{ run_id }`.

**DataForSEO calls (per run):**
- `domain_rank_overview` — organic traffic, position buckets, keyword counts
- `backlinks/summary` — domain rank, backlinks, referring domains, spam score
- `domain_intersection` — keyword gap vs target (competitors only)

Deploy: `supabase functions deploy run-competitor-analysis --project-ref uvgzchkejlrqrgiorvwf`
