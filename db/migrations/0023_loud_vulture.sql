CREATE TABLE "asn_registration_attachments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"cloudinary_public_id" varchar(255) NOT NULL,
	"cloudinary_secure_url" varchar(500) NOT NULL,
	"resource_type" varchar(50) DEFAULT 'image' NOT NULL,
	"attachment_type" varchar(32) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(100),
	"size" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asn_registration_attachments_cloudinary_public_id_unique" UNIQUE("cloudinary_public_id")
);
--> statement-breakpoint
CREATE TABLE "asn_registration_details" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"birth_place" varchar(255) NOT NULL,
	"birth_date" date NOT NULL,
	"phone" varchar(32) NOT NULL,
	"employment_status" varchar(16) NOT NULL,
	"employee_number" varchar(32) NOT NULL,
	"rank_grade" varchar(100) NOT NULL,
	"appointment_date" date,
	"agency_type" varchar(32) NOT NULL,
	"province_task" varchar(255),
	"regency_task" varchar(255),
	"field" varchar(255) NOT NULL,
	"office_address" varchar(500) NOT NULL,
	"official_email" varchar(255),
	"office_phone" varchar(32),
	"ktp_address" varchar(500) NOT NULL,
	"ktp_rt" varchar(3) NOT NULL,
	"ktp_rw" varchar(3) NOT NULL,
	"ktp_postal_code" varchar(5) NOT NULL,
	"ktp_province" varchar(255) NOT NULL,
	"ktp_regency" varchar(255) NOT NULL,
	"ktp_district" varchar(255) NOT NULL,
	"ktp_village" varchar(255) NOT NULL,
	"domicile_same_as_ktp" boolean NOT NULL,
	"domicile_address" varchar(500) NOT NULL,
	"domicile_rt" varchar(3) NOT NULL,
	"domicile_rw" varchar(3) NOT NULL,
	"domicile_postal_code" varchar(5) NOT NULL,
	"domicile_province" varchar(255) NOT NULL,
	"domicile_regency" varchar(255) NOT NULL,
	"domicile_district" varchar(255) NOT NULL,
	"domicile_village" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asn_registration_attachments" ADD CONSTRAINT "asn_registration_attachments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asn_registration_attachments" ADD CONSTRAINT "asn_registration_attachments_registration_id_asn_registration_details_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."asn_registration_details"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asn_registration_details" ADD CONSTRAINT "asn_registration_details_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asn_registration_details" ADD CONSTRAINT "asn_registration_details_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asn_registration_attachments_tenant_id_idx" ON "asn_registration_attachments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "asn_registration_attachments_registration_id_idx" ON "asn_registration_attachments" USING btree ("registration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "asn_registration_attachments_registration_type_idx" ON "asn_registration_attachments" USING btree ("registration_id","attachment_type");--> statement-breakpoint
CREATE INDEX "asn_registration_details_tenant_id_idx" ON "asn_registration_details" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "asn_registration_details_user_id_idx" ON "asn_registration_details" USING btree ("user_id");