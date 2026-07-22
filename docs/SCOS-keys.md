# SCOS keys reference

Source of truth for WordPress ↔ BW-CRM page sync. Used by Phase C WP pull and (later) bidirectional meta updates.

**Consumers:** [`docs/seo/INTEGRATIONS.md`](seo/INTEGRATIONS.md) · [`docs/seo/SCHEMA-v2-seo.md`](seo/SCHEMA-v2-seo.md)

---

## Post meta keys

| Meta key | Storage | Notes |
|---|---|---|
| `scos_seo_freeze_og_dates` | post_meta | Full timestamp |
| `scos_seo_description` | post_meta | |
| `scos_seo_title` | post_meta | |
| `scos_seo_breadcrumb_title` | post_meta | Short title for breadcrumb schema |
| `scos_seo_tldr` | post_meta | |
| `scos_seo_sitemap_noindex_override` | post_meta | |
| `scos_seo_sitemap_noindex_auto` | post_meta | |
| `scos_seo_sitemap_exclude` | post_meta | |
| `scos_seo_robots` | post_meta | |
| `scos_seo_canonical` | post_meta | |
| `scos_schema_custom` | post_meta | Custom schema JSON |
| `scos_ca_schema_track` | post_meta | Active schema types (incl. global) |
| `scos_ca_index_status` | post_meta | What Google reports — **not** the robots tag |
| `scos_ca_supporting_topics` | post_meta | Array |
| `scos_ca_purpose` | post_meta | |
| `scos_ca_intent` | post_meta | |
| `scos_ca_maturity` | post_meta | |
| `scos_ca_service_pathway_id` | post_meta | Related post ID |
| `scos_ca_intent_goal_faq_id` | post_meta | Related post ID |

### Content analysis fields

| Meta key | Storage | Notes |
|---|---|---|
| `scos_ca_h2_count` | post_meta | |
| `scos_ca_word_count` | post_meta | |
| `scos_ca_image_count` | post_meta | |
| `scos_ca_links_to_internal_list` | post_meta | Array |
| `scos_ca_links_to_internal` | post_meta | Count |
| `scos_ca_links_to_external_list` | post_meta | Array |
| `scos_ca_links_to_external` | post_meta | Count |
| `scos_ca_reading_time_iso` | post_meta | |
| `scos_ca_last_analyzed` | post_meta | Empty = content analysis not run |

### Workflow

| Meta key | Storage | Notes |
|---|---|---|
| `scos_ca_next_step` | post_meta | Primary workflow stage for CRM **Pages** table |
| `scos_ca_optimization_progress` | post_meta | Array |

---

## Taxonomies (not post_meta)

| Taxonomy | Notes |
|---|---|
| `scos_topic` | Topic term — slug preferred in CRM |
| `scos_content_cluster` | ALTC cluster — slug preferred |

### WP-CLI examples

By term ID:

```bash
wp post term set 123 scos_topic 100 --by=id
wp post term set 123 scos_content_cluster 26 --by=id
```

By slug (preferred for clusters, matches scos-meta-fill skill):

```bash
wp post term set 123 scos_topic batteries --by=slug
wp post term set 123 scos_content_cluster cro-web-design --by=slug
```

---

## BW-CRM column mapping (Phase C)

| `asset_pages` column | SCOS source |
|---|---|
| `scos_next_step` | `scos_ca_next_step` |
| `scos_index_status` | `scos_ca_index_status` |
| `topic_slug` | `scos_topic` taxonomy term slug |
| `cluster_slug` | `scos_content_cluster` taxonomy term slug |
| `wp_meta_snapshot` (jsonb) | All other post_meta keys above on pull |

Pages UI **must** columns: next step, index status, topic, cluster. Detail panel can surface SEO title/description, purpose, intent, maturity, content analysis, workflow progress.
