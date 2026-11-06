CREATE TYPE "public"."bps_source" AS ENUM('BPS_API', 'SIMULATED', 'CITIZEN_UNVERIFIED');--> statement-breakpoint
CREATE TYPE "public"."cms_content_status" AS ENUM('draft', 'in_review', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."cms_risk_decision" AS ENUM('approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."cms_risk_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."job_position_type" AS ENUM('structural', 'functional');--> statement-breakpoint
CREATE TYPE "public"."kyc_approval_decision" AS ENUM('approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('pending', 'partially_approved', 'verified', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."project_progress_status" AS ENUM('draft', 'submitted');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('draft', 'submitted', 'verified', 'in_progress', 'resolved', 'rejected', 'closed');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TABLE "identity_login_attempts" (
	"identifier_hash" varchar(64) PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"identifier_hash" varchar(255) NOT NULL,
	"code_hash" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"identifier_hash" varchar(255) NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"email_verified_at" timestamp with time zone,
	"name" varchar(255) NOT NULL,
	"nik" varchar(32),
	"password_hash" varchar(255),
	"user_status" "user_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "asn_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"nip" varchar(32),
	"opd_name" varchar(255),
	"unit_name" varchar(255),
	"position_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_positions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"position_type" "job_position_type",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "executive_access" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"status" varchar(20) NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_access" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"module_key" varchar(32) NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"granted_by" uuid,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permissions_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "rbac_policies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"effect" varchar(20) DEFAULT 'allow' NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"tenant_id" uuid,
	"roles" jsonb NOT NULL,
	"permissions" jsonb NOT NULL,
	"resources" jsonb NOT NULL,
	"actions" jsonb NOT NULL,
	"conditions" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rbac_policies_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "rbac_policy_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"policy_id" uuid NOT NULL,
	"policy_key" varchar(100) NOT NULL,
	"version" integer NOT NULL,
	"definition" jsonb NOT NULL,
	"changed_by" uuid,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"granted_by" uuid,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"key" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_application_roles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"application_role_id" uuid NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"granted_by" uuid,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"granted_by" uuid,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "ticket_audit_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"ticket_id" uuid NOT NULL,
	"actor_id" uuid,
	"action" varchar(100) NOT NULL,
	"previous_state" varchar(50),
	"new_state" varchar(50),
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_evidence" (
	"id" uuid PRIMARY KEY NOT NULL,
	"ticket_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"storage_key" varchar(512) NOT NULL,
	"media_type" varchar(100) NOT NULL,
	"purpose" varchar(50) DEFAULT 'qc' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_submission_details" (
	"ticket_id" uuid PRIMARY KEY NOT NULL,
	"report_number" varchar(40) NOT NULL,
	"subcategory" varchar(100) NOT NULL,
	"province" varchar(100) NOT NULL,
	"city" varchar(100) NOT NULL,
	"address" text NOT NULL,
	"reporter_name" varchar(255),
	"reporter_email" varchar(255) NOT NULL,
	"reporter_phone" varchar(32) NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"show_identity" boolean DEFAULT false NOT NULL,
	"attachment_names" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_votes" (
	"ticket_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"voter_id" uuid NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ticket_votes_ticket_id_voter_id_pk" PRIMARY KEY("ticket_id","voter_id")
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"citizen_id" uuid,
	"category" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"ticket_status" "ticket_status" DEFAULT 'draft' NOT NULL,
	"urgency" varchar(50) DEFAULT 'medium' NOT NULL,
	"location" jsonb,
	"assignee_id" uuid,
	"duplicate_of_id" uuid,
	"submitted_at" timestamp with time zone,
	"response_due_at" timestamp with time zone,
	"first_responded_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"sla_escalated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kyc_approvals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"roster_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"approver_id" uuid,
	"approval_slot" integer NOT NULL,
	"kyc_approval_decision" "kyc_approval_decision" NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kyc_roster" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"nik_hash" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"kyc_status" "kyc_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone,
	"submitted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_audit_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"content_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"previous_status" "cms_content_status",
	"next_status" "cms_content_status",
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_content_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"content_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" jsonb NOT NULL,
	"status" "cms_content_status" NOT NULL,
	"changed_by" uuid NOT NULL,
	"change_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_contents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" jsonb NOT NULL,
	"status" "cms_content_status" DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_risk_reviews" (
	"id" uuid PRIMARY KEY NOT NULL,
	"content_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"level" "cms_risk_level" NOT NULL,
	"decision" "cms_risk_decision" NOT NULL,
	"rationale" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"action" varchar(100) NOT NULL,
	"target_table" varchar(100) NOT NULL,
	"target_id" uuid,
	"metadata" jsonb,
	"chain_sequence" integer,
	"previous_hash" varchar(64),
	"hash" varchar(64),
	"signature" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bps_snapshots" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dataset" varchar(100) NOT NULL,
	"region" varchar(100) NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"source_label" "bps_source" DEFAULT 'SIMULATED' NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "citizen_attachments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"citizen_profile_id" uuid NOT NULL,
	"cloudinary_public_id" varchar(255) NOT NULL,
	"cloudinary_secure_url" varchar(500) NOT NULL,
	"resource_type" varchar(50) DEFAULT 'image' NOT NULL,
	"attachment_type" varchar(32) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(100),
	"size" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "citizen_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"nik" varchar(32) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(32),
	"address" varchar(500),
	"ktp_attachment_public_id" varchar(255),
	"ktp_attachment_url" varchar(500),
	"selfie_attachment_public_id" varchar(255),
	"selfie_attachment_url" varchar(500),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "citizen_profiles_nik_unique" UNIQUE("nik")
);
--> statement-breakpoint
CREATE TABLE "dataset_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dataset_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"format" varchar(16) NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dataset_resources_format_check" CHECK ("dataset_resources"."format" IN ('CSV', 'JSON', 'PDF', 'API'))
);
--> statement-breakpoint
CREATE TABLE "datasets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" varchar(255) NOT NULL,
	"summary" varchar(500) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(100) NOT NULL,
	"source_organization" varchar(255) NOT NULL,
	"source_url" text,
	"source_label" "bps_source" DEFAULT 'SIMULATED' NOT NULL,
	"license_name" varchar(160) NOT NULL,
	"license_url" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"data_dictionary" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_updated_at" timestamp with time zone NOT NULL,
	"downloads_count" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"search_vector" "tsvector" DEFAULT ''::tsvector NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "infrastructure_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"assigned_user_id" uuid NOT NULL,
	"external_project_id" varchar(160) NOT NULL,
	"package_name" varchar(255) NOT NULL,
	"location" varchar(255) NOT NULL,
	"sector" varchar(100) NOT NULL,
	"contract_value" numeric(18, 2) NOT NULL,
	"provider_name" varchar(255) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"fiscal_year" integer NOT NULL,
	"initial_physical_progress" numeric(5, 2) DEFAULT 0 NOT NULL,
	"initial_financial_progress" numeric(5, 2) DEFAULT 0 NOT NULL,
	"status" varchar(30) DEFAULT 'ongoing' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "infrastructure_projects_contract_value_check" CHECK ("infrastructure_projects"."contract_value" >= 0),
	CONSTRAINT "infrastructure_projects_initial_physical_check" CHECK ("infrastructure_projects"."initial_physical_progress" BETWEEN 0 AND 100),
	CONSTRAINT "infrastructure_projects_initial_financial_check" CHECK ("infrastructure_projects"."initial_financial_progress" BETWEEN 0 AND 100),
	CONSTRAINT "infrastructure_projects_date_range_check" CHECK ("infrastructure_projects"."end_date" >= "infrastructure_projects"."start_date")
);
--> statement-breakpoint
CREATE TABLE "project_progress_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"report_id" uuid NOT NULL,
	"cloudinary_public_id" varchar(512) NOT NULL,
	"cloudinary_asset_id" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"media_type" varchar(32) NOT NULL,
	"file_size" integer NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_progress_attachments_media_type_check" CHECK ("project_progress_attachments"."media_type" IN ('image/jpeg', 'image/png')),
	CONSTRAINT "project_progress_attachments_file_size_check" CHECK ("project_progress_attachments"."file_size" BETWEEN 1 AND 5242880)
);
--> statement-breakpoint
CREATE TABLE "project_progress_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"reported_by" uuid NOT NULL,
	"period_month" integer NOT NULL,
	"period_year" integer NOT NULL,
	"physical_progress" numeric(5, 2) NOT NULL,
	"financial_progress" numeric(5, 2) NOT NULL,
	"evaluation_notes" text DEFAULT '' NOT NULL,
	"status" "project_progress_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_progress_reports_period_check" CHECK ("project_progress_reports"."period_month" BETWEEN 1 AND 12 AND "project_progress_reports"."period_year" BETWEEN 2020 AND 2100),
	CONSTRAINT "project_progress_reports_physical_check" CHECK ("project_progress_reports"."physical_progress" BETWEEN 0 AND 100),
	CONSTRAINT "project_progress_reports_financial_check" CHECK ("project_progress_reports"."financial_progress" BETWEEN 0 AND 100)
);
--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asn_profiles" ADD CONSTRAINT "asn_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asn_profiles" ADD CONSTRAINT "asn_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asn_profiles" ADD CONSTRAINT "asn_profiles_position_id_job_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."job_positions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executive_access" ADD CONSTRAINT "executive_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executive_access" ADD CONSTRAINT "executive_access_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executive_access" ADD CONSTRAINT "executive_access_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_access" ADD CONSTRAINT "module_access_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_access" ADD CONSTRAINT "module_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_access" ADD CONSTRAINT "module_access_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac_policies" ADD CONSTRAINT "rbac_policies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac_policy_versions" ADD CONSTRAINT "rbac_policy_versions_policy_id_rbac_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."rbac_policies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rbac_policy_versions" ADD CONSTRAINT "rbac_policy_versions_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_application_roles" ADD CONSTRAINT "user_application_roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_application_roles" ADD CONSTRAINT "user_application_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_application_roles" ADD CONSTRAINT "user_application_roles_application_role_id_application_roles_id_fk" FOREIGN KEY ("application_role_id") REFERENCES "public"."application_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_application_roles" ADD CONSTRAINT "user_application_roles_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_audit_logs" ADD CONSTRAINT "ticket_audit_logs_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_audit_logs" ADD CONSTRAINT "ticket_audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_evidence" ADD CONSTRAINT "ticket_evidence_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_evidence" ADD CONSTRAINT "ticket_evidence_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_evidence" ADD CONSTRAINT "ticket_evidence_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_submission_details" ADD CONSTRAINT "ticket_submission_details_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_votes" ADD CONSTRAINT "ticket_votes_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_votes" ADD CONSTRAINT "ticket_votes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_votes" ADD CONSTRAINT "ticket_votes_voter_id_users_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_citizen_id_users_id_fk" FOREIGN KEY ("citizen_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_duplicate_of_id_tickets_id_fk" FOREIGN KEY ("duplicate_of_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_approvals" ADD CONSTRAINT "kyc_approvals_roster_id_kyc_roster_id_fk" FOREIGN KEY ("roster_id") REFERENCES "public"."kyc_roster"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_approvals" ADD CONSTRAINT "kyc_approvals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_approvals" ADD CONSTRAINT "kyc_approvals_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_roster" ADD CONSTRAINT "kyc_roster_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_roster" ADD CONSTRAINT "kyc_roster_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_roster" ADD CONSTRAINT "kyc_roster_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_audit_logs" ADD CONSTRAINT "cms_audit_logs_content_id_cms_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."cms_contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_audit_logs" ADD CONSTRAINT "cms_audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_audit_logs" ADD CONSTRAINT "cms_audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_content_versions" ADD CONSTRAINT "cms_content_versions_content_id_cms_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."cms_contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_content_versions" ADD CONSTRAINT "cms_content_versions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_content_versions" ADD CONSTRAINT "cms_content_versions_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_contents" ADD CONSTRAINT "cms_contents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_contents" ADD CONSTRAINT "cms_contents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_risk_reviews" ADD CONSTRAINT "cms_risk_reviews_content_id_cms_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."cms_contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_risk_reviews" ADD CONSTRAINT "cms_risk_reviews_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cms_risk_reviews" ADD CONSTRAINT "cms_risk_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citizen_attachments" ADD CONSTRAINT "citizen_attachments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citizen_attachments" ADD CONSTRAINT "citizen_attachments_citizen_profile_id_citizen_profiles_id_fk" FOREIGN KEY ("citizen_profile_id") REFERENCES "public"."citizen_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citizen_profiles" ADD CONSTRAINT "citizen_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citizen_profiles" ADD CONSTRAINT "citizen_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_resources" ADD CONSTRAINT "dataset_resources_dataset_id_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "infrastructure_projects" ADD CONSTRAINT "infrastructure_projects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "infrastructure_projects" ADD CONSTRAINT "infrastructure_projects_assigned_user_tenant_fk" FOREIGN KEY ("assigned_user_id","tenant_id") REFERENCES "public"."users"("id","tenant_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_progress_attachments" ADD CONSTRAINT "project_progress_attachments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_progress_attachments" ADD CONSTRAINT "project_progress_attachments_uploaded_by_tenant_fk" FOREIGN KEY ("uploaded_by","tenant_id") REFERENCES "public"."users"("id","tenant_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_progress_attachments" ADD CONSTRAINT "project_progress_attachments_report_tenant_fk" FOREIGN KEY ("report_id","tenant_id") REFERENCES "public"."project_progress_reports"("id","tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_progress_reports" ADD CONSTRAINT "project_progress_reports_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_progress_reports" ADD CONSTRAINT "project_progress_reports_reported_by_tenant_fk" FOREIGN KEY ("reported_by","tenant_id") REFERENCES "public"."users"("id","tenant_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_progress_reports" ADD CONSTRAINT "project_progress_reports_project_tenant_fk" FOREIGN KEY ("project_id","tenant_id") REFERENCES "public"."infrastructure_projects"("id","tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "identity_login_attempts_window_idx" ON "identity_login_attempts" USING btree ("window_started_at");--> statement-breakpoint
CREATE INDEX "otp_codes_identifier_hash_idx" ON "otp_codes" USING btree ("identifier_hash");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_identifier_hash_idx" ON "password_reset_tokens" USING btree ("identifier_hash");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_tenant_id_idx" ON "users" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "asn_profiles_tenant_id_idx" ON "asn_profiles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "asn_profiles_opd_name_idx" ON "asn_profiles" USING btree ("opd_name");--> statement-breakpoint
CREATE INDEX "asn_profiles_position_id_idx" ON "asn_profiles" USING btree ("position_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_positions_name_idx" ON "job_positions" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "application_roles_key_idx" ON "application_roles" USING btree ("key");--> statement-breakpoint
CREATE INDEX "executive_access_tenant_id_idx" ON "executive_access" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "module_access_user_module_idx" ON "module_access" USING btree ("user_id","module_key");--> statement-breakpoint
CREATE INDEX "module_access_tenant_id_idx" ON "module_access" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "module_access_active_unique_idx" ON "module_access" USING btree ("user_id","module_key") WHERE revoked_at IS NULL;--> statement-breakpoint
CREATE INDEX "rbac_policies_status_idx" ON "rbac_policies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rbac_policies_tenant_id_idx" ON "rbac_policies" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rbac_policy_versions_policy_id_version_idx" ON "rbac_policy_versions" USING btree ("policy_id","version");--> statement-breakpoint
CREATE INDEX "rbac_policy_versions_policy_key_idx" ON "rbac_policy_versions" USING btree ("policy_key");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_tenant_id_key_idx" ON "roles" USING btree ("tenant_id","key");--> statement-breakpoint
CREATE INDEX "user_application_roles_user_id_idx" ON "user_application_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_application_roles_role_id_idx" ON "user_application_roles" USING btree ("application_role_id");--> statement-breakpoint
CREATE INDEX "user_application_roles_tenant_id_idx" ON "user_application_roles" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_application_roles_active_unique_idx" ON "user_application_roles" USING btree ("user_id","application_role_id") WHERE revoked_at IS NULL;--> statement-breakpoint
CREATE INDEX "user_roles_role_id_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "ticket_audit_logs_ticket_id_idx" ON "ticket_audit_logs" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_evidence_ticket_id_idx" ON "ticket_evidence" USING btree ("ticket_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_submission_details_report_number_idx" ON "ticket_submission_details" USING btree ("report_number");--> statement-breakpoint
CREATE INDEX "ticket_votes_ticket_id_idx" ON "ticket_votes" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "tickets_tenant_id_idx" ON "tickets" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tickets_status_idx" ON "tickets" USING btree ("ticket_status");--> statement-breakpoint
CREATE INDEX "tickets_citizen_id_idx" ON "tickets" USING btree ("citizen_id");--> statement-breakpoint
CREATE INDEX "tickets_response_due_at_idx" ON "tickets" USING btree ("response_due_at");--> statement-breakpoint
CREATE INDEX "tickets_duplicate_of_id_idx" ON "tickets" USING btree ("duplicate_of_id");--> statement-breakpoint
CREATE INDEX "kyc_approvals_roster_id_idx" ON "kyc_approvals" USING btree ("roster_id");--> statement-breakpoint
CREATE INDEX "kyc_approvals_tenant_id_idx" ON "kyc_approvals" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "kyc_approvals_roster_slot_idx" ON "kyc_approvals" USING btree ("roster_id","approval_slot");--> statement-breakpoint
CREATE INDEX "kyc_roster_tenant_id_idx" ON "kyc_roster" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "kyc_roster_status_idx" ON "kyc_roster" USING btree ("kyc_status");--> statement-breakpoint
CREATE UNIQUE INDEX "kyc_roster_tenant_user_idx" ON "kyc_roster" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "kyc_roster_nik_hash_tenant_idx" ON "kyc_roster" USING btree ("nik_hash","tenant_id");--> statement-breakpoint
CREATE INDEX "cms_audit_logs_content_created_idx" ON "cms_audit_logs" USING btree ("content_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cms_content_versions_content_version_idx" ON "cms_content_versions" USING btree ("content_id","version");--> statement-breakpoint
CREATE INDEX "cms_content_versions_tenant_content_idx" ON "cms_content_versions" USING btree ("tenant_id","content_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cms_contents_tenant_slug_idx" ON "cms_contents" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "cms_contents_tenant_status_idx" ON "cms_contents" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "cms_risk_reviews_content_id_idx" ON "cms_risk_reviews" USING btree ("content_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cms_risk_reviews_content_reviewer_idx" ON "cms_risk_reviews" USING btree ("content_id","reviewer_id");--> statement-breakpoint
CREATE INDEX "audit_events_actor_id_idx" ON "audit_events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_events_created_at_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "audit_events_chain_sequence_idx" ON "audit_events" USING btree ("chain_sequence") WHERE chain_sequence IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "bps_snapshots_dataset_region_year_month_idx" ON "bps_snapshots" USING btree ("dataset","region","year","month");--> statement-breakpoint
CREATE INDEX "citizen_attachments_tenant_id_idx" ON "citizen_attachments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "citizen_attachments_citizen_profile_id_idx" ON "citizen_attachments" USING btree ("citizen_profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "citizen_attachments_profile_type_idx" ON "citizen_attachments" USING btree ("citizen_profile_id","attachment_type");--> statement-breakpoint
CREATE UNIQUE INDEX "citizen_attachments_public_id_idx" ON "citizen_attachments" USING btree ("cloudinary_public_id");--> statement-breakpoint
CREATE INDEX "citizen_profiles_tenant_id_idx" ON "citizen_profiles" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "citizen_profiles_tenant_user_idx" ON "citizen_profiles" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "citizen_profiles_nik_idx" ON "citizen_profiles" USING btree ("nik");--> statement-breakpoint
CREATE INDEX "dataset_resources_dataset_id_idx" ON "dataset_resources" USING btree ("dataset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dataset_resources_dataset_format_url_idx" ON "dataset_resources" USING btree ("dataset_id","format","url");--> statement-breakpoint
CREATE INDEX "dataset_resources_format_idx" ON "dataset_resources" USING btree ("format");--> statement-breakpoint
CREATE UNIQUE INDEX "datasets_slug_unique_idx" ON "datasets" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "datasets_published_updated_idx" ON "datasets" USING btree ("is_published","last_updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "datasets_category_idx" ON "datasets" USING btree ("category");--> statement-breakpoint
CREATE INDEX "datasets_source_organization_idx" ON "datasets" USING btree ("source_organization");--> statement-breakpoint
CREATE INDEX "datasets_search_vector_gin_idx" ON "datasets" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "datasets_tags_gin_idx" ON "datasets" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "datasets_downloads_idx" ON "datasets" USING btree ("downloads_count" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "infrastructure_projects_tenant_external_project_idx" ON "infrastructure_projects" USING btree ("tenant_id","external_project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "infrastructure_projects_id_tenant_idx" ON "infrastructure_projects" USING btree ("id","tenant_id");--> statement-breakpoint
CREATE INDEX "infrastructure_projects_tenant_assigned_idx" ON "infrastructure_projects" USING btree ("tenant_id","assigned_user_id");--> statement-breakpoint
CREATE INDEX "infrastructure_projects_fiscal_year_idx" ON "infrastructure_projects" USING btree ("fiscal_year");--> statement-breakpoint
CREATE UNIQUE INDEX "project_progress_attachments_cloudinary_public_id_idx" ON "project_progress_attachments" USING btree ("cloudinary_public_id");--> statement-breakpoint
CREATE INDEX "project_progress_attachments_tenant_report_idx" ON "project_progress_attachments" USING btree ("tenant_id","report_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_progress_reports_project_period_idx" ON "project_progress_reports" USING btree ("project_id","period_year","period_month");--> statement-breakpoint
CREATE INDEX "project_progress_reports_tenant_project_period_idx" ON "project_progress_reports" USING btree ("tenant_id","project_id","period_year","period_month");--> statement-breakpoint
CREATE UNIQUE INDEX "project_progress_reports_id_tenant_idx" ON "project_progress_reports" USING btree ("id","tenant_id");