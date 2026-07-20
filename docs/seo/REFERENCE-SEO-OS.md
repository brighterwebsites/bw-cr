# SEO OS reference inventory

**Status:** exploratory · **Sources:** cloned repos (Jul 2026)  
**Purpose:** what SEO OS actually ships today, so BW-CRM can imitate UX without copying architecture blindly.

---

## Repo relationship

```
NicoSKOOL/seo-os-ai-ranking          brighterwebsites/seo-os-brighter
├── server.py (Flask demo)           └── dashboard/ only (Cloudflare deploy)
├── scripts/seo_os_sync.py
├── scripts/setup_seo_os.py
├── docs/architecture.md
├── HERMES-INTEGRATION.md
├── config/default_workflows.json
└── dashboard/  ────────────────────► same code as seo-os-brighter
    ├── migrations/0001_init.sql
    ├── public/app.js
    └── src/index.ts (Worker API)
```

| Question | Answer |
|---|---|
| Which repo for UI? | Either — `public/app.js` is identical in both |
| Which repo for data flow? | Upstream full repo only |
| Custom Brighter fork? | No meaningful divergence yet (v1.0.0 dashboard slice) |

---

## Architecture (upstream)

From `docs/architecture.md`:

```text
Telegram / CLI → Hermes operator → per-client Hermes profile
  → VPS workspace → local SQLite → sync bridge → hosted dashboard
  → Google Docs / HTML reports
```

**Client filter rule:** every operational row has `client_id`. All views filter by selected client except explicit “All Clients” rows (`client_id = 'all'` for policy/events).

**Update model:**

- Daily refresh → metrics + opportunities picture
- Work-time → approvals, tasks, activity
- Dashboard shows summaries only — no raw credentials or full chat logs

---

## Data model (hosted D1 / VPS SQLite)

### Core operational tables (9 + tenancy)

| Table | Feeds UI | Notes |
|---|---|---|
| `clients` | Clients / Sites, client bar, health summary | Maps to BW-CRM `customers` + `assets` |
| `metrics_snapshots` | 28-Day Performance cards | **Site-level** GSC rollup; one row per client per period |
| `opportunities` | Opportunities, CTR Tests (derived), Content (derived) | **Page URL as text** — no `site_pages` table |
| `approval_requests` | Approvals | Human gate before agent execution |
| `agent_tasks` | Agent Tasks, Task Board | Execution queue for Hermes |
| `managed_jobs` | Schedule, Agent Capabilities | Recurring jobs (data refresh, opp scan, reviews) |
| `activity_events` | Activity Log, Command Center preview | Outcomes only, not Telegram transcript |
| `artifacts` | Reports (implicit) | VPS/R2/GDoc pointers |
| `settings` | Settings & Routing | Key-value per account |

### Hosted-only plumbing

| Table | Role |
|---|---|
| `accounts`, `account_members` | Multi-tenant auth (Cloudflare Access + password) |
| `commands` | Operator decisions queued **down** to VPS |
| `job_runs` | Real execution history (short log excerpt) |
| `chat_messages` | Dashboard chat relay to Hermes (Phase C) |

### Explicitly absent

- **`site_pages`** — pages are a `page` column on opportunities
- **Page-level metrics history** — only opportunity row carries impressions/clicks/ctr/position
- **WordPress sync** — not in schema
- **Query-level GSC storage** — not in dashboard DB

---

## Screen inventory

Source: `dashboard/public/app.js` (`NAV` + `view*` functions).  
API: single `GET /api/summary` aggregates all tables + computed KPIs.

### Global chrome

| Element | Behaviour | Data |
|---|---|---|
| Top client bar | All Clients + per-client tabs + Add Client | `clients` filtered by `visible_clients` |
| Scoped badge | “Scoped to {client}” when filtered | `state.client` |
| Integration pills | Hermes, Telegram, GSC, GA4 status | `clients.*_status`, `hermes_profile`, `telegram_topic` |
| Sidebar | 13 sections | Static `NAV` array |

---

### 1. Command Center — **KEEP (high priority)**

| Widget | Shows | Table(s) | Real? |
|---|---|---|---|
| KPI cards | Pending approvals, open tasks, high opps, active jobs, sites, health | aggregated | KPIs computed; underlying rows often **demo** |
| Needs Attention | Open approvals, failed/setup jobs, blocked tasks | approvals, jobs, tasks | UI real; data depends on sync |
| **28-Day Performance** | Per-client cards: clicks, impressions, CTR, avg rank + deltas | `metrics_snapshots` | **Schema real; values seeded or Hermes-inserted** |
| High-Impact Opportunities | Top 6 by impressions | `opportunities` | Same |
| Client Health Summary | Approvals, tasks, jobs, opps counts + next action | clients + joins | Derived |
| Approval / Schedule previews | Latest rows | approvals, jobs | Same |
| Agent Activity | Last 7 events | `activity_events` | Same |

**BW-CRM mapping:** new SEO home or section on Assets — read latest `metrics_snapshots` per `managed_website` asset (already in v1 schema).

---

### 2. Clients / Sites — **PARTIAL KEEP**

| Shows | Table | BW-CRM equivalent |
|---|---|---|
| Client cards with integration status | `clients` | `assets` detail + `customers` |
| Hermes profile, workspace, Telegram | `clients` | `assets.hermes_profile`, `workspace`, `telegram_topic` |
| Stats: tasks, opps, jobs, approvals | derived | extend asset detail |

**Skip:** duplicate client registry — BW-CRM already has customers → assets hierarchy.

---

### 3. Approvals — **LATER**

Human gate for plans before agent runs. Rows: title, type, risk, evidence, source URL, production_gate.

