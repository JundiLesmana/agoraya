ALTER TABLE public.service_applications
  ADD COLUMN IF NOT EXISTS assignee_id uuid;
--> statement-breakpoint
DO $$
DECLARE
  existing_constraint name;
BEGIN
  SELECT constraint_row.conname INTO existing_constraint
  FROM pg_constraint AS constraint_row
  WHERE constraint_row.contype = 'f'
    AND constraint_row.conrelid = 'public.service_applications'::regclass
    AND constraint_row.confrelid = 'public.users'::regclass
    AND constraint_row.conkey = ARRAY[
      (
        SELECT attnum
        FROM pg_attribute
        WHERE attrelid = 'public.service_applications'::regclass
          AND attname = 'assignee_id'
          AND NOT attisdropped
      )
    ]::smallint[]
  ORDER BY (constraint_row.conname = 'service_applications_assignee_id_users_id_fk') DESC
  LIMIT 1;

  IF existing_constraint IS NULL THEN
    ALTER TABLE public.service_applications
      ADD CONSTRAINT service_applications_assignee_id_users_id_fk
      FOREIGN KEY (assignee_id)
      REFERENCES public.users(id)
      ON DELETE SET NULL;
  ELSIF existing_constraint <> 'service_applications_assignee_id_users_id_fk' THEN
    EXECUTE format(
      'ALTER TABLE public.service_applications RENAME CONSTRAINT %I TO %I',
      existing_constraint,
      'service_applications_assignee_id_users_id_fk'
    );
  END IF;
END
$$;