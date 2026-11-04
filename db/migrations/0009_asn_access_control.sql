-- Migration: 0009_asn_access_control
-- Description: Separate ASN employment positions from application and module access.
-- Created: 2026-11-03
-- Rollback: see 0009_asn_access_control.down.sql

CREATE TYPE job_position_type AS ENUM ('structural', 'functional');

CREATE TABLE job_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  position_type job_position_type,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX job_positions_name_idx ON job_positions(name);

CREATE TABLE asn_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nip VARCHAR(32),
  opd_name VARCHAR(255),
  unit_name VARCHAR(255),
  position_id UUID REFERENCES job_positions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX asn_profiles_tenant_id_idx ON asn_profiles(tenant_id);
CREATE INDEX asn_profiles_opd_name_idx ON asn_profiles(opd_name);
CREATE INDEX asn_profiles_position_id_idx ON asn_profiles(position_id);

CREATE TABLE application_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX application_roles_key_idx ON application_roles(key);
INSERT INTO application_roles (key, name) VALUES
  ('operator', 'Operator'),
  ('verifikator', 'Verifikator'),
  ('kyc_verifikator', 'Verifikator KYC'),
  ('cms_operator', 'Operator CMS');

CREATE TABLE user_application_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_role_id UUID NOT NULL REFERENCES application_roles(id) ON DELETE RESTRICT,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX user_application_roles_user_id_idx ON user_application_roles(user_id);
CREATE INDEX user_application_roles_role_id_idx ON user_application_roles(application_role_id);
CREATE INDEX user_application_roles_tenant_id_idx ON user_application_roles(tenant_id);
CREATE UNIQUE INDEX user_application_roles_active_unique_idx
  ON user_application_roles(user_id, application_role_id)
  WHERE revoked_at IS NULL;

CREATE TABLE module_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_key VARCHAR(32) NOT NULL CHECK (module_key IN ('ogd', 'insight', 'kyc', 'pst', 'civic_reporting')),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX module_access_user_module_idx ON module_access(user_id, module_key);
CREATE INDEX module_access_tenant_id_idx ON module_access(tenant_id);
CREATE UNIQUE INDEX module_access_active_unique_idx
  ON module_access(user_id, module_key)
  WHERE revoked_at IS NULL;

CREATE TABLE executive_access (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('observer', 'not_granted')),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX executive_access_tenant_id_idx ON executive_access(tenant_id);

ALTER TABLE audit_events
  ADD COLUMN chain_sequence INTEGER,
  ADD COLUMN previous_hash VARCHAR(64),
  ADD COLUMN hash VARCHAR(64),
  ADD COLUMN signature VARCHAR(64);
CREATE UNIQUE INDEX audit_events_chain_sequence_idx
  ON audit_events(chain_sequence)
  WHERE chain_sequence IS NOT NULL;

CREATE FUNCTION prevent_audit_event_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only';
END;
$$;
CREATE TRIGGER audit_events_append_only
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_event_mutation();

ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP WITH TIME ZONE;
