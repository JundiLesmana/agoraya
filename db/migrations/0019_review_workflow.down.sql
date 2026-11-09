DROP TABLE IF EXISTS review_activities;
DROP FUNCTION IF EXISTS prevent_review_activity_mutation();

ALTER TABLE service_applications
  DROP COLUMN IF EXISTS assignee_id;
