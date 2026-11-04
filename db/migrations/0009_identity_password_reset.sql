-- Migration: 0009_identity_password_reset
-- Description: Adds single-use, time-limited password reset tokens for the
-- forgot-password flow. Tokens are stored hashed and bound to a hashed
-- identifier (NIK or email) and the user account, never the raw identifier.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  identifier_hash VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX password_reset_tokens_identifier_hash_idx ON password_reset_tokens(identifier_hash);
CREATE INDEX password_reset_tokens_user_id_idx ON password_reset_tokens(user_id);
