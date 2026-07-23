-- Free-text scratch field for whoever/whatever executes a task (human or agent).
-- Structured fields (skill, approval gate, error handler) land later once Hermes
-- dispatch is real — no point guessing their shape now.
alter table public.tasks
  add column agent_note text not null default '';
