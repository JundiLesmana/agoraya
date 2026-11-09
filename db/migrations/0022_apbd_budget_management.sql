CREATE TABLE apbd_operator_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL,
  agency_id VARCHAR(120) NOT NULL,
  region_id VARCHAR(120) NOT NULL,
  region_name VARCHAR(160) NOT NULL,
  sector_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT apbd_operator_assignments_user_tenant_fk
    FOREIGN KEY (user_id, tenant_id) REFERENCES users (id, tenant_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX apbd_operator_assignments_scope_idx
  ON apbd_operator_assignments (user_id, tenant_id, agency_id, region_id, sector_id);
CREATE INDEX apbd_operator_assignments_user_tenant_idx
  ON apbd_operator_assignments (user_id, tenant_id);
COMMENT ON TABLE apbd_operator_assignments IS
  'Administrator-provisioned APBD scope; never writable from operator APIs.';

ALTER TABLE apbd_operator_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE apbd_operator_assignments FORCE ROW LEVEL SECURITY;
CREATE POLICY apbd_operator_assignments_tenant_read ON apbd_operator_assignments
  FOR SELECT USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );

CREATE TABLE apbd_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  agency_id VARCHAR(120) NOT NULL,
  region_id VARCHAR(120) NOT NULL,
  region_name VARCHAR(160) NOT NULL,
  sector_id VARCHAR(100) NOT NULL,
  reference_year INTEGER NOT NULL
    CONSTRAINT apbd_entries_reference_year_check CHECK (reference_year BETWEEN 2000 AND 2100),
  status VARCHAR(16) NOT NULL DEFAULT 'draft'
    CONSTRAINT apbd_entries_status_check CHECK (status IN ('draft', 'published')),
  revision_of_id UUID,
  revision_reason TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT apbd_entries_id_tenant_unique UNIQUE (id, tenant_id),
  CONSTRAINT apbd_entries_revision_tenant_fk
    FOREIGN KEY (revision_of_id, tenant_id)
    REFERENCES apbd_entries (id, tenant_id) ON DELETE RESTRICT,
  CONSTRAINT apbd_entries_revision_note_check CHECK (
    revision_of_id IS NULL OR length(btrim(revision_reason)) >= 10
  ),
  CONSTRAINT apbd_entries_published_at_check CHECK (
    status <> 'published' OR published_at IS NOT NULL
  ),
  CONSTRAINT apbd_entries_created_by_tenant_fk
    FOREIGN KEY (created_by, tenant_id) REFERENCES users (id, tenant_id) ON DELETE RESTRICT,
  CONSTRAINT apbd_entries_updated_by_tenant_fk
    FOREIGN KEY (updated_by, tenant_id) REFERENCES users (id, tenant_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX apbd_entries_draft_context_idx
  ON apbd_entries (tenant_id, agency_id, region_id, sector_id, reference_year)
  WHERE status = 'draft';
CREATE INDEX apbd_entries_publication_idx
  ON apbd_entries (status, published_at DESC, reference_year);

CREATE TABLE apbd_budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  entry_id UUID NOT NULL,
  code VARCHAR(64) NOT NULL,
  program_name VARCHAR(160) NOT NULL,
  subactivity_name VARCHAR(240) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT apbd_budget_items_id_scope_unique UNIQUE (id, tenant_id, entry_id),
  CONSTRAINT apbd_budget_items_entry_tenant_fk
    FOREIGN KEY (entry_id, tenant_id) REFERENCES apbd_entries (id, tenant_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX apbd_budget_items_code_idx
  ON apbd_budget_items (entry_id, code);
CREATE INDEX apbd_budget_items_entry_idx ON apbd_budget_items (tenant_id, entry_id);

CREATE TABLE apbd_budget_period_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  entry_id UUID NOT NULL,
  item_id UUID NOT NULL,
  period_type VARCHAR(16) NOT NULL
    CONSTRAINT apbd_budget_period_type_check CHECK (period_type IN ('monthly', 'quarterly')),
  period_value VARCHAR(16) NOT NULL,
  pagu NUMERIC(20, 0)
    CONSTRAINT apbd_budget_period_pagu_check CHECK (pagu IS NULL OR pagu >= 0),
  realisasi NUMERIC(20, 0)
    CONSTRAINT apbd_budget_period_realisasi_check CHECK (realisasi IS NULL OR realisasi >= 0),
  updated_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT apbd_budget_period_value_check CHECK (
    (period_type = 'monthly' AND period_value ~ '^(0[1-9]|1[0-2])$')
    OR (period_type = 'quarterly' AND period_value ~ '^Q[1-4]$')
  ),
  CONSTRAINT apbd_budget_period_item_scope_fk
    FOREIGN KEY (item_id, tenant_id, entry_id)
    REFERENCES apbd_budget_items (id, tenant_id, entry_id) ON DELETE RESTRICT,
  CONSTRAINT apbd_budget_period_updated_by_tenant_fk
    FOREIGN KEY (updated_by, tenant_id) REFERENCES users (id, tenant_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX apbd_budget_period_value_idx
  ON apbd_budget_period_values (item_id, period_type, period_value);
CREATE INDEX apbd_budget_period_entry_idx
  ON apbd_budget_period_values (tenant_id, entry_id, period_type, period_value);

CREATE TABLE apbd_value_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  entry_id UUID NOT NULL,
  item_id UUID NOT NULL,
  period_type VARCHAR(16) NOT NULL,
  period_value VARCHAR(16) NOT NULL,
  field VARCHAR(16) NOT NULL
    CONSTRAINT apbd_value_audit_field_check CHECK (field IN ('pagu', 'realisasi')),
  previous_value NUMERIC(20, 0),
  new_value NUMERIC(20, 0),
  actor_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT apbd_value_audit_value_changed_check CHECK (
    previous_value IS DISTINCT FROM new_value
  ),
  CONSTRAINT apbd_value_audit_item_scope_fk
    FOREIGN KEY (item_id, tenant_id, entry_id)
    REFERENCES apbd_budget_items (id, tenant_id, entry_id) ON DELETE RESTRICT,
  CONSTRAINT apbd_value_audit_actor_tenant_fk
    FOREIGN KEY (actor_id, tenant_id) REFERENCES users (id, tenant_id) ON DELETE RESTRICT
);
CREATE INDEX apbd_value_audit_entry_created_idx
  ON apbd_value_audit (tenant_id, entry_id, created_at DESC);

CREATE FUNCTION reject_apbd_published_mutation()
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
CREATE TRIGGER apbd_entries_published_immutable
  BEFORE UPDATE OR DELETE ON apbd_entries
  FOR EACH ROW EXECUTE FUNCTION reject_apbd_published_mutation();

CREATE FUNCTION reject_apbd_value_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'apbd_value_audit is append-only';
END;
$$;
CREATE TRIGGER apbd_value_audit_append_only
  BEFORE UPDATE OR DELETE ON apbd_value_audit
  FOR EACH ROW EXECUTE FUNCTION reject_apbd_value_audit_mutation();

CREATE FUNCTION validate_apbd_revision()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  latest_published_id UUID;
BEGIN
  SELECT entry.id INTO latest_published_id
  FROM apbd_entries entry
  WHERE entry.tenant_id = NEW.tenant_id
    AND entry.agency_id = NEW.agency_id
    AND entry.region_id = NEW.region_id
    AND entry.sector_id = NEW.sector_id
    AND entry.reference_year = NEW.reference_year
    AND entry.status = 'published'
  ORDER BY entry.published_at DESC, entry.id DESC
  LIMIT 1;

  IF latest_published_id IS NOT NULL
    AND NEW.revision_of_id IS DISTINCT FROM latest_published_id THEN
    RAISE EXCEPTION 'a published APBD entry can only be corrected by a revision';
  END IF;
  IF NEW.revision_of_id IS NOT NULL
    AND NEW.revision_of_id IS DISTINCT FROM latest_published_id THEN
    RAISE EXCEPTION 'APBD revisions must reference the latest publication';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER apbd_entries_revision_guard
  BEFORE INSERT ON apbd_entries
  FOR EACH ROW EXECUTE FUNCTION validate_apbd_revision();

ALTER TABLE apbd_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE apbd_entries FORCE ROW LEVEL SECURITY;
CREATE POLICY apbd_entries_assigned_read ON apbd_entries
  FOR SELECT USING (
    status = 'published'
    OR (
      tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
      AND EXISTS (
        SELECT 1 FROM apbd_operator_assignments assignment
        WHERE assignment.tenant_id = apbd_entries.tenant_id
          AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
          AND assignment.agency_id = apbd_entries.agency_id
          AND assignment.region_id = apbd_entries.region_id
          AND assignment.sector_id = apbd_entries.sector_id
      )
    )
  );
CREATE POLICY apbd_entries_assigned_insert ON apbd_entries
  FOR INSERT WITH CHECK (
    status = 'draft'
    AND tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM apbd_operator_assignments assignment
      WHERE assignment.tenant_id = apbd_entries.tenant_id
        AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        AND assignment.agency_id = apbd_entries.agency_id
        AND assignment.region_id = apbd_entries.region_id
        AND assignment.sector_id = apbd_entries.sector_id
    )
  );
CREATE POLICY apbd_entries_assigned_update ON apbd_entries
  FOR UPDATE USING (
    status = 'draft'
    AND tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM apbd_operator_assignments assignment
      WHERE assignment.tenant_id = apbd_entries.tenant_id
        AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        AND assignment.agency_id = apbd_entries.agency_id
        AND assignment.region_id = apbd_entries.region_id
        AND assignment.sector_id = apbd_entries.sector_id
    )
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM apbd_operator_assignments assignment
      WHERE assignment.tenant_id = apbd_entries.tenant_id
        AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        AND assignment.agency_id = apbd_entries.agency_id
        AND assignment.region_id = apbd_entries.region_id
        AND assignment.sector_id = apbd_entries.sector_id
    )
  );

