-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner TEXT,
  contact TEXT,
  phone TEXT,
  location TEXT,
  website TEXT,
  business_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  name TEXT NOT NULL,
  description TEXT,
  stage TEXT,
  assigned_to TEXT,
  created_date DATE,
  deadline DATE,
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  status TEXT,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read on customers" ON customers
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on projects" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on tasks" ON tasks
  FOR SELECT USING (true);

-- Insert customers data
INSERT INTO customers (id, name, owner, contact, phone, location, website, business_type) VALUES
('cust_001', 'Guerilla Steel Stables', 'Morgan Peters', 'morgan@guerillasteelstables.com.au', '', 'Yatala, QLD', 'guerillasteelstables.com.au', 'Steel fabrication & ecommerce'),
('cust_002', 'Paal Grant Designs In Landscape', 'Paal Grant', 'info@paalgrant.com', '', 'Ballarat, VIC', 'paalgrant.com', 'Landscape design & construction'),
('cust_003', 'Coastal Native Supply', 'TBD', 'TBD', '', 'TBD', 'coastalnativesupply.com.au', 'Nursery / plant supply'),
('cust_004', '100up Solar', 'Fred', 'TBD', '', 'TBD', '100up.com.au', 'Solar products & installation'),
('cust_005', 'One Team Counselling & Coaching', 'TBD', 'TBD', '', 'QLD', 'oneteamqld.com.au', 'Counselling & coaching services');

-- Insert projects data
INSERT INTO projects (id, customer_id, name, description, stage, assigned_to, created_date, deadline, completed_date, notes) VALUES
('proj_001', 'cust_001', 'Guerilla Steel SEO & Authority', 'GSC/GA4 audit, ALTC cluster foundation, off-site link-building strategy', 'Build', 'Vanessa Wood', '2026-04-01', '2026-09-30', NULL, 'Near-zero DA — focusing on off-site authority. SCOS deployment in progress.'),
('proj_002', 'cust_002', 'Paal Grant Website Launch & SCOS', 'WordPress/Breakdance build, product taxonomy, SCOS implementation', 'Review', 'Vanessa Wood', '2026-01-15', '2026-05-04', '2026-05-04', 'Live as of 2026-05-04. Post-launch content optimisation phase.'),
('proj_003', 'cust_002', 'Paal Grant Meta Title & CTA Audit', 'GSC low-CTR analysis, service page optimisation', 'Refine', 'Vanessa Wood', '2026-05-15', '2026-08-15', NULL, 'Active GA4 conversion audit. Comparing page performance vs booking pathway.'),
('proj_004', 'cust_003', 'Coastal Native Supply Rebrand & Rebuild', 'Horseshoe Bend Nursery → Coastal Native Supply rebrand, staging → live deployment', 'Onboard & Design', 'Vanessa Wood', '2026-03-01', '2026-12-31', NULL, 'Multi-phase: staging at hsb.bweb1.com.au, deploy to live, cutover to new domain.'),
('proj_005', 'cust_004', '100up Content Baseline & ALTC Strategy', 'Content inventory, traffic analysis, ALTC cluster mapping, baseline report', 'Build', 'Vanessa Wood', '2026-02-01', '2026-07-31', NULL, 'Solar products hierarchy active. Multiple content enrichment tasks in flight.'),
('proj_006', 'cust_005', 'One Team SEO & Content Strategy', 'GSC/GA4 setup, ALTC content strategy, service page optimisation', 'Proposal', 'Vanessa Wood', '2026-06-01', '2026-09-30', NULL, 'Engagement proposal stage. GSC & GA4 configured.');

-- Insert tasks data
INSERT INTO tasks (id, project_id, title, description, assigned_to, status, due_date) VALUES
('task_001', 'proj_001', 'GSC Ranking Analysis', 'Audit positions 11-30, identify link-building gaps', 'Vanessa Wood', 'in_progress', '2026-07-31'),
('task_002', 'proj_002', 'GA4 Conversion Audit', 'Compare service page performance vs CTA click-through', 'Vanessa Wood', 'in_progress', '2026-08-15'),
('task_003', 'proj_003', 'Meta Title Rewrite (High-Intent Pages)', 'Rewrite 12 service pages with improved CTR targeting', 'Vanessa Wood', 'in_progress', '2026-08-15'),
('task_004', 'proj_004', 'Brand Voice & ICP Definition', 'Define brand voice, target audience, positioning for rebrand', 'Vanessa Wood', 'blocked', '2026-09-30'),
('task_005', 'proj_005', 'Featured Image Audit & Swap', 'Optimise featured images across product pages', 'Vanessa Wood', 'in_progress', '2026-08-31'),
('task_006', 'proj_005', 'FAQ Content Generation', 'Create FAQ cluster for off-grid system design queries', 'Vanessa Wood', 'todo', '2026-08-20');
