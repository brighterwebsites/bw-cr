# Assets UI

Nav: CRM → Assets

## Table `assets` (schema v1)

| Column | UI |
|---|---|
| `name` | Primary label — editable |
| `asset_url` | Open link — editable |
| `asset_type` | `website` \| `staging` \| `other` — editable |
| `customer_id` | Required — editable |
| `project_id` | **Current project** (optional) — editable. Later: many related projects + one current |
| `conversion_event_name` | GA4 event name — editable |
| `health_score` | **Display only** |
| `gsc_status` / `ga4_status` / `wp_cli_status` | **Display only** |
| `hermes_profile` / `telegram_topic` / `workspace` | **Display only** |
| `version` | Server bump |

## Layout

Master–detail (same pattern as Customers).

### Left column
- Search (name, URL, customer)
- **+ New asset**
- Vertical list: name, URL, type chip, customer name

### Main section
- Empty state: “Select an asset” or create form
- **Asset details** (editable): name, type, URL, customer, **current project**, conversion event
- **Integrations** (read-only): health score, GSC / GA4 / WP CLI status, Hermes / Telegram / workspace
- **Save** / cancel on create

No connection wiring in v1 UI — statuses and Hermes fields are display-only until integrations land.

### Later (not now)
Asset can have many projects; `project_id` stays the single **current** project. Related list = junction table or filtered projects — keep UI simple until then.
