-- Rollback: 0002_rbac_module
-- Removes the RBAC policy tables and the grant metadata columns, restoring the
-- pre-0002 grant shape (plain user_roles / role_permissions join tables).
--
-- Warning: dropping `revoked_at` / `expires_at` removes the revocation and
-- expiry history of grants. The audit_events rows stay in place.

DROP TABLE IF EXISTS rbac_policy_versions CASCADE;
DROP TABLE IF EXISTS rbac_policies CASCADE;

DROP INDEX IF EXISTS user_roles_role_id_idx;

ALTER TABLE role_permissions
  DROP COLUMN IF EXISTS granted_at,
  DROP COLUMN IF EXISTS granted_by,
  DROP COLUMN IF EXISTS revoked_at;

ALTER TABLE user_roles
  DROP COLUMN IF EXISTS granted_at,
  DROP COLUMN IF EXISTS granted_by,
  DROP COLUMN IF EXISTS expires_at,
  DROP COLUMN IF EXISTS revoked_at;
