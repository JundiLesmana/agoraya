ALTER TABLE apbd_entries
  ADD COLUMN record_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN submitted_by UUID,
  ADD COLUMN submitted_at TIMESTAMPTZ,
  ADD COLUMN reviewed_by UUID,
  ADD COLUMN reviewed_at TIMESTAMPTZ;

ALTER TABLE apbd_entries
  DROP CONSTRAINT apbd_entries_status_check,
  ADD CONSTRAINT apbd_entries_status_check
    CHECK (status IN ('draft', 'in_review', 'published')),
  ADD CONSTRAINT apbd_entries_submitted_by_tenant_fk
    FOREIGN KEY (submitted_by, tenant_id) REFERENCES users (id, tenant_id) ON DELETE RESTRICT,
  ADD CONSTRAINT apbd_entries_reviewed_by_tenant_fk
    FOREIGN KEY (reviewed_by, tenant_id) REFERENCES users (id, tenant_id) ON DELETE RESTRICT,
  ADD CONSTRAINT apbd_entries_review_state_check
    CHECK (
      (status = 'in_review' AND submitted_by IS NOT NULL AND submitted_at IS NOT NULL)
      OR status <> 'in_review'
    );

DROP INDEX apbd_entries_draft_context_idx;
CREATE UNIQUE INDEX apbd_entries_draft_context_idx
  ON apbd_entries (tenant_id, agency_id, region_id, sector_id, reference_year)
  WHERE status IN ('draft', 'in_review');

ALTER TABLE apbd_budget_items
  ADD COLUMN affair_code VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN program_code VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN activity_code VARCHAR(64) NOT NULL DEFAULT '',
  ADD COLUMN activity_name VARCHAR(240) NOT NULL DEFAULT '',
  ADD COLUMN funding_source VARCHAR(160) NOT NULL DEFAULT '',
  ADD COLUMN supporting_document TEXT NOT NULL DEFAULT '';

ALTER TABLE apbd_budget_period_values
  ADD COLUMN target_value NUMERIC(20, 0)
    CONSTRAINT apbd_budget_period_target_value_check
    CHECK (target_value IS NULL OR target_value >= 0),
  ADD COLUMN target_date TIMESTAMPTZ,
  ADD COLUMN document_reference TEXT NOT NULL DEFAULT '';

CREATE TABLE apbd_entry_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  entry_id UUID NOT NULL,
  cloudinary_public_id VARCHAR(512) NOT NULL,
  cloudinary_asset_id VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  media_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL
    CONSTRAINT apbd_entry_documents_file_size_check CHECK (file_size BETWEEN 1 AND 10485760),
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT apbd_entry_documents_entry_tenant_fk
    FOREIGN KEY (entry_id, tenant_id) REFERENCES apbd_entries (id, tenant_id) ON DELETE CASCADE,
  CONSTRAINT apbd_entry_documents_uploaded_by_tenant_fk
    FOREIGN KEY (uploaded_by, tenant_id) REFERENCES users (id, tenant_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX apbd_entry_documents_public_id_idx
  ON apbd_entry_documents (cloudinary_public_id);
CREATE INDEX apbd_entry_documents_entry_idx
  ON apbd_entry_documents (tenant_id, entry_id);

ALTER TABLE apbd_entry_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE apbd_entry_documents FORCE ROW LEVEL SECURITY;
CREATE POLICY apbd_entry_documents_operator_read ON apbd_entry_documents
  FOR SELECT USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM apbd_entries entry
      INNER JOIN apbd_operator_assignments assignment
        ON assignment.tenant_id = entry.tenant_id
        AND assignment.agency_id = entry.agency_id
        AND assignment.region_id = entry.region_id
        AND assignment.sector_id = entry.sector_id
      WHERE entry.id = apbd_entry_documents.entry_id
        AND entry.tenant_id = apbd_entry_documents.tenant_id
        AND entry.status IN ('draft', 'in_review')
        AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    )
  );
CREATE POLICY apbd_entry_documents_operator_insert ON apbd_entry_documents
  FOR INSERT WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND uploaded_by = NULLIF(current_setting('app.user_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM apbd_entries entry
      INNER JOIN apbd_operator_assignments assignment
        ON assignment.tenant_id = entry.tenant_id
        AND assignment.agency_id = entry.agency_id
        AND assignment.region_id = entry.region_id
        AND assignment.sector_id = entry.sector_id
      WHERE entry.id = apbd_entry_documents.entry_id
        AND entry.tenant_id = apbd_entry_documents.tenant_id
        AND entry.status = 'draft'
        AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    )
  );
