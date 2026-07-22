# SEO integrations plan

**Status:** draft · **Schema:** [`SCHEMA-v2-seo.md`](SCHEMA-v2-seo.md) · **Rule:** [ai-workflow-efficiency](../../.cursor/rules/ai-workflow-efficiency.mdc)

---

## Overview

| Provider | Phase | Direction | Trigger | Output tables |
|---|---|---|---|---|
| Google Search Console | A–B | Pull | Scheduled + manual | `metrics_snapshots`, `page_metrics_current`, `seo_opportunities` |
| Google Analytics 4 | A | Pull | Scheduled | `metrics_snapshots` (conversions, engagement) |
| WordPress | C | Pull first; push later | Scheduled + manual | `asset_pages` meta fields |
| Supabase Vault | B | Store | On connect | `asset_connections.secret_ref` |
| Hermes | D | Dispatch | On approved `agent_task` | `tasks` status updates |
| DataForSEO | — | Already partial | Manual / existing | `competitor_snapshots`, `health_score` |

---

## Google Search Console

### Purpose

- Site-level 28-day metrics → Performance dashboard cards
- Page-level metrics → Pages table + opportunity scoring input

### Auth — **AGREED: per asset**

Each `managed_website` asset has its own GSC connection:

| Stored where | Contents |
|---|---|
| Vault (`gsc-asset-{asset_id}`) | OAuth refresh token only |
| `asset_connections.config` | `{ "property": "sc-domain:example.com.au", "site_url": "https://…" }` |
| `asset_connections.secret_ref` | `gsc-asset-{asset_id}` |

Use **Google user OAuth** (not a shared service account) so each client site is authorized under the correct Search Console property.

One Google Cloud OAuth client app for the agency is fine — **tokens are per asset**, not shared.

#### Duplicate setup from… (admin)

Speeds onboarding a new asset without retyping config:

1. Operator picks **Duplicate setup from…** → selects a source asset.
2. System copies **`asset_connections.config`** (property URL pattern, site URL, any shared non-secret defaults).
3. **`secret_ref` stays empty** until the operator completes **Connect GSC** for the new asset.
4. OAuth flow writes a **new** vault entry — never clone the source refresh token.
5. Optional guard: reject if the new OAuth grant resolves to the same GSC property already bound to a different asset (unless operator explicitly overrides).

Same pattern applies to GA4 and WordPress connections later.

#### Agency Google Cloud project

Single OAuth client in Brighter Websites’ GCP project; redirect URI points at BW-CRM Edge Function callback. Per-asset tokens stored separately in Vault.

### API usage (no LLM)

