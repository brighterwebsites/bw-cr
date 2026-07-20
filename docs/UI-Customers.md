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

Master–detail (same shell pattern as 100up Customers).

### Left column
- Search (business name, phone, email, location)
- **+ New customer**
- Vertical list: business name, contact line, lifecycle chip, open project count

### Main section
- Empty state: “Select a customer” or create form
- **Customer details** (editable)
  - Business name, lifecycle
  - Contact first / last
  - Phone `[tel:]` `[sms:]` · Email `[mailto:]`
  - Contact method
  - Location, address, website
  - Notes
- **Save** / cancel on create
- **Projects** list for this customer (read-only links for now — open in pipeline later)

Keep it simple: no deep project editor from this page yet.
