-- Migration: 0003_cms_module
-- CMS workflow, risk review, immutable versions, soft-delete, and audit trail.
-- Rollback: 0003_cms_module.down.sql

CREATE TYPE cms_content_status AS ENUM ('draft', 'in_review', 'published', 'archived');
CREATE TYPE cms_risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE cms_risk_decision AS ENUM ('approved', 'rejected');

CREATE TABLE cms_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug VARCHAR(160) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body JSONB NOT NULL,
  status cms_content_status NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  published_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT cms_contents_tenant_slug_unique UNIQUE (tenant_id, slug)
);
CREATE INDEX cms_contents_tenant_status_idx ON cms_contents(tenant_id, status) WHERE deleted_at IS NULL;

CREATE TABLE cms_content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES cms_contents(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version > 0),
  title VARCHAR(255) NOT NULL,
  body JSONB NOT NULL,
  status cms_content_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT cms_content_versions_content_version_unique UNIQUE(content_id, version)
);
CREATE INDEX cms_content_versions_tenant_content_idx ON cms_content_versions(tenant_id, content_id, version);

CREATE TABLE cms_risk_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES cms_contents(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 10),
  level cms_risk_level NOT NULL,
  decision cms_risk_decision NOT NULL,
  rationale TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT cms_risk_reviews_content_reviewer_unique UNIQUE(content_id, reviewer_id)
);
CREATE INDEX cms_risk_reviews_content_id_idx ON cms_risk_reviews(content_id);

CREATE TABLE cms_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES cms_contents(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action VARCHAR(100) NOT NULL,
  previous_status cms_content_status,
  next_status cms_content_status,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX cms_audit_logs_content_created_idx ON cms_audit_logs(content_id, created_at);

-- Version, risk-review, and CMS audit records are compliance evidence.
CREATE FUNCTION prevent_cms_history_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'CMS history is append-only'; END; $$;
CREATE TRIGGER cms_versions_append_only BEFORE UPDATE OR DELETE ON cms_content_versions FOR EACH ROW EXECUTE FUNCTION prevent_cms_history_mutation();
CREATE TRIGGER cms_risk_reviews_append_only BEFORE UPDATE OR DELETE ON cms_risk_reviews FOR EACH ROW EXECUTE FUNCTION prevent_cms_history_mutation();
CREATE TRIGGER cms_audit_logs_append_only BEFORE UPDATE OR DELETE ON cms_audit_logs FOR EACH ROW EXECUTE FUNCTION prevent_cms_history_mutation();
