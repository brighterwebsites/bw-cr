-- ============================================================
-- BW Project CRM — Authentication & Role-Based Access Control
-- Run this in the Supabase SQL Editor AFTER setup-supabase.sql
-- ============================================================

-- 1. Profiles table: one row per login, linked to Supabase Auth
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'designer', 'customer')),
  customer_id TEXT REFERENCES customers(id), -- only set when role = 'customer'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read their own profile (the app needs this to know a user's role/customer_id)
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Admins can read every profile (for future user management)
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- 2. Link projects to a real login, for designer scoping
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Remove the old "anyone can read everything" policies — access is now role-based
DROP POLICY IF EXISTS "Allow public read on customers" ON customers;
DROP POLICY IF EXISTS "Allow public read on projects" ON projects;
DROP POLICY IF EXISTS "Allow public read on tasks" ON tasks;

-- 4. Admins: full access to everything
CREATE POLICY "Admins full access customers" ON customers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY "Admins full access projects" ON projects FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY "Admins full access tasks" ON tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- 5. Designers: read/update only their own assigned projects (and related tasks/customers)
CREATE POLICY "Designers read assigned projects" ON projects FOR SELECT USING (
  assigned_user_id = auth.uid()
);

CREATE POLICY "Designers update assigned projects" ON projects FOR UPDATE USING (
  assigned_user_id = auth.uid()
) WITH CHECK (
  assigned_user_id = auth.uid()
);

CREATE POLICY "Designers read customers of assigned projects" ON customers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects pr
    WHERE pr.customer_id = customers.id AND pr.assigned_user_id = auth.uid()
  )
);

CREATE POLICY "Designers read tasks of assigned projects" ON tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects pr
    WHERE pr.id = tasks.project_id AND pr.assigned_user_id = auth.uid()
  )
);

CREATE POLICY "Designers update tasks of assigned projects" ON tasks FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM projects pr
    WHERE pr.id = tasks.project_id AND pr.assigned_user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects pr
    WHERE pr.id = tasks.project_id AND pr.assigned_user_id = auth.uid()
  )
);

-- 6. Customers get NO direct access to the customers/projects/tasks tables at all.
--    Instead, two read-only views expose only the columns a customer is allowed to
--    see (no notes, no descriptions, no other customers' data, no task descriptions).
--    Views run with the owner's privileges, so they bypass the admin/designer-only
--    RLS above and apply their own customer_id filter instead.

CREATE OR REPLACE VIEW customer_project_view AS
SELECT p.id, p.customer_id, p.name, p.stage, p.deadline
FROM projects p
WHERE p.customer_id = (SELECT customer_id FROM profiles WHERE id = auth.uid());

CREATE OR REPLACE VIEW customer_task_view AS
SELECT t.id, t.project_id, t.title, t.status, t.due_date
FROM tasks t
JOIN projects p ON p.id = t.project_id
WHERE p.customer_id = (SELECT customer_id FROM profiles WHERE id = auth.uid());

GRANT SELECT ON customer_project_view TO authenticated;
GRANT SELECT ON customer_task_view TO authenticated;
REVOKE ALL ON customer_project_view FROM anon;
REVOKE ALL ON customer_task_view FROM anon;

-- ============================================================
-- Manual step 1 — create the first admin login (do this now):
--   Supabase Dashboard → Authentication → Users → Add user
--     Email: support@brighterwebsites.com.au
--     Set a password (or use "Send invite email")
--   Copy the new user's UUID, then run:
--
--   INSERT INTO profiles (id, email, role)
--   VALUES ('<uuid-from-dashboard>', 'support@brighterwebsites.com.au', 'admin');
-- ============================================================

-- ============================================================
-- Manual step 2 — adding a designer later:
--   1. Create their login in the Dashboard (as above)
--   2. INSERT INTO profiles (id, email, role) VALUES ('<uuid>', '<email>', 'designer');
--   3. Point their assigned projects at them, e.g.:
--      UPDATE projects SET assigned_user_id = '<uuid>' WHERE id IN ('proj_001', 'proj_005');
-- ============================================================

-- ============================================================
-- Manual step 3 — adding a customer login later:
--   1. Create their login in the Dashboard (as above)
--   2. INSERT INTO profiles (id, email, role, customer_id)
--      VALUES ('<uuid>', '<email>', 'customer', '<customer id, e.g. cust_001>');
-- ============================================================