CREATE POLICY apbd_entry_documents_admin_read ON apbd_entry_documents
  FOR SELECT USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM apbd_entries entry
      WHERE entry.id = apbd_entry_documents.entry_id
        AND entry.tenant_id = apbd_entry_documents.tenant_id
        AND entry.status = 'in_review'
    )
    AND EXISTS (
      SELECT 1 FROM user_roles user_role
      INNER JOIN roles role ON role.id = user_role.role_id
        AND role.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
      WHERE user_role.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        AND user_role.revoked_at IS NULL
        AND (user_role.expires_at IS NULL OR user_role.expires_at > NOW())
        AND role.key IN ('admin', 'superadmin')
    )
  );
CREATE POLICY apbd_entry_documents_admin_delete ON apbd_entry_documents
  FOR DELETE USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND current_setting('app.apbd_purge_rejected', true) = 'true'
    AND EXISTS (
      SELECT 1 FROM apbd_entries entry
      WHERE entry.id = apbd_entry_documents.entry_id
        AND entry.tenant_id = apbd_entry_documents.tenant_id
        AND entry.status = 'in_review'
    )
    AND EXISTS (
      SELECT 1 FROM user_roles user_role
      INNER JOIN roles role ON role.id = user_role.role_id
        AND role.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
      WHERE user_role.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        AND user_role.revoked_at IS NULL
        AND (user_role.expires_at IS NULL OR user_role.expires_at > NOW())
        AND role.key IN ('admin', 'superadmin')
    )
  );

CREATE POLICY apbd_entries_admin_read ON apbd_entries
  FOR SELECT USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND status = 'in_review'
    AND EXISTS (
      SELECT 1 FROM user_roles user_role
      INNER JOIN roles role ON role.id = user_role.role_id
        AND role.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
      WHERE user_role.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        AND user_role.revoked_at IS NULL
        AND (user_role.expires_at IS NULL OR user_role.expires_at > NOW())
        AND role.key IN ('admin', 'superadmin')
    )
  );
CREATE POLICY apbd_entries_admin_update ON apbd_entries
  FOR UPDATE USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND status = 'in_review'
    AND EXISTS (
      SELECT 1 FROM user_roles user_role
      INNER JOIN roles role ON role.id = user_role.role_id
        AND role.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
      WHERE user_role.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        AND user_role.revoked_at IS NULL
        AND (user_role.expires_at IS NULL OR user_role.expires_at > NOW())
        AND role.key IN ('admin', 'superadmin')
    )
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND status = 'published'
    AND reviewed_by = NULLIF(current_setting('app.user_id', true), '')::uuid
  );
CREATE POLICY apbd_entries_admin_delete ON apbd_entries
  FOR DELETE USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND status = 'in_review'
    AND current_setting('app.apbd_purge_rejected', true) = 'true'
    AND EXISTS (
      SELECT 1 FROM user_roles user_role
      INNER JOIN roles role ON role.id = user_role.role_id
        AND role.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
      WHERE user_role.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        AND user_role.revoked_at IS NULL
        AND (user_role.expires_at IS NULL OR user_role.expires_at > NOW())
        AND role.key IN ('admin', 'superadmin')
    )
  );

CREATE POLICY apbd_budget_items_admin_read ON apbd_budget_items
  FOR SELECT USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM apbd_entries entry
      WHERE entry.id = apbd_budget_items.entry_id
        AND entry.tenant_id = apbd_budget_items.tenant_id
        AND entry.status = 'in_review'
    )
    AND EXISTS (
      SELECT 1 FROM user_roles user_role
      INNER JOIN roles role ON role.id = user_role.role_id
        AND role.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
      WHERE user_role.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        AND user_role.revoked_at IS NULL
        AND (user_role.expires_at IS NULL OR user_role.expires_at > NOW())
        AND role.key IN ('admin', 'superadmin')
    )
  );
CREATE POLICY apbd_budget_items_admin_delete ON apbd_budget_items
  FOR DELETE USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND current_setting('app.apbd_purge_rejected', true) = 'true'
    AND EXISTS (
      SELECT 1 FROM apbd_entries entry
      WHERE entry.id = apbd_budget_items.entry_id
        AND entry.tenant_id = apbd_budget_items.tenant_id
        AND entry.status = 'in_review'
    )
    AND EXISTS (
      SELECT 1 FROM user_roles user_role
      INNER JOIN roles role ON role.id = user_role.role_id
        AND role.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
      WHERE user_role.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        AND user_role.revoked_at IS NULL
        AND (user_role.expires_at IS NULL OR user_role.expires_at > NOW())
        AND role.key IN ('admin', 'superadmin')
    )
  );
