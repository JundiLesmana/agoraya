DROP INDEX IF EXISTS audit_events_chain_sequence_idx;
DROP TRIGGER IF EXISTS audit_events_append_only ON audit_events;
DROP FUNCTION IF EXISTS prevent_audit_event_mutation();
ALTER TABLE audit_events
  DROP COLUMN IF EXISTS signature,
  DROP COLUMN IF EXISTS hash,
  DROP COLUMN IF EXISTS previous_hash,
  DROP COLUMN IF EXISTS chain_sequence;
ALTER TABLE users DROP COLUMN IF EXISTS email_verified_at;

DROP INDEX IF EXISTS executive_access_tenant_id_idx;
DROP TABLE IF EXISTS executive_access;

DROP INDEX IF EXISTS module_access_active_unique_idx;
DROP INDEX IF EXISTS module_access_tenant_id_idx;
DROP INDEX IF EXISTS module_access_user_module_idx;
DROP TABLE IF EXISTS module_access;

DROP INDEX IF EXISTS user_application_roles_active_unique_idx;
DROP INDEX IF EXISTS user_application_roles_tenant_id_idx;
DROP INDEX IF EXISTS user_application_roles_role_id_idx;
DROP INDEX IF EXISTS user_application_roles_user_id_idx;
DROP TABLE IF EXISTS user_application_roles;
DROP TABLE IF EXISTS application_roles;

DROP INDEX IF EXISTS asn_profiles_position_id_idx;
DROP INDEX IF EXISTS asn_profiles_opd_name_idx;
DROP INDEX IF EXISTS asn_profiles_tenant_id_idx;
DROP TABLE IF EXISTS asn_profiles;
DROP TABLE IF EXISTS job_positions;
DROP TYPE IF EXISTS job_position_type;
