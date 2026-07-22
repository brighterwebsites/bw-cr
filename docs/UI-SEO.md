# SEO UI

Nav: CRM → **SEO** (top-level, alongside Pipeline, Customers, Tasks, Assets)

**Planning:** [`seo/FEATURES.md`](seo/FEATURES.md) · [`seo/IMPLEMENTATION-PHASES.md`](seo/IMPLEMENTATION-PHASES.md)

---

## Sub-routes

| Route | Phase | Purpose |
|---|---|---|
| SEO → **Performance** | A | 28-day GSC site cards, all managed assets |
| SEO → **Opportunities** | B | Cross-site opportunity pipeline |
| SEO → **Pages** | C | Page inventory, metrics, WP meta, opp counts |

Shared chrome on all three: **asset filter bar** (All · {asset name} …) — same mental model as SEO OS client bar.

Default scope: `asset_type = managed_website` only.

---

## Performance (Phase A)

### Layout
- Page title + subtitle (“GSC snapshot vs previous 28 days”)
- Asset filter chips (horizontal)
- Responsive card grid — one card per asset with latest `metrics_snapshots` row

### Card fields
| Metric | Source column |
|---|---|
| Clicks | `clicks` + `clicks_delta` |
| Impressions | `impressions` + `impressions_delta` |
| CTR | `ctr` + `ctr_delta` |
| Avg rank | `avg_rank` + `avg_rank_delta` (lower delta = better) |

### Empty states
- No GSC connection → link to Asset integrations setup
- Connected, no snapshot → “Run refresh” / waiting for first job

### Later
- GA4 conversions on card (`conversions`, engagement)
- Click card → open Asset detail

---

## Opportunities (Phase B)

### Layout
- Title + description (Search Console pipeline copy)
- Priority filter chips: All priorities · High · Medium · Low
- Asset filter bar
- Full-width table (Stock / Tasks density)

### Table columns
`#` · Asset · Page · Problem · Priority · Impr. · Clicks · CTR · Pos. · Recommended workflow · Status · **Actions**

### Row actions
- **Create task** → pre-filled `tasks` row, opportunity → `task_created`
- **Dismiss** (later)

Sort default: impressions descending.

---

## Pages (Phase C)

### Layout
- Asset filter bar
- Search (path, title)
- Table + optional detail panel

### Table columns (initial)
Path · Title · Priority · Impr. · Clicks · CTR · Pos. · Open opps · **Next step** · **Index status** · **Topic** · **Cluster**

Detail panel: GSC metrics, opportunities, tasks, plus SCOS fields from [`SCOS-keys.md`](SCOS-keys.md) (title, description, purpose, intent, maturity, word count, last analyzed, optimization progress).

---

## Integrations setup (Assets detail + SEO empty states)

Connection UI lives on **Assets → Integrations** (extend existing accordion). SEO pages link here when disconnected.

### Per-asset providers
Each managed asset gets its own connection rows — **no shared OAuth tokens across clients**.

| Provider | Vault secret | Config (non-secret) |
|---|---|---|
| GSC | `gsc-asset-{id}` | property URL, site URL |
| GA4 | `ga4-asset-{id}` | property ID, conversion event (or use `assets.conversion_event_name`) |
| WordPress | `wp-asset-{id}` | REST base URL, `meta_keys` + `taxonomies` per [`SCOS-keys.md`](SCOS-keys.md) |

### Connect flow
1. Choose provider → configure non-secret fields
2. **Connect** → OAuth or paste credential → stored in Vault only
3. **Test connection** → Edge Function
4. Status pill on asset updates (`connection_status`)

### Duplicate setup from… (admin convenience)

When adding GSC (or GA4 / WP) to a **new** asset:

- Button: **Duplicate setup from…** → pick another asset
- **Copies:** `asset_connections.config` only (property pattern, meta key map, conversion event name, etc.)
- **Does not copy:** vault secret, refresh token, OAuth grant, or `secret_ref`
- New asset must complete its own **Connect GSC** OAuth before status → `connected`
- UI copy: “Settings copied — you still need to authorize this site separately.”

**Hard rule:** one vault secret per asset; reject ingest if token fingerprint matches another asset’s GSC grant (prevents accidental reuse of the same Search Console property/token on two CRM assets).

---

## Nav registration

Extend `app/src/lib/nav.tsx`:

```text
Page = … | 'seo'
SEO sub-tab: 'performance' | 'opportunities' | 'pages'
```

Shell sidebar: **SEO** entry with sub-nav or tab strip under SEO layout (match existing CRM density, not 13-tab SEO OS clone).
