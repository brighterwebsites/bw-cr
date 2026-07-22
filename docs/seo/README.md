# SEO module — planning docs

Exploratory specs for bringing SEO Command Center capabilities into BW-CRM. **No implementation yet.**

## Source repos (local clones)

| Repo | Path | Role |
|---|---|---|
| [NicoSKOOL/seo-os-ai-ranking](https://github.com/NicoSKOOL/seo-os-ai-ranking) | `E:\GIT_REPOS_INDIV\seo-os-ai-ranking-explore` | Full template: architecture, Hermes bridge, VPS scripts |
| [brighterwebsites/seo-os-brighter](https://github.com/brighterwebsites/seo-os-brighter) | `E:\GIT_REPOS_INDIV\seo-os-brighter-explore` | Deployed Cloudflare dashboard only (same UI as upstream `dashboard/`) |

BW-CRM schema contract remains [`docs/schema-v1.md`](../schema-v1.md). SEO extensions are proposed in [`SCHEMA-v2-seo.md`](SCHEMA-v2-seo.md).

## Documents

| Doc | Purpose |
|---|---|
| [REFERENCE-SEO-OS.md](REFERENCE-SEO-OS.md) | Screen-by-screen inventory of SEO OS; fake vs real; keep / skip / differ |
| [FEATURES.md](FEATURES.md) | BW-CRM product spec — Must / Should / Later / Out |
| [SCHEMA-v2-seo.md](SCHEMA-v2-seo.md) | New tables and relationships (extends v1, does not replace it) |
| [INTEGRATIONS.md](INTEGRATIONS.md) | GSC, GA4, WordPress, Hermes, secrets — auth, sync, cadence |
| [IMPLEMENTATION-PHASES.md](IMPLEMENTATION-PHASES.md) | Phased delivery plan with exit criteria |

## Agreed decisions (2026-07-22)

| Topic | Choice |
|---|---|
| Nav | Top-level **SEO** → Performance · Opportunities · Pages |
| GSC auth | Per asset; **Duplicate setup from…** copies config only, not tokens |
| WP meta keys | Pending SCOS key documentation from Vanessa |

Details: [`FEATURES.md`](FEATURES.md#agreed-decisions-2026-07-22) · [`UI-SEO.md`](../UI-SEO.md)

## Design constraints

Follow [`.cursor/rules/ai-workflow-efficiency.mdc`](../../.cursor/rules/ai-workflow-efficiency.mdc):

- APIs and scripts for pulls, aggregation, and opportunity scoring
- Models only for judgment, drafting, and synthesis on bounded task payloads
- Persist to Postgres; UI reads the DB

## Key architectural fork

SEO OS uses **VPS SQLite (source of truth) → Cloudflare D1 (display projection)**. BW-CRM uses **Supabase Postgres as the single operational database** — GSC pulls and scoring run as Edge Functions / scheduled jobs, not a parallel Hermes-owned DB.
