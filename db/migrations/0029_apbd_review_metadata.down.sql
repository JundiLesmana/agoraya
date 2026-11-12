DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM apbd_entries WHERE status = 'in_review') THEN
    RAISE EXCEPTION 'Cannot roll back APBD review migration while submissions are awaiting review';
  END IF;
END;
$$;

DROP POLICY apbd_value_audit_admin_delete ON apbd_value_audit;
DROP POLICY apbd_value_audit_admin_read ON apbd_value_audit;
DROP POLICY apbd_budget_period_admin_delete ON apbd_budget_period_values;
DROP POLICY apbd_budget_period_admin_read ON apbd_budget_period_values;
DROP POLICY apbd_budget_items_admin_delete ON apbd_budget_items;
DROP POLICY apbd_budget_items_admin_read ON apbd_budget_items;
DROP POLICY apbd_entries_admin_delete ON apbd_entries;
DROP POLICY apbd_entries_admin_update ON apbd_entries;
DROP POLICY apbd_entries_admin_read ON apbd_entries;
DROP POLICY apbd_entry_documents_admin_delete ON apbd_entry_documents;
DROP POLICY apbd_entry_documents_admin_read ON apbd_entry_documents;
DROP POLICY apbd_entry_documents_operator_insert ON apbd_entry_documents;
DROP POLICY apbd_entry_documents_operator_read ON apbd_entry_documents;
DROP TABLE apbd_entry_documents;

CREATE OR REPLACE FUNCTION reject_apbd_published_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'published' THEN
    RAISE EXCEPTION 'published APBD entries are immutable';
  END IF;
  IF NEW.status = 'published' AND OLD.status <> 'published' THEN
    IF NOT EXISTS (
      SELECT 1 FROM apbd_budget_items item
      WHERE item.tenant_id = NEW.tenant_id AND item.entry_id = NEW.id
    ) OR EXISTS (
      SELECT 1 FROM apbd_budget_items item
      WHERE item.tenant_id = NEW.tenant_id AND item.entry_id = NEW.id
        AND (
          (SELECT COUNT(*) FROM apbd_budget_period_values period
           WHERE period.tenant_id = item.tenant_id
             AND period.entry_id = item.entry_id
             AND period.item_id = item.id
             AND period.period_type = 'quarterly') <> 4
          OR EXISTS (
            SELECT 1 FROM apbd_budget_period_values period
            WHERE period.tenant_id = item.tenant_id
              AND period.entry_id = item.entry_id
              AND period.item_id = item.id
              AND period.period_type = 'quarterly'
              AND (
                period.pagu IS NULL
                OR period.realisasi IS NULL
                OR period.realisasi > period.pagu
              )
          )
        )
    ) THEN
      RAISE EXCEPTION 'APBD publication requires complete quarterly values within Pagu';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION reject_apbd_value_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'apbd_value_audit is append-only';
END;
$$;

ALTER TABLE apbd_budget_period_values
  DROP CONSTRAINT apbd_budget_period_target_value_check,
  DROP COLUMN target_value,
  DROP COLUMN target_date,
  DROP COLUMN document_reference;
ALTER TABLE apbd_budget_items
  DROP COLUMN affair_code,
  DROP COLUMN program_code,
  DROP COLUMN activity_code,
  DROP COLUMN activity_name,
  DROP COLUMN funding_source,
  DROP COLUMN supporting_document;
DROP INDEX apbd_entries_draft_context_idx;
CREATE UNIQUE INDEX apbd_entries_draft_context_idx
  ON apbd_entries (tenant_id, agency_id, region_id, sector_id, reference_year)
  WHERE status = 'draft';
ALTER TABLE apbd_entries
  DROP CONSTRAINT apbd_entries_review_state_check,
  DROP CONSTRAINT apbd_entries_reviewed_by_tenant_fk,
  DROP CONSTRAINT apbd_entries_submitted_by_tenant_fk,
  DROP CONSTRAINT apbd_entries_status_check,
  ADD CONSTRAINT apbd_entries_status_check CHECK (status IN ('draft', 'published')),
  DROP COLUMN reviewed_at,
  DROP COLUMN reviewed_by,
  DROP COLUMN submitted_at,
  DROP COLUMN submitted_by,
  DROP COLUMN record_metadata;