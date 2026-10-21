DROP TABLE IF EXISTS ticket_votes;
DROP TABLE IF EXISTS ticket_evidence;
DROP INDEX IF EXISTS tickets_duplicate_of_id_idx;
DROP INDEX IF EXISTS tickets_response_due_at_idx;
ALTER TABLE tickets
  DROP COLUMN IF EXISTS sla_escalated_at,
  DROP COLUMN IF EXISTS closed_at,
  DROP COLUMN IF EXISTS resolved_at,
  DROP COLUMN IF EXISTS first_responded_at,
  DROP COLUMN IF EXISTS response_due_at,
  DROP COLUMN IF EXISTS submitted_at,
  DROP COLUMN IF EXISTS duplicate_of_id,
  DROP COLUMN IF EXISTS assignee_id;
-- PostgreSQL enum values are intentionally retained: removing a value safely
-- requires recreating the enum and is not appropriate for a rollback migration.
