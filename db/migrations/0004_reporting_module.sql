-- Reporting workflow: explicit lifecycle, SLA timestamps, QC evidence, and votes.
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'verified' AFTER 'submitted';

ALTER TABLE tickets
  ADD COLUMN assignee_id UUID REFERENCES users(id),
  ADD COLUMN duplicate_of_id UUID REFERENCES tickets(id),
  ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN response_due_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN first_responded_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN sla_escalated_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX tickets_response_due_at_idx ON tickets(response_due_at) WHERE closed_at IS NULL;
CREATE INDEX tickets_duplicate_of_id_idx ON tickets(duplicate_of_id) WHERE duplicate_of_id IS NOT NULL;

CREATE TABLE ticket_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  storage_key VARCHAR(512) NOT NULL,
  media_type VARCHAR(100) NOT NULL,
  purpose VARCHAR(50) NOT NULL DEFAULT 'qc',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX ticket_evidence_ticket_id_idx ON ticket_evidence(ticket_id);

CREATE TABLE ticket_votes (
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY(ticket_id, voter_id)
);
CREATE INDEX ticket_votes_ticket_id_idx ON ticket_votes(ticket_id);
