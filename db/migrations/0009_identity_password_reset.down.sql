-- Migration: 0009_identity_password_reset.down
DROP TABLE IF EXISTS password_reset_tokens;
