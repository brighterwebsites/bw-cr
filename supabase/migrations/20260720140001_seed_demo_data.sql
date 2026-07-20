-- BW-CRM demo seed from docs/import data/*.csv
-- ID fixes applied:
--   assets: name was in health_score column; Coastal↔project 8, Horseshoe↔project 7
--   tasks: "asset_id" column was domain/URL — joined via assets.asset_url
--   deliverables: stage names Live/Build → stage numbers; trust project_id when present

-- Wipe transactional data only (keep stages + profiles)
-- profiles FK → customers blocks TRUNCATE customers; DELETE instead
update public.profiles set customer_id = null where customer_id is not null;
truncate table
  public.tasks,
  public.project_deliverables,
  public.competitor_snapshots,
  public.metrics_snapshots,
  public.artifacts,
  public.assets,
  public.projects
restart identity;
delete from public.customers;
alter sequence public.customers_id_seq restart with 1;

-- ── customers ──────────────────────────────────────────────────────────
insert into public.customers (
  id, business_name, contact_first_name, contact_last_name,
  address, phone, email, contact_method, location, website, lifecycle, notes
) overriding system value values
  (1,  'Brighter Websites',                  'Vanessa', 'Wood',      '14 Messenger Pde, Lucas, Ballarat VIC 3350', '0412 401 933', 'support@brighterwebsites.com.au', 'Email', 'Ballarat, VIC', '', 'customer', ''),
  (2,  '100UP Off-Grid Solar',                'Fred',    'Torgovnikov','Ballarat, VIC, Australia',                '1300 489 152', 'fred@100up.com.au',               'Email', 'Ballarat, VIC', '', 'customer', ''),
  (3,  'Guerilla Steel',                      'Morgan',  'Peters',    '17 Aliciajay Cct, Luscombe QLD 4207',     '0405 538 413', 'GuerillaSteel@gmail.com',         'Email', 'Luscombe, QLD', '', 'customer', ''),
  (4,  'One Team Counselling & Coaching',     'Jef',     'Langford',  '40 Lunar CCT, Spring Mountain, Springfield QLD 4300', '0498 317 643', 'info@oneteamqld.com.au', 'Email', 'Springfield, QLD', '', 'customer', ''),
  (5,  'Paal Grant Designs in Landscaping',   'Paal',    'Grant',     'Buninyong, VIC 3357, Australia',          '0417 164 772', 'paalgrant@gmail.com',             'Email', 'Buninyong, VIC', '', 'customer', ''),
  (6,  'Re-Energy',                           'Fred',    'Torgovnikov','Ballarat, VIC, Australia',               '0400 092 621', 'fred@100up.com.au',               'Email', 'Ballarat, VIC', '', 'customer', ''),
  (7,  'Coastal Native Supply',               'Lucy',    '',          '19-37 Duve St, Marshall VIC 3216',        '0418 615 942', 'coastalnativesupply@gmail.com',   'Email', 'Marshall, VIC', '', 'customer', ''),
  (8,  'Horseshoe Bend Nursery',              'Lucy',    '',          '19-37 Duve St, Marshall VIC 3216',        '0418 615 942', 'info@horseshoebendnursery.com.au','Email', 'Marshall, VIC', '', 'customer', ''),
  (9,  'Papua New Guinea Federation of QLD',  'Jason',   '',          '',                                        '',             '',                                'Email', '', '', 'lead', ''),
  (10, 'Paws for support',                    'Alan',    '',          '',                                        '',             '',                                'Email', '', '', 'lead', ''),
  (11, 'Abandon Stress',                      'Rosi',    '',          '',                                        '',             '',                                'Email', '', '', 'lead', ''),
  (12, 'Body Nurture Massage',                'Rebecca', '',          '',                                        '',             '',                                'Email', '', '', 'lead', ''),
  (13, 'Cube Home Loans',                     'Scott',   '',          '',                                        '',             '',                                'Email', '', '', 'lead', '');

select setval(pg_get_serial_sequence('public.customers', 'id'), (select max(id) from public.customers));

-- ── projects (tag after URL → pipeline stage heuristic) ────────────────
-- CSV: project 7 = Horseshoe (cust 8), project 8 = Coastal (cust 7)
insert into public.projects (
  id, customer_id, name, system_description, stage, step, notes
) overriding system value values
  (1, 1, 'Brighter Websites — Agency',        'brighterwebsites.com.au Agency',        6, 0, ''),
  (2, 2, '100UP — Growth SEO',                '100up.com.au Growth SEO',               5, 0, ''),
  (3, 3, 'Guerilla Steel — Scale',            'guerillasteelstables.com.au Scale',     5, 0, ''),
  (4, 4, 'One Team — Growth SEO',             'oneteamqld.com.au Growth SEO',          5, 0, ''),
  (5, 5, 'Paal Grant — Growth Rebuild',       'paalgrant.com Growth Rebuild',          3, 0, ''),
  (6, 6, 'Re-Energy — Growth Rebuild',        're-energy.com.au Growth Rebuild',       3, 0, ''),
  (7, 8, 'Horseshoe Bend Nursery — Hosted',   'horseshoebendnursery.com.au Hosted',    6, 0, ''),
  (8, 7, 'Coastal Native Supply — Rebuild',   'coastalnativesupply.com.au Growth Rebuild', 3, 0, '');

select setval(pg_get_serial_sequence('public.projects', 'id'), (select max(id) from public.projects));

-- ── assets (name was in CSV health_score column; fix Coastal/Horseshoe FKs)
insert into public.assets (
  customer_id, project_id, asset_type, name, asset_url
) values
  (1,  1,    'website', 'Brighter Websites',                  'https://brighterwebsites.com.au'),
  (2,  2,    'website', '100UP Off-Grid Solar',               'https://100up.com.au'),
  (3,  3,    'website', 'Guerilla Steel',                     'https://guerillasteelstables.com.au'),
  (4,  4,    'website', 'One Team Counselling & Coaching',    'https://oneteamqld.com.au'),
  (5,  5,    'website', 'Paal Grant Designs in Landscaping',  'https://paalgrant.com'),
  (6,  6,    'website', 'Re-Energy',                          'https://re-energy.com.au'),
  (7,  8,    'website', 'Coastal Native Supply',              'https://coastalnativesupply.com.au'),
  (8,  7,    'website', 'Horseshoe Bend Nursery',             'https://horseshoebendnursery.com.au'),
  (9,  null, 'website', 'Papua New Guinea Federation of QLD', 'https://png.fqi'),
  (10, null, 'website', 'Paws for support',                   'https://pawsforsupport.com.au'),
  (11, null, 'website', 'Abandon Stress',                     'https://abandonstress.com.au'),
  (12, null, 'website', 'Body Nurture Massage',               'https://bodynurturemassage.com'),
  (13, null, 'website', 'Cube Home Loans',                    'https://cubecentral.com.au');

-- ── tasks (CSV asset_id column = domain; map via assets) ───────────────
insert into public.tasks (
  project_id, asset_id, customer_id, title, notes, status, task_type
)
select
  a.project_id,
  a.id,
  a.customer_id,
  t.title,
  t.notes,
  t.status::public.task_status,
  t.task_type::public.task_type
from (
  values
    ('re-energy.com.au',           'ALTC cluster placeholder → approved map', 'Replace CLAUDE.md placeholders with 3 clusters (off-grid, on-grid+storage, EV). Client review of commercial priorities.', 'not_started', 'task'),
    ('paalgrant.com',              'Approve site rebuild IA & page list', 'Lock portfolio, methodology, package, and consult pathway pages before Breakdance build. Carmen/Paal sign-off.', 'completed', 'task'),
    ('brighterwebsites.com.au',    'Audit Performance on top 10 Traffic pages', 'Verify cluster, topic, intent, purpose render in page output and match wp-admin values. Fix any drift on service and framework pages.', 'in_progress', 'internal'),
    ('100up.com.au',               'Backfill meta titles on top 20 GSC pages', 'Query-aligned rewrites for pages with impressions but weak CTR. No publish until Fred confirms technical claims.', 'not_started', 'task'),
    ('oneteamqld.com.au',          'Build 90-day ALTC publish schedule from existing roadmap', 'Pull priorities from 06-ALTC-Roadmap-Implementation.md. Sequence couples pillar first, then wellbeing cluster.', 'not_started', 'internal'),
    ('paalgrant.com',              'Build methodology hub page (Intelligent Design ALTC 1)', 'Explains how Paal reads sites — not generic design tips. Foundation for educational content layer.', 'not_started', 'task'),
    ('coastalnativesupply.com.au', 'Client sign-off on brand voice + ICP brief', 'coastal-native-supply/CLAUDE.md sections still empty. Blocks brand-facing copy and meta work.', 'blocked', 'task'),
    ('coastalnativesupply.com.au', 'Complete staging rebuild core templates', 'Shop, category, product, cart, checkout on hsb.bweb1.com.au. Mobile performance gate before client review.', 'in_progress', 'internal'),
    ('re-energy.com.au',           'Confirm GA4 property + GSC verification status', 'Property ID 437032136 in config — verify live tracking and Search Console access before rebuild handover.', 'not_started', 'internal'),
    ('coastalnativesupply.com.au', 'Document rebrand cutover redirect map', 'horseshoebendnursery.com.au → staging deploy → coastalnativesupply.com.au. Include indexation and canonical rules per phase.', 'not_started', 'internal'),
    ('100up.com.au',               'Draft & publish Off-Grid System project pagers', 'First cluster pillar from ALTC 1. SCOS-classify, internal links to service pathway and Fred contact. Client review before publish.', 'completed', 'task'),
    ('re-energy.com.au',           'Draft off-grid service page architecture', 'Separate off-grid vs on-grid vs EV pathways. Ballarat-local qualifiers on every commercial endpoint.', 'not_started', 'task'),
    ('100up.com.au',               'Finalise topic taxonomy in WordPress', 'Map 203-topic-taxonomy.md to scos_content_cluster and scos_topic terms. Blocker for classified content sprint.', 'in_progress', 'internal'),
    ('guerillasteelstables.com.au','July / August Social Post Calendar', '', 'not_started', 'internal'),
    ('oneteamqld.com.au',          'First meta-fill and content classification.', 'MCP confirmed; SCOS not live. Required before meta-fill and ALTC content classification.', 'not_started', 'agent_task'),
    ('guerillasteelstables.com.au','First meta-fill and content classification.', 'MCP confirmed; SCOS not live. Required before meta-fill and ALTC content classification.', 'not_started', 'agent_task'),
    ('brighterwebsites.com.au',    'Publish case study page', 'Turn BW site + methodology into a proof asset with measurable outcomes (traffic, leads, or AI visibility). Links to framework docs and SCOS showcase.', 'in_progress', 'task'),
    ('guerillasteelstables.com.au','Publish Stable Build Preparation pillar refresh', '', 'not_started', 'task'),
    ('re-energy.com.au',           'Run content inventory + traffic signals baseline', 're-energy/CLAUDE.md flags both missing. Prerequisite for ALTC mapping and rebuild scope.', 'not_started', 'internal'),
    ('100up.com.au',               'Run technical SEO baseline fixes batch 1', 'Indexation flags, thin/duplicate URLs, missing meta on high-impression GSC pages. Target pages with traffic decline first.', 'in_progress', 'internal'),
    ('paalgrant.com',              'SCOS taxonomy setup for 3 ALTC clusters', 'Intelligent Design, Complex Sites, Longevity — map to wp terms before content or rebuild go-live.', 'not_started', 'internal'),
    ('paalgrant.com',              'Select 2 portfolio projects for constraint-led case studies', 'Rooftop, slope, or poor-soil examples with before/after and design rationale. Paal provides project notes.', 'completed', 'task'),
    ('guerillasteelstables.com.au','Set up Stripe Connection', '', 'in_progress', 'internal'),
    ('brighterwebsites.com.au',    'Wire quiz → consult pathway GA4 events', 'Confirm pathway_quiz_complete, consult click, and form submit events fire on production. Needed before claiming lead-pathway deliverable is done.', 'not_started', 'internal'),
    ('coastalnativesupply.com.au', 'WooCommerce catalogue migration smoke test', 'Import sample product batch; verify images, categories, and checkout on staging. Flag inventory workflow issues early.', 'not_started', 'internal')
) as t(domain, title, notes, status, task_type)
join public.assets a
  on a.asset_url ilike '%' || t.domain || '%';

-- ── project_deliverables ───────────────────────────────────────────────
insert into public.project_deliverables (
  project_id, title, type, status, stage, step
) values
  (4, '2x Service Page Additions', 'collection_of_work', 'done', 6, 0),
  (4, '5 pillar article + 3x social posts for each', 'collection_of_work', 'done', 6, 0),
  (7, 'AI and API connection for Plan Data', 'goal_target', 'in_progress', 3, 0),
  (5, 'authority launch pack', 'collection_of_work', 'done', 6, 0),
  (8, 'Coastal Native Supply Redirections & Migration fallback', 'guaranteed_outcome', 'in_progress', 3, 0),
  (2, 'content sprint — 3 pillar + 6 supporting articles', 'collection_of_work', 'done', 6, 0),
  (4, 'Conversion Redesign', 'guaranteed_outcome', 'in_progress', 3, 0),
  (3, 'Google Merchant Connection', 'goal_target', 'done', 6, 0),
  (3, 'Off-site authority programme', 'collection_of_work', 'done', 6, 0),
  (3, 'Online Store Images', 'collection_of_work', 'in_progress', 3, 0),
  (3, 'Online Store Setup', 'guaranteed_outcome', 'in_progress', 3, 0),
  (3, 'Content production (2 articles/month)', 'collection_of_work', 'done', 6, 0),
  (3, 'SEO & conversion review report with prioritised action list', 'goal_target', 'done', 6, 0),
  (7, 'Technical SEO baseline', 'goal_target', 'in_progress', 3, 0),
  (5, 'Technical SEO baseline', 'goal_target', 'in_progress', 3, 0),
  (6, 'Technical SEO baseline', 'goal_target', 'in_progress', 3, 0),
  (2, 'Technical SEO baseline', 'goal_target', 'in_progress', 3, 0),
  (7, 'website rebuild', 'guaranteed_outcome', 'in_progress', 3, 0),
  (5, 'website rebuild', 'guaranteed_outcome', 'in_progress', 3, 0),
  (6, 'website rebuild', 'guaranteed_outcome', 'in_progress', 3, 0),
  (2, 'Website Rebuild & Migration', 'guaranteed_outcome', 'in_progress', 3, 0);
