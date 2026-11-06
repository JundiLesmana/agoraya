CREATE TABLE IF NOT EXISTS ticket_submission_details (
  ticket_id UUID PRIMARY KEY REFERENCES tickets(id) ON DELETE CASCADE,
  report_number VARCHAR(40) NOT NULL,
  subcategory VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  reporter_name VARCHAR(255),
  reporter_email VARCHAR(255) NOT NULL,
  reporter_phone VARCHAR(32) NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  show_identity BOOLEAN NOT NULL DEFAULT FALSE,
  attachment_names JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ticket_submission_details_report_number_idx
  ON ticket_submission_details(report_number);
