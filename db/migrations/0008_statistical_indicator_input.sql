-- Region-scoped statistical input, period values, supporting files, and immutable value history.

CREATE TABLE statistic_operator_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  agency_id VARCHAR(120) NOT NULL,
  region_id VARCHAR(120) NOT NULL,
  region_name VARCHAR(160) NOT NULL,
  sector_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT statistic_operator_assignments_user_tenant_fk
    FOREIGN KEY (user_id, tenant_id) REFERENCES users (id, tenant_id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX statistic_operator_assignments_scope_idx
  ON statistic_operator_assignments (user_id, tenant_id, agency_id, region_id, sector_id);
CREATE INDEX statistic_operator_assignments_user_tenant_idx
  ON statistic_operator_assignments (user_id, tenant_id);

CREATE TABLE statistic_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agency_id VARCHAR(120) NOT NULL,
  region_id VARCHAR(120) NOT NULL,
  region_name VARCHAR(160) NOT NULL,
  sector_id VARCHAR(100) NOT NULL,
  indicator_id VARCHAR(100) NOT NULL,
  reference_year INTEGER NOT NULL
    CONSTRAINT statistic_entries_reference_year_check CHECK (reference_year BETWEEN 2000 AND 2100),
  source_name VARCHAR(255) NOT NULL DEFAULT '',
  methodology TEXT NOT NULL DEFAULT '',
  status VARCHAR(16) NOT NULL DEFAULT 'draft'
    CONSTRAINT statistic_entries_status_check CHECK (status IN ('draft', 'published')),
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT statistic_entries_created_by_tenant_fk
    FOREIGN KEY (created_by, tenant_id) REFERENCES users (id, tenant_id) ON DELETE RESTRICT,
  CONSTRAINT statistic_entries_updated_by_tenant_fk
    FOREIGN KEY (updated_by, tenant_id) REFERENCES users (id, tenant_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX statistic_entries_id_tenant_idx ON statistic_entries (id, tenant_id);
CREATE UNIQUE INDEX statistic_entries_context_idx
  ON statistic_entries (tenant_id, agency_id, region_id, sector_id, indicator_id, reference_year);
CREATE UNIQUE INDEX statistic_entries_value_context_idx
  ON statistic_entries (id, tenant_id, agency_id, region_id, sector_id, indicator_id, reference_year);
CREATE INDEX statistic_entries_context_lookup_idx
  ON statistic_entries (tenant_id, region_id, reference_year, indicator_id);

CREATE TABLE statistic_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL,
  agency_id VARCHAR(120) NOT NULL,
  region_id VARCHAR(120) NOT NULL,
  sector_id VARCHAR(100) NOT NULL,
  indicator_id VARCHAR(100) NOT NULL,
  reference_year INTEGER NOT NULL,
  period_type VARCHAR(16) NOT NULL
    CONSTRAINT statistic_values_period_type_check CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
    CONSTRAINT statistic_values_period_value_check CHECK (
      (period_type = 'monthly' AND period_value ~ '^(0[1-9]|1[0-2])$')
      OR (period_type = 'quarterly' AND period_value ~ '^Q[1-4]$')
      OR (period_type = 'annual' AND period_value = reference_year::text)
    ),
  period_value VARCHAR(16) NOT NULL,
  actual_value NUMERIC(20, 6) NOT NULL
    CONSTRAINT statistic_values_actual_value_check CHECK (actual_value >= 0),
  explanation TEXT NOT NULL DEFAULT '',
  updated_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT statistic_values_entry_tenant_fk
    FOREIGN KEY (entry_id, tenant_id, agency_id, region_id, sector_id, indicator_id, reference_year)
    REFERENCES statistic_entries (id, tenant_id, agency_id, region_id, sector_id, indicator_id, reference_year)
    ON DELETE CASCADE,
  CONSTRAINT statistic_values_updated_by_tenant_fk
    FOREIGN KEY (updated_by, tenant_id) REFERENCES users (id, tenant_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX statistic_values_period_idx ON statistic_values (entry_id, period_type, period_value);
CREATE UNIQUE INDEX statistic_values_id_tenant_idx ON statistic_values (id, tenant_id);
CREATE INDEX statistic_values_region_year_idx
  ON statistic_values (tenant_id, region_id, indicator_id, reference_year);

CREATE TABLE statistic_value_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL,
  value_id UUID NOT NULL,
  period_value VARCHAR(16) NOT NULL,
  previous_value NUMERIC(20, 6),
  new_value NUMERIC(20, 6) NOT NULL,
  actor_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT statistic_value_audit_entry_tenant_fk
    FOREIGN KEY (entry_id, tenant_id) REFERENCES statistic_entries (id, tenant_id) ON DELETE RESTRICT,
  CONSTRAINT statistic_value_audit_value_tenant_fk
    FOREIGN KEY (value_id, tenant_id) REFERENCES statistic_values (id, tenant_id) ON DELETE RESTRICT,
  CONSTRAINT statistic_value_audit_actor_tenant_fk
    FOREIGN KEY (actor_id, tenant_id) REFERENCES users (id, tenant_id) ON DELETE RESTRICT
);
CREATE INDEX statistic_value_audit_entry_created_idx ON statistic_value_audit (entry_id, created_at DESC);

CREATE FUNCTION reject_statistic_value_audit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'statistic_value_audit is append-only';
END;
$$;
CREATE TRIGGER statistic_value_audit_append_only
  BEFORE UPDATE OR DELETE ON statistic_value_audit
  FOR EACH ROW EXECUTE FUNCTION reject_statistic_value_audit_mutation();

CREATE TABLE statistic_entry_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL,
  cloudinary_public_id VARCHAR(512) NOT NULL,
  cloudinary_asset_id VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  media_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL
    CONSTRAINT statistic_entry_documents_file_size_check CHECK (file_size BETWEEN 1 AND 10485760),
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT statistic_entry_documents_entry_tenant_fk
    FOREIGN KEY (entry_id, tenant_id) REFERENCES statistic_entries (id, tenant_id) ON DELETE CASCADE,
  CONSTRAINT statistic_entry_documents_uploaded_by_tenant_fk
    FOREIGN KEY (uploaded_by, tenant_id) REFERENCES users (id, tenant_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX statistic_entry_documents_cloudinary_public_id_idx
  ON statistic_entry_documents (cloudinary_public_id);
CREATE INDEX statistic_entry_documents_entry_idx ON statistic_entry_documents (tenant_id, entry_id);

ALTER TABLE statistic_operator_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistic_operator_assignments FORCE ROW LEVEL SECURITY;
CREATE POLICY statistic_operator_assignments_user_scope ON statistic_operator_assignments
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );

ALTER TABLE statistic_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistic_entries FORCE ROW LEVEL SECURITY;
CREATE POLICY statistic_entries_assigned_scope ON statistic_entries
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM statistic_operator_assignments assignment
      WHERE assignment.tenant_id = statistic_entries.tenant_id
        AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        AND assignment.agency_id = statistic_entries.agency_id
        AND assignment.region_id = statistic_entries.region_id
        AND assignment.sector_id = statistic_entries.sector_id
    )
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM statistic_operator_assignments assignment
      WHERE assignment.tenant_id = statistic_entries.tenant_id
        AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        AND assignment.agency_id = statistic_entries.agency_id
        AND assignment.region_id = statistic_entries.region_id
        AND assignment.sector_id = statistic_entries.sector_id
    )
  );
