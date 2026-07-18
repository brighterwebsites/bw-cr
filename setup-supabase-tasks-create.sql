-- ============================================================
-- BW Project CRM — Allow creating new tasks via the app
-- Run this in the Supabase SQL Editor AFTER setup-supabase-tasks.sql
-- ============================================================

-- Admins already have full access (INSERT included) via "Admins full access tasks".
-- Designers could previously only read/update tasks on their assigned projects —
-- add INSERT so they can create new tasks on projects assigned to them.
CREATE POLICY "Designers insert tasks for assigned projects" ON tasks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects pr
    WHERE pr.id = tasks.project_id AND pr.assigned_user_id = auth.uid()
  )
);
