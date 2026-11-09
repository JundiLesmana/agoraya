-- Migration: 0019_decision_engine_runs
-- Description: Decision Engine run history with snapshots of criteria and scored items.
-- RLS: tenant isolation on decision_runs (requested_by), tenant + assigned project access on decision_run_items.
-- Rollback: see 0019_decision_engine_runs.down.sql

CREATE TABLE "decision_run_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"score" numeric(7, 4) NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"score_breakdown" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "decision_run_items_rank_check" CHECK ("decision_run_items"."rank" > 0),
	CONSTRAINT "decision_run_items_score_check" CHECK ("decision_run_items"."score" >= 0 AND "decision_run_items"."score" <= 100)
);
--> statement-breakpoint
CREATE TABLE "decision_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"requested_by" uuid NOT NULL,
	"fiscal_year" integer NOT NULL,
	"criteria_version" varchar(50) NOT NULL,
	"algorithm_version" varchar(50) NOT NULL,
	"criteria_snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "decision_runs_id_tenant_idx" ON "decision_runs" USING btree ("id","tenant_id");--> statement-breakpoint
CREATE INDEX "decision_runs_tenant_created_at_idx" ON "decision_runs" USING btree ("tenant_id","created_at");--> statement-breakpoint
ALTER TABLE "decision_run_items" ADD CONSTRAINT "decision_run_items_run_tenant_fk" FOREIGN KEY ("run_id","tenant_id") REFERENCES "public"."decision_runs"("id","tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_run_items" ADD CONSTRAINT "decision_run_items_project_tenant_fk" FOREIGN KEY ("project_id","tenant_id") REFERENCES "public"."infrastructure_projects"("id","tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_runs" ADD CONSTRAINT "decision_runs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_runs" ADD CONSTRAINT "decision_runs_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "decision_run_items_run_project_idx" ON "decision_run_items" USING btree ("run_id","project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "decision_run_items_run_rank_idx" ON "decision_run_items" USING btree ("run_id","rank");--> statement-breakpoint
CREATE INDEX "decision_run_items_tenant_run_rank_idx" ON "decision_run_items" USING btree ("tenant_id","run_id","rank");

--> statement-breakpoint
ALTER TABLE decision_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_runs FORCE ROW LEVEL SECURITY;
CREATE POLICY decision_runs_tenant_isolation
  ON decision_runs
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND requested_by = NULLIF(current_setting('app.user_id', true), '')::uuid
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND requested_by = NULLIF(current_setting('app.user_id', true), '')::uuid
  );

ALTER TABLE decision_run_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_run_items FORCE ROW LEVEL SECURITY;
CREATE POLICY decision_run_items_tenant_project_access
  ON decision_run_items
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1
      FROM infrastructure_projects
      WHERE infrastructure_projects.id = decision_run_items.project_id
        AND infrastructure_projects.tenant_id = decision_run_items.tenant_id
        AND infrastructure_projects.assigned_user_id =
          NULLIF(current_setting('app.user_id', true), '')::uuid
    )
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1
      FROM infrastructure_projects
      WHERE infrastructure_projects.id = decision_run_items.project_id
        AND infrastructure_projects.tenant_id = decision_run_items.tenant_id
        AND infrastructure_projects.assigned_user_id =
          NULLIF(current_setting('app.user_id', true), '')::uuid
    )
  );
