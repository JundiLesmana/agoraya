-- Add password credentials without changing or removing existing user records.
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);

-- Persist login throttling by a one-way identifier digest, never the identifier.
CREATE TABLE identity_login_attempts (
  identifier_hash VARCHAR(64) PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX identity_login_attempts_window_idx ON identity_login_attempts(window_started_at);