ALTER TABLE apbd_budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE apbd_budget_items FORCE ROW LEVEL SECURITY;
CREATE POLICY apbd_budget_items_assigned_read ON apbd_budget_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM apbd_entries entry
      WHERE entry.id = apbd_budget_items.entry_id
        AND entry.tenant_id = apbd_budget_items.tenant_id
        AND (
          entry.status = 'published'
          OR (
            entry.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
            AND EXISTS (
              SELECT 1 FROM apbd_operator_assignments assignment
              WHERE assignment.tenant_id = entry.tenant_id
                AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
                AND assignment.agency_id = entry.agency_id
                AND assignment.region_id = entry.region_id
                AND assignment.sector_id = entry.sector_id
            )
          )
        )
    )
  );
CREATE POLICY apbd_budget_items_assigned_insert ON apbd_budget_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM apbd_entries entry
      WHERE entry.id = apbd_budget_items.entry_id
        AND entry.tenant_id = apbd_budget_items.tenant_id
        AND entry.status = 'draft'
        AND entry.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
        AND EXISTS (
          SELECT 1 FROM apbd_operator_assignments assignment
          WHERE assignment.tenant_id = entry.tenant_id
            AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
            AND assignment.agency_id = entry.agency_id
            AND assignment.region_id = entry.region_id
            AND assignment.sector_id = entry.sector_id
        )
    )
  );
