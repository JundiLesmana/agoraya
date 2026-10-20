-- Rollback: 0001_initial_schema
-- Drops every object created by 0001_initial_schema.sql in reverse dependency
-- order so foreign keys and enum types can be removed cleanly.
-- Run with a direct (unpooled) connection: DATABASE_URL_UNPOOLED.

DROP TABLE IF EXISTS audit_events CASCADE;
DROP TABLE IF EXISTS bps_snapshots CASCADE;
DROP TABLE IF EXISTS ticket_audit_logs CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS otp_codes CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

DROP TYPE IF EXISTS bps_source CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