**BW-CRM mapping:** PARKED `agent_runs` + approval status on tasks — not v1 SEO phase.

---

### 4. SEO Opportunities — **KEEP (highest priority)**

Full cross-site table (filter by client bar + priority chips).

| Column | Field |
|---|---|
| # | row index |
| Client | `client_id` |
| Page | `page` (URL path displayed) |
| Problem | `problem` (human-readable, often generated) |
| Priority | `priority` (high / medium / low) |
| Impr. / Clicks / CTR / Pos. | baked into row at detection time |
| Recommended workflow | `recommended_workflow` |
| Status | `status` (new, task_created, needs_approval, complete, …) |

**Opportunity types** (from seed + HERMES-INTEGRATION.md): `Low CTR`, `Content refresh`, `SERP gap`, `Striking distance` — drive secondary views (Content, CTR Tests).

**Multiple issues per page:** multiple `opportunities` rows sharing the same `page` URL.

**Real scoring logic:** **not in open repo**. Template seeds fake rows; intended path is Hermes managed job → INSERT rows → sync.

**BW-CRM differ:** add `asset_pages` FK; rule engine in Edge Function (script, not LLM).

---

### 5. Agent Tasks — **KEEP (via existing Tasks)**

| Column | Maps to |
|---|---|
| title, priority, status | `tasks` |
| source | e.g. “SEO opportunity”, “Approved plan” |
| page_asset | URL string |
| next_action, owner_profile | notes + Hermes profile |
| task_type | `agent_task` in BW-CRM |

**BW-CRM:** extend `tasks` with `seo_opportunity_id`, optional `agent_skill` (PARKED).

---

### 6. Task Board — **SKIP for now**

Kanban grouped by status — marked “visual only this milestone” in source. List view is enough initially.

---

### 7. Content — **LATER**

Placeholder + filtered list of content-type opportunities (`Content refresh`, `SERP gap`, `Striking distance`). Full pipeline “lands in a later milestone.”

---

### 8. Schedule — **LATER**

Lists `managed_jobs`: cadence, next/last run, model_policy, data_sources.

Default jobs from `config/default_workflows.json`:

- Daily SEO OS refresh
- Performance snapshot refresh
- SEO opportunities scan (2–3×/week)
- Site health / index check (weekly)
- CTR test monitor, review monitor, expertise intake

**BW-CRM:** Supabase pg_cron or external scheduler invoking Edge Functions — no `managed_jobs` table in phase A.

---

### 9. Activity Log — **SHOULD (lightweight)**

Filtered event stream from `activity_events`. Good audit trail for “data refreshed”, “approval requested”.

**BW-CRM:** PARKED `activity_events` or reuse artifacts + task status changes initially.

---

### 10. CTR Tests — **LATER**

Derived view: opportunities where `opportunity_type = 'Low CTR'` or `ctr < 2`. Not a separate table.

---

### 11. Reviews — **OUT (for BW-CRM v1 SEO)**

Separate migration `0002_reviews.sql` in SEO OS. Zernio/GBP review workflow — valuable but not core to Vanessa’s stated priorities.

---

### 12. Agent Capabilities — **LATER**

Derived from `managed_jobs` — shows what agents *can* do per data source.

---

### 13. Settings & Routing — **PARTIAL**

Integration connection tracking, Telegram routing. **BW-CRM:** `asset_connections` (PARKED) + Assets integration panel.

---

## What is fake vs real in the template

| Capability | In repo? | Production path (per docs) |
|---|---|---|
| Dashboard UI | ✅ Complete | Cloudflare Worker serves `app.js` |
| D1 / SQLite schema | ✅ Complete | Migrations applied on deploy |
| Demo seed data | ✅ | `seed-demo.sql` / `server.py --reset` |
| GSC API pull | ❌ Not implemented | Hermes job on VPS (external) |
| Opportunity scoring rules | ❌ Not implemented | Hermes / scripts (external) |
| GA4 pull | ❌ Not implemented | Same |
| WP sync | ❌ Not in scope | Not documented |
| Hermes execution | ⚠️ Conventions only | `HERMES-INTEGRATION.md` + `seo_os_sync.py` |
| Approval → task flow | ⚠️ Partial | Dashboard writes `commands`; VPS applies |

---

## Sync bridge (`scripts/seo_os_sync.py`)

- Reads VPS SQLite → POST `/agent/ingest` on hosted dashboard
- Sanitizes: strips raw Telegram IDs, basename-only workspace paths
- Poll interval default 120s; `--once` for manual refresh
- **Column whitelist** per table — anything else dropped

BW-CRM will **not** mirror this split. Ingest happens inside Supabase (Edge Functions write directly to Postgres).

---

## Mapping summary: SEO OS → BW-CRM

| SEO OS | BW-CRM v1 | v2 SEO (proposed) |
|---|---|---|
| `clients` | `customers` + `assets` | same |
| `metrics_snapshots` | `metrics_snapshots` | same (+ maybe `period` convention) |
| `opportunities` | — | `seo_opportunities` |
| `page` (text) | — | `asset_pages` |
| `agent_tasks` | `tasks` | + FK to opportunity |
| `approval_requests` | — | PARKED `agent_runs` |
| `managed_jobs` | — | Edge cron config, not table (phase A) |
| `activity_events` | — | phase C or lightweight log |
| Secrets on VPS | — | Supabase Vault + `asset_connections` |

---

## Screenshots ↔ code

User reference screenshots match:

- `ccPerformance()` — “28-Day Performance” grid
- `viewOpportunities()` — cross-site table with priority filters
- Top client bar + integration pills — client filter state in `app.js`
