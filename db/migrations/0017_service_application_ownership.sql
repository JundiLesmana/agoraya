ALTER TABLE service_applications
  ADD COLUMN IF NOT EXISTS applicant_user_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'service_applications_applicant_user_id_users_id_fk'
      AND conrelid = 'service_applications'::regclass
  ) THEN
    ALTER TABLE service_applications
      ADD CONSTRAINT service_applications_applicant_user_id_users_id_fk
      FOREIGN KEY (applicant_user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS service_applications_applicant_user_id_idx
  ON service_applications(applicant_user_id);
