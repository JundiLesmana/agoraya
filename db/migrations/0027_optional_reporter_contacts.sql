ALTER TABLE ticket_submission_details
  ALTER COLUMN reporter_email DROP NOT NULL,
  ALTER COLUMN reporter_phone DROP NOT NULL;