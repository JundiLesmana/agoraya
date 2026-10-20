-- Migration: 0001_initial_schema
-- Description: Initial Agoraya foundation schema.
-- Created: 2026-10-20
--
-- Creates the shared foundation tables (tenants, users, sessions, RBAC,
-- tickets, audit events, BPS snapshots) plus indexes and constraints.
-- Rollback: see 0001_initial_schema.down.sql
--
-- Note: Row-Level Security (RLS) and `updated_at` triggers are intentionally
-- not enabled here. Auth/tenant context is not yet implemented, so enabling
-- RLS now would deny all queries. Add RLS policies and triggers when the
-- auth/tenant layer is introduced (docs/ai/SECURITY_BASELINE.md).

-- ============================================================================
-- Extensions
-- ============================================================================
-- gen_random_uuid() is used as the server-side UUID default.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- Enum types
-- ============================================================================
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE ticket_status AS ENUM ('draft', 'submitted', 'in_progress', 'resolved', 'rejected', 'closed');
CREATE TYPE bps_source AS ENUM ('BPS_API', 'SIMULATED', 'CITIZEN_UNVERIFIED');

-- ============================================================================
-- tenants
-- ============================================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- users (simulated / mock identity only — never real NIK or Dukcapil data)
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  nik VARCHAR(32), -- SIMULATED only
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX users_tenant_id_idx ON users(tenant_id);

-- ============================================================================
-- user_sessions
-- ============================================================================
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX user_sessions_user_id_idx ON user_sessions(user_id);

-- ============================================================================
-- otp_codes (hashed, short-lived, attempt-limited)
-- ============================================================================
-- ============================================================================
-- RBAC: roles
-- ============================================================================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT roles_tenant_id_key_unique UNIQUE (tenant_id, key)
);

-- ============================================================================
-- RBAC: permissions
-- ============================================================================
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- RBAC: role_permissions (join table)
-- ============================================================================
CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ============================================================================
-- RBAC: user_roles (join table)
-- ============================================================================
CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- ============================================================================
-- tickets (civic reporting)
-- ============================================================================
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  citizen_id UUID REFERENCES users(id),
  category VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'draft',
  urgency VARCHAR(50) NOT NULL DEFAULT 'medium',
  location JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX tickets_tenant_id_idx ON tickets(tenant_id);
CREATE INDEX tickets_status_idx ON tickets(status);
CREATE INDEX tickets_citizen_id_idx ON tickets(citizen_id);

-- ============================================================================
-- ticket_audit_logs (append-only state-transition audit)
-- ============================================================================
CREATE TABLE ticket_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  previous_state VARCHAR(50),
  new_state VARCHAR(50),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX ticket_audit_logs_ticket_id_idx ON ticket_audit_logs(ticket_id);

-- ============================================================================
-- bps_snapshots (synthetic / simulated public statistics)
-- ============================================================================
CREATE TABLE bps_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  payload JSONB NOT NULL,
  source_label bps_source NOT NULL DEFAULT 'SIMULATED',
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT bps_snapshots_dataset_region_year_month_unique
    UNIQUE (dataset, region, year, month)
);

-- ============================================================================
-- audit_events (global append-only audit)
-- ============================================================================
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_table VARCHAR(100) NOT NULL,
  target_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX audit_events_actor_id_idx ON audit_events(actor_id);
CREATE INDEX audit_events_created_at_idx ON audit_events(created_at);

CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier_hash VARCHAR(255) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX otp_codes_identifier_hash_idx ON otp_codes(identifier_hash);