CREATE POLICY apbd_budget_items_assigned_update ON apbd_budget_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM apbd_entries entry
      WHERE entry.id = apbd_budget_items.entry_id
        AND entry.tenant_id = apbd_budget_items.tenant_id
        AND entry.status = 'draft'
        AND entry.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
        AND EXISTS (
          SELECT 1 FROM apbd_operator_assignments assignment
          WHERE assignment.tenant_id = entry.tenant_id
            AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
            AND assignment.agency_id = entry.agency_id
            AND assignment.region_id = entry.region_id
            AND assignment.sector_id = entry.sector_id
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM apbd_entries entry
      WHERE entry.id = apbd_budget_items.entry_id
        AND entry.tenant_id = apbd_budget_items.tenant_id
        AND entry.status = 'draft'
        AND entry.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
        AND EXISTS (
          SELECT 1 FROM apbd_operator_assignments assignment
          WHERE assignment.tenant_id = entry.tenant_id
            AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
            AND assignment.agency_id = entry.agency_id
            AND assignment.region_id = entry.region_id
            AND assignment.sector_id = entry.sector_id
        )
    )
  );

ALTER TABLE apbd_budget_period_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE apbd_budget_period_values FORCE ROW LEVEL SECURITY;
CREATE POLICY apbd_budget_period_assigned_read ON apbd_budget_period_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM apbd_entries entry
      WHERE entry.id = apbd_budget_period_values.entry_id
        AND entry.tenant_id = apbd_budget_period_values.tenant_id
        AND (
          entry.status = 'published'
          OR (
            entry.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
            AND EXISTS (
              SELECT 1 FROM apbd_operator_assignments assignment
              WHERE assignment.tenant_id = entry.tenant_id
                AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
                AND assignment.agency_id = entry.agency_id
                AND assignment.region_id = entry.region_id
                AND assignment.sector_id = entry.sector_id
            )
          )
        )
    )
  );
