-- Align the ticket status column with the Drizzle schema and reporting module.
ALTER TABLE tickets RENAME COLUMN status TO ticket_status;
