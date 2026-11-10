-- Reconciled local/dev drift: service_applications may already exist with partial columns/indexes.
CREATE TABLE IF NOT EXISTS "service_applications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"applicant_user_id" uuid,
	"tracking_number" varchar(40) NOT NULL,
	"category" varchar(32) NOT NULL,
	"service_type" varchar(80) NOT NULL,
	"service_id" varchar(80) NOT NULL,
	"route_key" varchar(160) NOT NULL,
	"service_name" varchar(255) NOT NULL,
	"agency" varchar(255) NOT NULL,
	"status" varchar(32) DEFAULT 'submitted' NOT NULL,
	"applicant_name" varchar(255) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"payload" jsonb NOT NULL,
	"submitted_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "service_applications" ADD COLUMN IF NOT EXISTS "applicant_user_id" uuid;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "service_applications" ADD CONSTRAINT "service_applications_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "service_applications" ADD CONSTRAINT "service_applications_applicant_user_id_users_id_fk" FOREIGN KEY ("applicant_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "service_applications_tracking_number_idx" ON "service_applications" USING btree ("tracking_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_applications_tenant_id_idx" ON "service_applications" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_applications_applicant_user_id_idx" ON "service_applications" USING btree ("applicant_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_applications_category_idx" ON "service_applications" USING btree ("tenant_id","category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_applications_service_idx" ON "service_applications" USING btree ("tenant_id","category","service_type","service_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_applications_submitted_at_idx" ON "service_applications" USING btree ("submitted_at");