CREATE POLICY statistic_entries_public_published ON statistic_entries
  FOR SELECT USING (status = 'published');

ALTER TABLE statistic_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistic_values FORCE ROW LEVEL SECURITY;
CREATE POLICY statistic_values_assigned_scope ON statistic_values
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM statistic_operator_assignments assignment
      WHERE assignment.tenant_id = statistic_values.tenant_id
        AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        AND assignment.agency_id = statistic_values.agency_id
        AND assignment.region_id = statistic_values.region_id
        AND assignment.sector_id = statistic_values.sector_id
    )
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM statistic_operator_assignments assignment
      WHERE assignment.tenant_id = statistic_values.tenant_id
        AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        AND assignment.agency_id = statistic_values.agency_id
        AND assignment.region_id = statistic_values.region_id
        AND assignment.sector_id = statistic_values.sector_id
    )
  );
CREATE POLICY statistic_values_public_published ON statistic_values
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM statistic_entries entry
      WHERE entry.id = statistic_values.entry_id
        AND entry.tenant_id = statistic_values.tenant_id
        AND entry.status = 'published'
    )
  );

ALTER TABLE statistic_value_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistic_value_audit FORCE ROW LEVEL SECURITY;
CREATE POLICY statistic_value_audit_assigned_scope ON statistic_value_audit
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1
      FROM statistic_entries entry
      INNER JOIN statistic_operator_assignments assignment
        ON assignment.tenant_id = entry.tenant_id
        AND assignment.agency_id = entry.agency_id
        AND assignment.region_id = entry.region_id
        AND assignment.sector_id = entry.sector_id
      WHERE entry.id = statistic_value_audit.entry_id
        AND entry.tenant_id = statistic_value_audit.tenant_id
        AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    )
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1
      FROM statistic_entries entry
      INNER JOIN statistic_operator_assignments assignment
        ON assignment.tenant_id = entry.tenant_id
        AND assignment.agency_id = entry.agency_id
        AND assignment.region_id = entry.region_id
        AND assignment.sector_id = entry.sector_id
      WHERE entry.id = statistic_value_audit.entry_id
        AND entry.tenant_id = statistic_value_audit.tenant_id
        AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    )
  );

ALTER TABLE statistic_entry_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistic_entry_documents FORCE ROW LEVEL SECURITY;
CREATE POLICY statistic_entry_documents_assigned_scope ON statistic_entry_documents
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1
      FROM statistic_entries entry
      INNER JOIN statistic_operator_assignments assignment
        ON assignment.tenant_id = entry.tenant_id
        AND assignment.agency_id = entry.agency_id
        AND assignment.region_id = entry.region_id
        AND assignment.sector_id = entry.sector_id
      WHERE entry.id = statistic_entry_documents.entry_id
        AND entry.tenant_id = statistic_entry_documents.tenant_id
        AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    )
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1
      FROM statistic_entries entry
      INNER JOIN statistic_operator_assignments assignment
        ON assignment.tenant_id = entry.tenant_id
        AND assignment.agency_id = entry.agency_id
        AND assignment.region_id = entry.region_id
        AND assignment.sector_id = entry.sector_id
      WHERE entry.id = statistic_entry_documents.entry_id
        AND entry.tenant_id = statistic_entry_documents.tenant_id
        AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    )
  );
