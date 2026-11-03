-- Tenant-scoped contract data, monthly progress reports, and Cloudinary metadata.

CREATE TYPE project_progress_status AS ENUM ('draft', 'submitted');

CREATE UNIQUE INDEX users_id_tenant_idx ON users (id, tenant_id);

CREATE TABLE infrastructure_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  assigned_user_id UUID NOT NULL,
  external_project_id VARCHAR(160) NOT NULL,
  package_name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  sector VARCHAR(100) NOT NULL,
  contract_value NUMERIC(18, 2) NOT NULL,
  provider_name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  fiscal_year INTEGER NOT NULL,
  initial_physical_progress NUMERIC(5, 2) NOT NULL DEFAULT 0
    CONSTRAINT infrastructure_projects_initial_physical_check
    CHECK (initial_physical_progress BETWEEN 0 AND 100),
  initial_financial_progress NUMERIC(5, 2) NOT NULL DEFAULT 0
    CONSTRAINT infrastructure_projects_initial_financial_check
    CHECK (initial_financial_progress BETWEEN 0 AND 100),
  status VARCHAR(30) NOT NULL DEFAULT 'ongoing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT infrastructure_projects_assigned_user_tenant_fk
    FOREIGN KEY (assigned_user_id, tenant_id)
    REFERENCES users (id, tenant_id) ON DELETE RESTRICT,
  CONSTRAINT infrastructure_projects_contract_value_check
    CHECK (contract_value >= 0),
  CONSTRAINT infrastructure_projects_date_range_check CHECK (end_date >= start_date)
);

CREATE UNIQUE INDEX infrastructure_projects_tenant_external_project_idx
  ON infrastructure_projects (tenant_id, external_project_id);
CREATE UNIQUE INDEX infrastructure_projects_id_tenant_idx
  ON infrastructure_projects (id, tenant_id);
CREATE INDEX infrastructure_projects_tenant_assigned_idx
  ON infrastructure_projects (tenant_id, assigned_user_id);
CREATE INDEX infrastructure_projects_fiscal_year_idx
  ON infrastructure_projects (fiscal_year);

CREATE TABLE project_progress_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL,
  reported_by UUID NOT NULL,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  physical_progress NUMERIC(5, 2) NOT NULL,
  financial_progress NUMERIC(5, 2) NOT NULL,
  evaluation_notes TEXT NOT NULL DEFAULT '',
  status project_progress_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT project_progress_reports_project_tenant_fk
    FOREIGN KEY (project_id, tenant_id)
    REFERENCES infrastructure_projects (id, tenant_id) ON DELETE CASCADE,
  CONSTRAINT project_progress_reports_reported_by_tenant_fk
    FOREIGN KEY (reported_by, tenant_id)
    REFERENCES users (id, tenant_id) ON DELETE RESTRICT,
  CONSTRAINT project_progress_reports_period_check
    CHECK (period_month BETWEEN 1 AND 12 AND period_year BETWEEN 2020 AND 2100),
  CONSTRAINT project_progress_reports_physical_check
    CHECK (physical_progress BETWEEN 0 AND 100),
  CONSTRAINT project_progress_reports_financial_check
    CHECK (financial_progress BETWEEN 0 AND 100)
);

CREATE UNIQUE INDEX project_progress_reports_project_period_idx
  ON project_progress_reports (project_id, period_year, period_month);
CREATE UNIQUE INDEX project_progress_reports_id_tenant_idx
  ON project_progress_reports (id, tenant_id);
CREATE INDEX project_progress_reports_tenant_project_period_idx
  ON project_progress_reports (tenant_id, project_id, period_year, period_month);

CREATE TABLE project_progress_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  report_id UUID NOT NULL,
  cloudinary_public_id VARCHAR(512) NOT NULL,
  cloudinary_asset_id VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  media_type VARCHAR(32) NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT project_progress_attachments_report_tenant_fk
    FOREIGN KEY (report_id, tenant_id)
    REFERENCES project_progress_reports (id, tenant_id) ON DELETE CASCADE,
  CONSTRAINT project_progress_attachments_uploaded_by_tenant_fk
    FOREIGN KEY (uploaded_by, tenant_id)
    REFERENCES users (id, tenant_id) ON DELETE RESTRICT,
  CONSTRAINT project_progress_attachments_media_type_check
    CHECK (media_type IN ('image/jpeg', 'image/png')),
  CONSTRAINT project_progress_attachments_file_size_check
    CHECK (file_size BETWEEN 1 AND 5242880)
);

CREATE UNIQUE INDEX project_progress_attachments_cloudinary_public_id_idx
  ON project_progress_attachments (cloudinary_public_id);
CREATE INDEX project_progress_attachments_tenant_report_idx
  ON project_progress_attachments (tenant_id, report_id);

ALTER TABLE infrastructure_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE infrastructure_projects FORCE ROW LEVEL SECURITY;
CREATE POLICY infrastructure_projects_owner_isolation
  ON infrastructure_projects
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND assigned_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND assigned_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
  );

ALTER TABLE project_progress_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_progress_reports FORCE ROW LEVEL SECURITY;
CREATE POLICY project_progress_reports_owner_isolation
  ON project_progress_reports
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1
      FROM infrastructure_projects
      WHERE infrastructure_projects.id = project_progress_reports.project_id
        AND infrastructure_projects.tenant_id = project_progress_reports.tenant_id
        AND infrastructure_projects.assigned_user_id =
          NULLIF(current_setting('app.user_id', true), '')::uuid
    )
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1
      FROM infrastructure_projects
      WHERE infrastructure_projects.id = project_progress_reports.project_id
        AND infrastructure_projects.tenant_id = project_progress_reports.tenant_id
        AND infrastructure_projects.assigned_user_id =
          NULLIF(current_setting('app.user_id', true), '')::uuid
    )
  );

ALTER TABLE project_progress_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_progress_attachments FORCE ROW LEVEL SECURITY;
CREATE POLICY project_progress_attachments_owner_isolation
  ON project_progress_attachments
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1
      FROM project_progress_reports
      WHERE project_progress_reports.id = project_progress_attachments.report_id
        AND project_progress_reports.tenant_id = project_progress_attachments.tenant_id
    )
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1
      FROM project_progress_reports
      WHERE project_progress_reports.id = project_progress_attachments.report_id
        AND project_progress_reports.tenant_id = project_progress_attachments.tenant_id
    )
  );
