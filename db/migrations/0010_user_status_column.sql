-- Align the users status column with the Drizzle schema and identity module.
ALTER TABLE users RENAME COLUMN status TO user_status;