CREATE POLICY apbd_budget_period_admin_read ON apbd_budget_period_values
  FOR SELECT USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM apbd_entries entry
      WHERE entry.id = apbd_budget_period_values.entry_id
        AND entry.tenant_id = apbd_budget_period_values.tenant_id
        AND entry.status = 'in_review'
    )
    AND EXISTS (
      SELECT 1 FROM user_roles user_role
      INNER JOIN roles role ON role.id = user_role.role_id
        AND role.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
      WHERE user_role.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        AND user_role.revoked_at IS NULL
        AND (user_role.expires_at IS NULL OR user_role.expires_at > NOW())
        AND role.key IN ('admin', 'superadmin')
    )
  );
CREATE POLICY apbd_budget_period_admin_delete ON apbd_budget_period_values
  FOR DELETE USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND current_setting('app.apbd_purge_rejected', true) = 'true'
    AND EXISTS (
      SELECT 1 FROM apbd_entries entry
      WHERE entry.id = apbd_budget_period_values.entry_id
        AND entry.tenant_id = apbd_budget_period_values.tenant_id
        AND entry.status = 'in_review'
    )
    AND EXISTS (
      SELECT 1 FROM user_roles user_role
      INNER JOIN roles role ON role.id = user_role.role_id
        AND role.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
      WHERE user_role.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        AND user_role.revoked_at IS NULL
        AND (user_role.expires_at IS NULL OR user_role.expires_at > NOW())
        AND role.key IN ('admin', 'superadmin')
    )
  );
CREATE POLICY apbd_value_audit_admin_read ON apbd_value_audit
  FOR SELECT USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM apbd_entries entry
      WHERE entry.id = apbd_value_audit.entry_id
        AND entry.tenant_id = apbd_value_audit.tenant_id
        AND entry.status = 'in_review'
    )
    AND EXISTS (
      SELECT 1 FROM user_roles user_role
      INNER JOIN roles role ON role.id = user_role.role_id
        AND role.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
      WHERE user_role.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        AND user_role.revoked_at IS NULL
        AND (user_role.expires_at IS NULL OR user_role.expires_at > NOW())
        AND role.key IN ('admin', 'superadmin')
    )
  );
CREATE POLICY apbd_value_audit_admin_delete ON apbd_value_audit
  FOR DELETE USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND current_setting('app.apbd_purge_rejected', true) = 'true'
    AND EXISTS (
      SELECT 1 FROM apbd_entries entry
      WHERE entry.id = apbd_value_audit.entry_id
        AND entry.tenant_id = apbd_value_audit.tenant_id
        AND entry.status = 'in_review'
    )
    AND EXISTS (
      SELECT 1 FROM user_roles user_role
      INNER JOIN roles role ON role.id = user_role.role_id
        AND role.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
      WHERE user_role.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        AND user_role.revoked_at IS NULL
        AND (user_role.expires_at IS NULL OR user_role.expires_at > NOW())
        AND role.key IN ('admin', 'superadmin')
    )
  );

CREATE OR REPLACE FUNCTION reject_apbd_published_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'published'
      OR OLD.status <> 'in_review'
      OR current_setting('app.apbd_purge_rejected', true) IS DISTINCT FROM 'true'
    THEN
      RAISE EXCEPTION 'only rejected APBD review entries may be purged';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.status = 'published' THEN
    RAISE EXCEPTION 'published APBD entries are immutable';
  END IF;
  IF NEW.status = 'published' AND OLD.status <> 'published' THEN
    IF OLD.status <> 'in_review' OR NEW.reviewed_by IS NULL OR NEW.reviewed_at IS NULL THEN
      RAISE EXCEPTION 'APBD publication requires an approved review';
    END IF;
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
              AND (period.pagu IS NULL OR period.realisasi IS NULL OR period.realisasi > period.pagu)
          )
        )
    ) THEN
      RAISE EXCEPTION 'APBD publication requires complete quarterly values within Pagu';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION reject_apbd_value_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE'
     AND current_setting('app.apbd_purge_rejected', true) = 'true'
     AND EXISTS (
       SELECT 1 FROM apbd_entries entry
       WHERE entry.id = OLD.entry_id
         AND entry.tenant_id = OLD.tenant_id
         AND entry.status = 'in_review'
     )
  THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'apbd_value_audit is append-only except for rejected-entry purge';
END;
$$;