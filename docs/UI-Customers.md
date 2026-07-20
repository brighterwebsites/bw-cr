# Customers UI

Nav: CRM → Customers

## Table `customers` (schema v1)

| Column | Notes |
|---|---|
| `business_name` | Primary label |
| `contact_first_name` / `contact_last_name` | |
| `phone` / `email` / `contact_method` | Quick-action links: tel / sms / mailto |
| `address` / `location` | Full address + city shorthand |
| `website` | Marketing URL |
| `lifecycle` | `lead` \| `customer` \| `inactive` |
| `notes` | Free text |
| `version` | Optimistic lock (server bump) |

## Layout

Master–detail.

### Left column
- Search · **+ New customer** · list with lifecycle + project count

### Main — customer card
- **Customer details** (editable) + Save
- **Projects** — card per project: name, stage chip (opens Pipeline), nested **Deliverables** CRUD table
- **Assets** — Name · URL · Open URL · Open record

Future customer portal = read-only version of this card.
