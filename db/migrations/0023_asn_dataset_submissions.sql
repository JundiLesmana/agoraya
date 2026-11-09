CREATE TABLE "asn_dataset_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"dataset_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"assignment_type" varchar(16) NOT NULL,
	"agency_id" varchar(120),
	"region_id" varchar(120),
	"region_name" varchar(160),
	"sector_id" varchar(100),
	"reference_year" integer NOT NULL,
	"project_id" uuid,
	"title" varchar(255) NOT NULL,
	"summary" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(32) NOT NULL,
	"source_organization" varchar(255) NOT NULL,
	"source_url" text,
	"source_label" "bps_source" NOT NULL,
	"source_kind" varchar(16) NOT NULL,
	"license_name" varchar(160) NOT NULL,
	"license_url" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"data_dictionary" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"period_start" date,
	"period_end" date,
	"frequency" varchar(16) NOT NULL,
	"csv_data" text NOT NULL,
	"record_count" integer NOT NULL,
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asn_dataset_submissions_assignment_check" CHECK (
        ("asn_dataset_submissions"."assignment_type" IN ('statistics', 'apbd')
          AND "asn_dataset_submissions"."agency_id" IS NOT NULL
          AND "asn_dataset_submissions"."region_id" IS NOT NULL
          AND "asn_dataset_submissions"."region_name" IS NOT NULL
          AND "asn_dataset_submissions"."sector_id" IS NOT NULL
          AND "asn_dataset_submissions"."reference_year" BETWEEN 2000 AND 2100
          AND "asn_dataset_submissions"."project_id" IS NULL)
        OR
        ("asn_dataset_submissions"."assignment_type" = 'project'
          AND "asn_dataset_submissions"."project_id" IS NOT NULL
          AND "asn_dataset_submissions"."reference_year" BETWEEN 2000 AND 2100)
      ),
	CONSTRAINT "asn_dataset_submissions_category_check" CHECK ("asn_dataset_submissions"."category" IN ('Anggaran', 'Proyek', 'Statistik')),
	CONSTRAINT "asn_dataset_submissions_category_assignment_check" CHECK (
        ("asn_dataset_submissions"."category" = 'Anggaran' AND "asn_dataset_submissions"."assignment_type" = 'apbd')
        OR ("asn_dataset_submissions"."category" = 'Statistik' AND "asn_dataset_submissions"."assignment_type" = 'statistics')
        OR ("asn_dataset_submissions"."category" = 'Proyek' AND "asn_dataset_submissions"."assignment_type" = 'project')
      ),
	CONSTRAINT "asn_dataset_submissions_source_kind_check" CHECK ("asn_dataset_submissions"."source_kind" IN ('manual', 'bps')),
	CONSTRAINT "asn_dataset_submissions_frequency_check" CHECK ("asn_dataset_submissions"."frequency" IN ('monthly', 'quarterly', 'annual', 'irregular')),
	CONSTRAINT "asn_dataset_submissions_status_check" CHECK ("asn_dataset_submissions"."status" IN ('draft', 'submitted')),
	CONSTRAINT "asn_dataset_submissions_record_count_check" CHECK ("asn_dataset_submissions"."record_count" BETWEEN 1 AND 10000),
	CONSTRAINT "asn_dataset_submissions_period_check" CHECK ("asn_dataset_submissions"."period_start" IS NULL OR "asn_dataset_submissions"."period_end" IS NULL OR "asn_dataset_submissions"."period_end" >= "asn_dataset_submissions"."period_start"),
	CONSTRAINT "asn_dataset_submissions_submitted_at_check" CHECK ("asn_dataset_submissions"."status" <> 'submitted' OR "asn_dataset_submissions"."submitted_at" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "project_progress_reports" ADD COLUMN "source_dataset_submission_id" uuid;--> statement-breakpoint
ALTER TABLE "apbd_entries" ADD COLUMN "source_dataset_submission_id" uuid;--> statement-breakpoint
ALTER TABLE "asn_dataset_submissions" ADD CONSTRAINT "asn_dataset_submissions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asn_dataset_submissions" ADD CONSTRAINT "asn_dataset_submissions_dataset_id_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asn_dataset_submissions" ADD CONSTRAINT "asn_dataset_submissions_created_by_tenant_fk" FOREIGN KEY ("created_by","tenant_id") REFERENCES "public"."users"("id","tenant_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asn_dataset_submissions" ADD CONSTRAINT "asn_dataset_submissions_updated_by_tenant_fk" FOREIGN KEY ("updated_by","tenant_id") REFERENCES "public"."users"("id","tenant_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asn_dataset_submissions" ADD CONSTRAINT "asn_dataset_submissions_project_tenant_fk" FOREIGN KEY ("project_id","tenant_id") REFERENCES "public"."infrastructure_projects"("id","tenant_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "asn_dataset_submissions_id_tenant_idx" ON "asn_dataset_submissions" USING btree ("id","tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "asn_dataset_submissions_apbd_scope_idx" ON "asn_dataset_submissions" USING btree ("id","tenant_id","agency_id","region_id","sector_id","reference_year");--> statement-breakpoint
CREATE UNIQUE INDEX "asn_dataset_submissions_project_scope_idx" ON "asn_dataset_submissions" USING btree ("id","tenant_id","project_id");--> statement-breakpoint
CREATE INDEX "asn_dataset_submissions_owner_idx" ON "asn_dataset_submissions" USING btree ("tenant_id","created_by","status");--> statement-breakpoint
CREATE INDEX "asn_dataset_submissions_assignment_idx" ON "asn_dataset_submissions" USING btree ("tenant_id","assignment_type","agency_id","region_id","sector_id","reference_year","status");--> statement-breakpoint
CREATE INDEX "asn_dataset_submissions_project_idx" ON "asn_dataset_submissions" USING btree ("tenant_id","project_id","status");--> statement-breakpoint
ALTER TABLE "apbd_entries" ADD CONSTRAINT "apbd_entries_source_dataset_scope_fk" FOREIGN KEY ("source_dataset_submission_id","tenant_id","agency_id","region_id","sector_id","reference_year") REFERENCES "public"."asn_dataset_submissions"("id","tenant_id","agency_id","region_id","sector_id","reference_year") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "project_progress_reports" ADD CONSTRAINT "project_progress_reports_source_dataset_scope_fk" FOREIGN KEY ("source_dataset_submission_id","tenant_id","project_id") REFERENCES "public"."asn_dataset_submissions"("id","tenant_id","project_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "asn_dataset_submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "asn_dataset_submissions" FORCE ROW LEVEL SECURITY;
CREATE POLICY asn_dataset_submissions_assigned_read
  ON "asn_dataset_submissions"
  FOR SELECT USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND (
      (
        assignment_type = 'statistics'
        AND EXISTS (
          SELECT 1 FROM statistic_operator_assignments assignment
          WHERE assignment.tenant_id = asn_dataset_submissions.tenant_id
            AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
            AND assignment.agency_id = asn_dataset_submissions.agency_id
            AND assignment.region_id = asn_dataset_submissions.region_id
            AND assignment.sector_id = asn_dataset_submissions.sector_id
        )
      )
      OR (
        assignment_type = 'apbd'
        AND EXISTS (
          SELECT 1 FROM apbd_operator_assignments assignment
          WHERE assignment.tenant_id = asn_dataset_submissions.tenant_id
            AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
            AND assignment.agency_id = asn_dataset_submissions.agency_id
            AND assignment.region_id = asn_dataset_submissions.region_id
            AND assignment.sector_id = asn_dataset_submissions.sector_id
        )
      )
      OR (
        assignment_type = 'project'
        AND EXISTS (
          SELECT 1 FROM infrastructure_projects project
          WHERE project.id = asn_dataset_submissions.project_id
            AND project.tenant_id = asn_dataset_submissions.tenant_id
            AND project.assigned_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        )
      )
    )
  );
CREATE POLICY asn_dataset_submissions_assigned_insert
  ON "asn_dataset_submissions"
  FOR INSERT WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND created_by = NULLIF(current_setting('app.user_id', true), '')::uuid
    AND updated_by = NULLIF(current_setting('app.user_id', true), '')::uuid
    AND (
      (
        assignment_type = 'statistics'
        AND EXISTS (
          SELECT 1 FROM statistic_operator_assignments assignment
          WHERE assignment.tenant_id = asn_dataset_submissions.tenant_id
            AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
            AND assignment.agency_id = asn_dataset_submissions.agency_id
            AND assignment.region_id = asn_dataset_submissions.region_id
            AND assignment.sector_id = asn_dataset_submissions.sector_id
        )
      )
      OR (
        assignment_type = 'apbd'
        AND EXISTS (
          SELECT 1 FROM apbd_operator_assignments assignment
          WHERE assignment.tenant_id = asn_dataset_submissions.tenant_id
            AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
            AND assignment.agency_id = asn_dataset_submissions.agency_id
            AND assignment.region_id = asn_dataset_submissions.region_id
            AND assignment.sector_id = asn_dataset_submissions.sector_id
        )
      )
      OR (
        assignment_type = 'project'
        AND EXISTS (
          SELECT 1 FROM infrastructure_projects project
          WHERE project.id = asn_dataset_submissions.project_id
            AND project.tenant_id = asn_dataset_submissions.tenant_id
            AND project.assigned_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        )
      )
    )
  );
CREATE POLICY asn_dataset_submissions_draft_update
  ON "asn_dataset_submissions"
  FOR UPDATE
  USING (
    status = 'draft'
    AND created_by = NULLIF(current_setting('app.user_id', true), '')::uuid
    AND tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND (
      (
        assignment_type = 'statistics'
        AND EXISTS (
          SELECT 1 FROM statistic_operator_assignments assignment
          WHERE assignment.tenant_id = asn_dataset_submissions.tenant_id
            AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
            AND assignment.agency_id = asn_dataset_submissions.agency_id
            AND assignment.region_id = asn_dataset_submissions.region_id
            AND assignment.sector_id = asn_dataset_submissions.sector_id
        )
      )
      OR (
        assignment_type = 'apbd'
        AND EXISTS (
          SELECT 1 FROM apbd_operator_assignments assignment
          WHERE assignment.tenant_id = asn_dataset_submissions.tenant_id
            AND assignment.user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
            AND assignment.agency_id = asn_dataset_submissions.agency_id
            AND assignment.region_id = asn_dataset_submissions.region_id
            AND assignment.sector_id = asn_dataset_submissions.sector_id
        )
      )
      OR (
        assignment_type = 'project'
        AND EXISTS (
          SELECT 1 FROM infrastructure_projects project
          WHERE project.id = asn_dataset_submissions.project_id
            AND project.tenant_id = asn_dataset_submissions.tenant_id
            AND project.assigned_user_id = NULLIF(current_setting('app.user_id', true), '')::uuid
        )
      )
    )
  )
  WITH CHECK (
    status IN ('draft', 'submitted')
    AND created_by = NULLIF(current_setting('app.user_id', true), '')::uuid
    AND updated_by = NULLIF(current_setting('app.user_id', true), '')::uuid
    AND tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
  );
--> statement-breakpoint
CREATE FUNCTION reject_submitted_asn_dataset_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'submitted' THEN
    RAISE EXCEPTION 'submitted ASN datasets are immutable';
  END IF;
  IF NEW.status = 'submitted' AND NEW.submitted_at IS NULL THEN
    RAISE EXCEPTION 'submitted ASN datasets require a submission timestamp';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER asn_dataset_submissions_submitted_immutable
  BEFORE UPDATE OR DELETE ON "asn_dataset_submissions"
  FOR EACH ROW EXECUTE FUNCTION reject_submitted_asn_dataset_mutation();
--> statement-breakpoint
CREATE FUNCTION validate_apbd_dataset_source()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.source_dataset_submission_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM asn_dataset_submissions source
    WHERE source.id = NEW.source_dataset_submission_id
      AND source.tenant_id = NEW.tenant_id
      AND source.agency_id = NEW.agency_id
      AND source.region_id = NEW.region_id
      AND source.sector_id = NEW.sector_id
      AND source.reference_year = NEW.reference_year
      AND source.status = 'submitted'
      AND source.category IN ('Anggaran', 'Statistik')
  ) THEN
    RAISE EXCEPTION 'APBD source dataset must be submitted and match the assigned context';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER apbd_entries_dataset_source_guard
  BEFORE INSERT OR UPDATE OF source_dataset_submission_id, tenant_id, agency_id, region_id, sector_id, reference_year
  ON apbd_entries
  FOR EACH ROW EXECUTE FUNCTION validate_apbd_dataset_source();
--> statement-breakpoint
CREATE FUNCTION validate_project_dataset_source()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  source_assignment_type VARCHAR(16);
  source_project_id UUID;
  source_sector_id VARCHAR(100);
  source_year INTEGER;
  source_status VARCHAR(16);
  project_sector VARCHAR(100);
  project_year INTEGER;
BEGIN
  IF NEW.source_dataset_submission_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT source.assignment_type, source.project_id, source.sector_id,
         source.reference_year, source.status
    INTO source_assignment_type, source_project_id, source_sector_id,
         source_year, source_status
  FROM asn_dataset_submissions source
  WHERE source.id = NEW.source_dataset_submission_id
    AND source.tenant_id = NEW.tenant_id
    AND source.category IN ('Proyek', 'Statistik');

  SELECT project.sector, project.fiscal_year
    INTO project_sector, project_year
  FROM infrastructure_projects project
  WHERE project.id = NEW.project_id AND project.tenant_id = NEW.tenant_id;

  IF source_status IS DISTINCT FROM 'submitted'
    OR source_sector_id IS DISTINCT FROM project_sector
    OR source_year IS DISTINCT FROM project_year
    OR (
      source_assignment_type = 'project'
      AND source_project_id IS DISTINCT FROM NEW.project_id
    )
    OR (
      source_assignment_type NOT IN ('project', 'statistics')
    ) THEN
    RAISE EXCEPTION 'Project source dataset must be submitted and match project scope';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER project_progress_dataset_source_guard
  BEFORE INSERT OR UPDATE OF source_dataset_submission_id, tenant_id, project_id
  ON project_progress_reports
  FOR EACH ROW EXECUTE FUNCTION validate_project_dataset_source();