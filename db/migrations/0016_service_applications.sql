CREATE TABLE IF NOT EXISTS service_applications (
  id UUID PRIMARY KEY NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tracking_number VARCHAR(40) NOT NULL,
  category VARCHAR(32) NOT NULL,
  service_type VARCHAR(80) NOT NULL,
  service_id VARCHAR(80) NOT NULL,
  route_key VARCHAR(160) NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  agency VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'submitted',
  applicant_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS service_applications_tracking_number_idx
  ON service_applications(tracking_number);
CREATE INDEX IF NOT EXISTS service_applications_tenant_id_idx
  ON service_applications(tenant_id);
CREATE INDEX IF NOT EXISTS service_applications_category_idx
  ON service_applications(tenant_id, category);
CREATE INDEX IF NOT EXISTS service_applications_service_idx
  ON service_applications(tenant_id, category, service_type, service_id);
CREATE INDEX IF NOT EXISTS service_applications_submitted_at_idx
  ON service_applications(submitted_at);
