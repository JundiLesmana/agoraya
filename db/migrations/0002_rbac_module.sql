-- Migration: 0002_rbac_module
-- Description: RBAC module — policy definitions with an append-only version
-- history, and auditable grants (who granted, when, expiry, revocation).
-- Created: 2026-10-21
-- Rollback: see 0002_rbac_module.down.sql
--
-- Notes:
-- - Grants are soft-revoked (`revoked_at`) so a revocation stays auditable;
--   an expired grant (`expires_at`) is ignored by the RBAC module.
-- - `rbac_policies` holds the current definition, `rbac_policy_versions` keeps
--   one immutable snapshot per version for review.

-- ============================================================================
-- user_roles — grant metadata
-- ============================================================================
ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS user_roles_role_id_idx ON user_roles(role_id);

-- ============================================================================
-- role_permissions — grant metadata
-- ============================================================================
ALTER TABLE role_permissions
  ADD COLUMN IF NOT EXISTS granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- rbac_policies
-- ============================================================================
CREATE TABLE rbac_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  effect VARCHAR(20) NOT NULL DEFAULT 'allow',
  priority INTEGER NOT NULL DEFAULT 100,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  version INTEGER NOT NULL DEFAULT 1,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  roles JSONB NOT NULL DEFAULT '[]'::jsonb,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  resources JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT rbac_policies_effect_check CHECK (effect IN ('allow', 'deny')),
  CONSTRAINT rbac_policies_status_check CHECK (status IN ('draft', 'active', 'archived'))
);
CREATE INDEX rbac_policies_status_idx ON rbac_policies(status);
CREATE INDEX rbac_policies_tenant_id_idx ON rbac_policies(tenant_id);

-- ============================================================================
-- rbac_policy_versions (append-only history)
-- ============================================================================
CREATE TABLE rbac_policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES rbac_policies(id) ON DELETE CASCADE,
  policy_key VARCHAR(100) NOT NULL,
  version INTEGER NOT NULL,
  definition JSONB NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT rbac_policy_versions_policy_id_version_unique UNIQUE (policy_id, version)
);
CREATE INDEX rbac_policy_versions_policy_key_idx ON rbac_policy_versions(policy_key);
