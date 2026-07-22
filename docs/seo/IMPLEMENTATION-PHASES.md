# SEO module — implementation phases

**Status:** draft · **Features:** [`FEATURES.md`](FEATURES.md) · **Schema:** [`SCHEMA-v2-seo.md`](SCHEMA-v2-seo.md)

Each phase delivers usable value independently. Do not start phase N+1 until exit criteria for phase N are met.

---

## Phase A — Performance dashboard (read-only)

**Goal:** 28-day GSC site cards across all managed assets — same visual value as SEO OS Command Center performance section.

### Scope

| In | Out |
|---|---|
| GSC site-level pull → `metrics_snapshots` | Page-level data |
| SEO Performance UI in CRM | Opportunities |
| Manual + scheduled site metrics job | WP sync |
| Update `assets.gsc_status` | Hermes |

### Schema

- No new tables (v1 `metrics_snapshots` sufficient)
- Optional: `asset_connections` if OAuth wired in same phase

### UI

- New nav: **SEO → Performance** (or interim section on Assets)
- Card grid: asset name, clicks, impressions, CTR, avg rank + deltas
- Asset filter bar (All / per asset)
- Empty states for missing connection or snapshot

### Edge Functions

1. `gsc-auth` — shared helper
2. `gsc-pull-site` — upsert latest `metrics_snapshots` row per asset

### Exit criteria

- [ ] All connected managed sites show real 28-day data
- [ ] Deltas match manual GSC UI check for one test asset
- [ ] Daily cron runs without manual intervention
- [ ] `npm run build` passes

**Estimate:** small — mostly integration + one new page

---

## Phase B — Opportunities pipeline

**Goal:** Cross-site SEO Opportunities table with rule-based detection and promote-to-task.

### Scope

| In | Out |
|---|---|
| `asset_pages`, `page_metrics_current`, `seo_opportunities` | WP meta |
| GSC page pull | Two-way sync |
| Rule engine (script) | LLM problem generation |
| Opportunities UI + priority filter | CTR test workflow |
| Promote → `tasks` | Hermes dispatch |

### Schema migrations

1. `asset_pages`
2. `page_metrics_current`
3. `seo_opportunities`
4. `tasks.seo_opportunity_id`, `tasks.page_url`

### Edge Functions

```text
gsc-pull-pages    → match/create asset_pages, upsert page_metrics_current
seo-score-pages   → upsert seo_opportunities from rules
```

Chain after page pull; invokable separately for debugging.

### UI

- **SEO → Opportunities** — full table per FEATURES F2
- Asset filter + priority chips (port SEO OS pattern)
- Row action: **Create task**
- Optional: top-6 preview on Performance page

### Exit criteria

- [ ] Page pull populates pages for one asset with ≥20 URLs
- [ ] Rules create plausible opps (low CTR high impressions visible)
- [ ] Multiple opps on same page possible (different types)
- [ ] Promote creates linked task; opportunity status → `task_created`
- [ ] Re-scan idempotent (no duplicate open opps)
- [ ] Dismissed opps stay dismissed across scans

**Estimate:** medium — schema + 2 functions + table UI

---

## Phase C — Site pages registry + WP read sync

**Goal:** Pages inventory with performance, priority flag, WP meta, and opportunity counts.

### Scope

| In | Out |
|---|---|
| WP REST pull for posts + configured meta keys | WP write-back |
| Pages UI with asset filter | Full content editing |
| `is_priority` manual toggle | Page history charts |
| Page detail: metrics + opps + tasks | |

### Schema

- Populate `asset_pages` WP fields
- `asset_connections` for `wordpress` provider

### Edge Functions

1. `wp-sync-pages` — upsert pages + meta columns
2. `test-connection` — validate REST or SSH

### UI

- **SEO → Pages** — sortable table
- Columns: path, title, priority, impressions, clicks, CTR, position, open opps, workflow, indexation, cluster
- Link to opportunity / task lists filtered by page

### Exit criteria

- [ ] WP sync matches published pages for one test site
- [ ] SCOS meta keys visible in CRM
- [ ] Priority flag persists
- [ ] GSC-only pages (no WP post) still appear from page pull

**Estimate:** medium — WP auth variety (REST vs SSH) may add time

---

## Phase D — Execution layer (agents + secrets + optional WP push)

**Goal:** Secure credentials, Hermes task dispatch, audited WP meta updates.

### Scope

| In | Out |
|---|---|
| Vault-backed `asset_connections` UI | Full SEO OS approvals board |
| `agent_task` dispatch to Hermes | Telegram onboarding |
| `tasks.agent_skill` | Review management |
| PARKED `agent_runs` approval flow | |
| Optional: WP meta push with `wp_command_log` | |

### Exit criteria

- [ ] Connect GSC + WP from Assets UI without secrets in DB
- [ ] Approved agent task reaches Hermes and returns result
- [ ] WP meta push logged and reversible
- [ ] No production publish without explicit approval type

**Estimate:** large — depends on Hermes API stability

---

## Phase E — Polish & parity (optional)

| Item | Source inspiration |
|---|---|
| Activity feed | SEO OS `activity_events` |
| Scheduled jobs UI | SEO OS Schedule tab |
| GA4 cards on Performance | v1 snapshot columns |
| Command Center KPI strip | pending tasks, high opps count |
| Competitor + SEO unified asset view | already have competitor accordion |

---

## Suggested build order within BW-CRM app

Aligns with existing nav (`pipeline`, `customers`, `tasks`, `assets`):

1. **Phase A** — add `seo` nav with Performance sub-route
2. **Phase B** — add Opportunities sub-route; extend Tasks detail with opportunity link
3. **Phase C** — add Pages sub-route; extend Assets integrations panel
4. **Phase D** — connection wizard + agent dispatch

### UI doc outputs (when implementing)

| Doc | When |
|---|---|
| `docs/UI-SEO-Performance.md` | Phase A |
| `docs/UI-SEO-Opportunities.md` | Phase B |
| `docs/UI-SEO-Pages.md` | Phase C |

---

## Risk register

| Risk | Mitigation |
|---|---|
| GSC OAuth maintenance | One GCP OAuth app; per-asset tokens in Vault; duplicate-setup copies config only |
| Page volume | Limit to GSC-known URLs + published WP posts; no crawl storage |
| Opportunity noise | Tunable thresholds in config; dismiss + snooze |
| WP auth diversity | Start REST application passwords; SSH for edge cases |
| Scope creep vs SEO OS | Refer to FEATURES Must/Out; defer Reviews, Content kanban, Chat |
| Token cost | Enforce ai-workflow-efficiency rule; code review on any LLM in cron path |

---

## Immediate next actions (still exploratory → ready to build)

1. Review and adjust thresholds in SCHEMA opportunity rules
2. **Vanessa:** document SCOS `post_meta` key names → unblocks Phase C
3. ~~GSC OAuth~~ **AGREED:** per-asset user OAuth + duplicate-setup UX (see [`UI-SEO.md`](../UI-SEO.md))
4. Phase A: `asset_connections` migration + GSC connect UI on Assets
5. Phase A: SEO → Performance page per [`UI-SEO.md`](../UI-SEO.md)
