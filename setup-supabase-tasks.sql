-- ============================================================
-- BW Project CRM — Task Types
-- Run this in the Supabase SQL Editor AFTER setup-supabase-auth.sql
-- ============================================================

-- Task, Deliverable, Goal are shown to clients; Internal Task is not.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type TEXT NOT NULL DEFAULT 'task'
  CHECK (task_type IN ('task', 'deliverable', 'goal', 'internal_task'));

-- Customers must never see internal tasks — filter them out of the
-- read-only portal view (columns unchanged otherwise).
CREATE OR REPLACE VIEW customer_task_view AS
SELECT t.id, t.project_id, t.title, t.status, t.due_date, t.task_type
FROM tasks t
JOIN projects p ON p.id = t.project_id
WHERE p.customer_id = (SELECT customer_id FROM profiles WHERE id = auth.uid())
  AND t.task_type <> 'internal_task';
