ALTER TABLE service_applications
  ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS review_activities (
  id UUID PRIMARY KEY NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_type VARCHAR(32) NOT NULL CHECK (item_type IN ('report', 'service_application')),
  item_id UUID NOT NULL,
  activity_type VARCHAR(32) NOT NULL CHECK (activity_type IN ('internal_note', 'public_update', 'assignment')),
  status VARCHAR(32),
  message TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS review_activities_item_created_idx
  ON review_activities(tenant_id, item_type, item_id, created_at);
CREATE INDEX IF NOT EXISTS review_activities_type_idx
  ON review_activities(tenant_id, item_type, item_id, activity_type);

CREATE FUNCTION prevent_review_activity_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'review_activities is append-only';
END;
$$;

CREATE TRIGGER review_activities_append_only
  BEFORE UPDATE OR DELETE ON review_activities
  FOR EACH ROW EXECUTE FUNCTION prevent_review_activity_mutation();