CREATE POLICY apbd_budget_period_assigned_insert ON apbd_budget_period_values
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM apbd_entries entry
      WHERE entry.id = apbd_budget_period_values.entry_id
        AND entry.tenant_id = apbd_budget_period_values.tenant_id
        AND entry.status = 'draft'
        AND entry.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
        AND EXISTS (
          SELECT 1 FROM apbd_operator_assignments assignment
          WHERE assignment.tenant_id = entry.tenant_id
            AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
            AND assignment.agency_id = entry.agency_id
            AND assignment.region_id = entry.region_id
            AND assignment.sector_id = entry.sector_id
        )
    )
  );
CREATE POLICY apbd_budget_period_assigned_update ON apbd_budget_period_values
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM apbd_entries entry
      WHERE entry.id = apbd_budget_period_values.entry_id
        AND entry.tenant_id = apbd_budget_period_values.tenant_id
        AND entry.status = 'draft'
        AND entry.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
        AND EXISTS (
          SELECT 1 FROM apbd_operator_assignments assignment
          WHERE assignment.tenant_id = entry.tenant_id
            AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
            AND assignment.agency_id = entry.agency_id
            AND assignment.region_id = entry.region_id
            AND assignment.sector_id = entry.sector_id
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM apbd_entries entry
      WHERE entry.id = apbd_budget_period_values.entry_id
        AND entry.tenant_id = apbd_budget_period_values.tenant_id
        AND entry.status = 'draft'
        AND entry.tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
        AND EXISTS (
          SELECT 1 FROM apbd_operator_assignments assignment
          WHERE assignment.tenant_id = entry.tenant_id
            AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
            AND assignment.agency_id = entry.agency_id
            AND assignment.region_id = entry.region_id
            AND assignment.sector_id = entry.sector_id
        )
    )
  );

ALTER TABLE apbd_value_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE apbd_value_audit FORCE ROW LEVEL SECURITY;
CREATE POLICY apbd_value_audit_assigned_read ON apbd_value_audit
  FOR SELECT USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM apbd_entries entry
      INNER JOIN apbd_operator_assignments assignment
        ON assignment.tenant_id = entry.tenant_id
        AND assignment.agency_id = entry.agency_id
        AND assignment.region_id = entry.region_id
        AND assignment.sector_id = entry.sector_id
      WHERE entry.id = apbd_value_audit.entry_id
        AND entry.tenant_id = apbd_value_audit.tenant_id
        AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    )
  );
CREATE POLICY apbd_value_audit_assigned_insert ON apbd_value_audit
  FOR INSERT WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND actor_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM apbd_entries entry
      INNER JOIN apbd_operator_assignments assignment
        ON assignment.tenant_id = entry.tenant_id
        AND assignment.agency_id = entry.agency_id
        AND assignment.region_id = entry.region_id
        AND assignment.sector_id = entry.sector_id
      WHERE entry.id = apbd_value_audit.entry_id
        AND entry.tenant_id = apbd_value_audit.tenant_id
        AND entry.status = 'draft'
        AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    )
  );
