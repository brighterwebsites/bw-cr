# Tasks UI

Nav: CRM → Tasks

## Table `tasks` (schema v1)

| Column | UI |
|---|---|
| `title` | Primary — editable |
| `notes` | Panel |
| `status` | Inline edit in table + panel |
| `task_type` | Icon in table; select in panel (`task` \| `agent_task` \| `internal`) |
| `due_on` | Table + badge (on track / today / overdue) |
| `assigned_to` | Panel |
| `customer_id` / `project_id` / `asset_id` | Panel picks |

**Closed** = `status === 'completed'`.

## Layout

Stock-style table (100up Stock), denser filters, nicer row spacing. Slide-in panel matches Pipeline (`jdp-*` / pipeline detail).

### Toolbar
- Search (title, asset, project, assignee)
- **+ Add new** → panel create

### Filters (single-select — each click clears the previous)

**Scope / type:** All · Current · Task · Agent · Internal  
*(spacer)*  
**Due:** Due today · This week · Overdue

Default: **Current** (not completed).

### Table columns
| Task title | Asset / Project (stacked) | Type (icon) | Status (inline) | Due (date + badge) |

Row click opens panel (status select does not).

### Panel
Title, type, status, due, assigned, customer, project, asset, notes. Save / Create. Close ✕.

### Slide-in width (all CRM panels)
`50%` of content area, `max-width: 960px`.