Use [Search Console API](https://developers.google.com/webmaster-tools/v1/api_reference_index):

| Call | Dimensions | Use |
|---|---|---|
| `searchanalytics.query` | none (site aggregate) | `metrics_snapshots` |
| `searchanalytics.query` | `page` | `page_metrics_current` |
| Optional | `page` + `query` (top N) | `evidence_json` on opportunities only — cap at 10 queries per opp |

### Cadence

| Job | Frequency | Model |
|---|---|---|
| Site metrics refresh | Daily | Script only |
| Page metrics + opportunity scan | 2–3× / week | Script only |

### Edge Function chain (proposed)

```text
gsc-auth           → resolve token from vault
gsc-pull-site      → write metrics_snapshots
gsc-pull-pages     → upsert asset_pages + page_metrics_current
seo-score-pages    → upsert seo_opportunities (rule engine)
```

Each function is independently invokable for testing and reuse.

### Error handling

- Set `assets.gsc_status` → `error` with message in `asset_connections.last_error`
- Do not delete last good snapshot on transient failure

---

## Google Analytics 4

### Purpose

Populate GA4 columns already on v1 `metrics_snapshots`: `conversions`, `engagement_rate`, `avg_session_duration` (+ deltas).

### Auth

- GA4 Data API; service account with property access
- `assets.conversion_event_name` selects which event counts as conversion

### Cadence

Daily, same window as GSC (28 days vs prior 28 days).

### Notes

- Keep GA4 separate from opportunity scoring in v1 — GSC drives opps
- Align date ranges with GSC job for consistent dashboard period

---

## WordPress

### Purpose

- Build/maintain `asset_pages` from published content
- Surface SCOS meta: workflow, indexation status, cluster, topic
- Eventually push approved meta changes back

### Auth options (pick per asset in `asset_connections.config`)

| Method | Vault secret | Use case |
|---|---|---|
| REST API | Application password or JWT | Read posts, post_meta, options |
| WP-CLI over SSH | SSH key + user | Bulk ops, options table, MU plugin hooks |
| MCP (future) | Same as REST/SSH | Agent execution path |

**Never store** raw passwords or keys in Postgres columns.

### Pull scope (phase C read-only)

| Source | Maps to |
|---|---|
| `wp_posts` (publish status) | `asset_pages` url, title, post_id, post_type |
| `post_meta` — configurable keys | `workflow`, `indexation_status`, `cluster_slug`, `topic_slug` |
| `options` — selected keys | Site-level config if needed |

Config example in `asset_connections.config`:

```json
{
  "site_url": "https://example.com.au",
  "meta_keys": {
    "workflow": "_scos_workflow",
    "indexation_status": "_scos_indexation",
    "cluster_slug": "_scos_cluster",
    "topic_slug": "_scos_topic"
  }
}
```

### Sync direction policy

| Field | Owner (v1) | v2 push |
|---|---|---|
| URL, title | WordPress | — |
| GSC metrics | CRM (from API) | — |
| workflow, cluster, topic | **TBD** — document per field | Bidirectional with audit |
| indexation_status | Prefer GSC + WP cross-check | Manual approval for WP write |

### Conflict rule (default)

**WordPress wins** on content/meta unless user explicitly edits in CRM and clicks “Push to WP” → creates audited command.

---

## Hermes (phase D)

### Purpose

Execute approved `agent_task` rows using per-asset profile, skill, and workspace context.

### Not a data store

Hermes reads task payload from BW-CRM API or webhook — does **not** own metrics or opportunities.

### Dispatch payload (minimal)

```json
{
  "task_id": 123,
  "asset_id": 45,
  "skill": "seo-page",
  "hermes_profile": "100-up-off-grid-solar-seo",
  "page_url": "/our-systems/",
  "instructions": "Draft 3 title variants per approved plan",
  "credentials_ref": "asset-45-ssh"
}
```

### Approval

Align with SEO OS: approving a plan creates a bounded task — **no auto-publish**. See PARKED `agent_runs`.

### Integration with existing asset fields

| Field | Use |
|---|---|
| `assets.hermes_profile` | Route to correct Hermes profile |
| `assets.workspace` | VPS folder name |
| `assets.telegram_topic` | Optional notify on completion |

---

## Secrets & credentials

### Storage

| Secret type | Location | Reference |
|---|---|---|
| GSC OAuth refresh token | Supabase Vault | `gsc-asset-{id}` — **one per asset, never shared** |
| GA4 OAuth refresh token | Vault | `ga4-asset-{id}` — same per-asset rule |
| WP application password | Vault | `wp-asset-{id}'` |
| SSH private key | Vault | `ssh-asset-{id}'` |
| SSH user, DB prefix | `asset_connections.config` (non-secret) | plain text ok |

### Access pattern

Only Edge Functions with service role resolve vault secrets. Browser never sees tokens.

### UI

Assets → Integrations panel:

- Connect / disconnect per provider
- Status pill (reuse `connection_status`)
- Last sync time
- Test connection button → invokes `test-connection` Edge Function

---

## Scheduling

### Recommended: Supabase pg_cron + Edge Functions

| Job | Cron | Function |
|---|---|---|
| GSC site metrics | `0 2 * * *` | `gsc-pull-site` |
| GSC pages + score | `0 3 * * 1,3,5` | chain: pull-pages → score |
| GA4 site metrics | `30 2 * * *` | `ga4-pull-site` |
| WP meta sync | `0 4 * * *` | `wp-sync-pages` |

Manual refresh: button on Asset detail → `POST /functions/v1/seo-refresh?asset_id=`

### Alternative

VPS cron invoking same Edge Functions via authenticated HTTP — only if OAuth refresh is easier to maintain on VPS.

---

## SEO OS sync bridge — not used

SEO OS `seo_os_sync.py` pushes VPS SQLite → Cloudflare D1. BW-CRM replaces this with **direct Postgres writes** from Edge Functions.

Reference the bridge for:

- Column naming conventions
- Sanitization rules (no raw Telegram IDs in display DB)
- Which fields are operational vs secret

---

## Observability

| Signal | Where |
|---|---|
| Job success/failure | `asset_connections.last_sync_at`, `last_error` |
| Scan summary | PARKED `seo_scan_runs` or Edge Function logs |
| Opportunity counts | query `seo_opportunities` by `detected_at` |
| Token spend | N/A for script jobs; log model calls when agents run |

---

## Security checklist

- [ ] RLS on all new tables (`authenticated` only for v1 solo admin)
- [ ] Vault secrets never returned to client
- [ ] WP/SSH credentials scoped per asset
- [ ] Agent tasks cannot execute without explicit status + type
- [ ] Publish/deploy/outreach blocked at Edge Function allowlist until approval flow exists
