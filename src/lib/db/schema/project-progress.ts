import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { tenants, users } from "./foundation";
import { projectProgressStatusEnum } from "./enums";

export const infrastructureProjects = pgTable(
  "infrastructure_projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    assignedUserId: uuid("assigned_user_id").notNull(),
    externalProjectId: varchar("external_project_id", {
      length: 160,
    }).notNull(),
    packageName: varchar("package_name", { length: 255 }).notNull(),
    location: varchar("location", { length: 255 }).notNull(),
    sector: varchar("sector", { length: 100 }).notNull(),
    contractValue: numeric("contract_value", {
      precision: 18,
      scale: 2,
      mode: "number",
    }).notNull(),
    providerName: varchar("provider_name", { length: 255 }).notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    fiscalYear: integer("fiscal_year").notNull(),
    initialPhysicalProgress: numeric("initial_physical_progress", {
      precision: 5,
      scale: 2,
      mode: "number",
    })
      .notNull()
      .default(0),
    initialFinancialProgress: numeric("initial_financial_progress", {
      precision: 5,
      scale: 2,
      mode: "number",
    })
      .notNull()
      .default(0),
    status: varchar("status", { length: 30 }).notNull().default("ongoing"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    assignedUserTenantFk: foreignKey({
      columns: [table.assignedUserId, table.tenantId],
      foreignColumns: [users.id, users.tenantId],
      name: "infrastructure_projects_assigned_user_tenant_fk",
    }).onDelete("restrict"),
    tenantExternalProject: uniqueIndex(
      "infrastructure_projects_tenant_external_project_idx",
    ).on(table.tenantId, table.externalProjectId),
    idTenant: uniqueIndex("infrastructure_projects_id_tenant_idx").on(
      table.id,
      table.tenantId,
    ),
    tenantAssigned: index("infrastructure_projects_tenant_assigned_idx").on(
      table.tenantId,
      table.assignedUserId,
    ),
    fiscalYearIndex: index("infrastructure_projects_fiscal_year_idx").on(
      table.fiscalYear,
    ),
    contractValueCheck: check(
      "infrastructure_projects_contract_value_check",
      sql`${table.contractValue} >= 0`,
    ),
    initialPhysicalCheck: check(
      "infrastructure_projects_initial_physical_check",
      sql`${table.initialPhysicalProgress} BETWEEN 0 AND 100`,
    ),
    initialFinancialCheck: check(
      "infrastructure_projects_initial_financial_check",
      sql`${table.initialFinancialProgress} BETWEEN 0 AND 100`,
    ),
    dateRangeCheck: check(
      "infrastructure_projects_date_range_check",
      sql`${table.endDate} >= ${table.startDate}`,
    ),
  }),
);

export const projectProgressReports = pgTable(
  "project_progress_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    projectId: uuid("project_id").notNull(),
    reportedBy: uuid("reported_by").notNull(),
    periodMonth: integer("period_month").notNull(),
    periodYear: integer("period_year").notNull(),
    physicalProgress: numeric("physical_progress", {
      precision: 5,
      scale: 2,
      mode: "number",
    }).notNull(),
    financialProgress: numeric("financial_progress", {
      precision: 5,
      scale: 2,
      mode: "number",
    }).notNull(),
    evaluationNotes: text("evaluation_notes").notNull().default(""),
    status: projectProgressStatusEnum("status").notNull().default("draft"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    reportedByTenantFk: foreignKey({
      columns: [table.reportedBy, table.tenantId],
      foreignColumns: [users.id, users.tenantId],
      name: "project_progress_reports_reported_by_tenant_fk",
    }).onDelete("restrict"),
    projectTenantFk: foreignKey({
      columns: [table.projectId, table.tenantId],
      foreignColumns: [
        infrastructureProjects.id,
        infrastructureProjects.tenantId,
      ],
      name: "project_progress_reports_project_tenant_fk",
    }).onDelete("cascade"),
    projectPeriod: uniqueIndex(
      "project_progress_reports_project_period_idx",
    ).on(table.projectId, table.periodYear, table.periodMonth),
    tenantProjectPeriod: index(
      "project_progress_reports_tenant_project_period_idx",
    ).on(table.tenantId, table.projectId, table.periodYear, table.periodMonth),
    idTenant: uniqueIndex("project_progress_reports_id_tenant_idx").on(
      table.id,
      table.tenantId,
    ),
    periodCheck: check(
      "project_progress_reports_period_check",
      sql`${table.periodMonth} BETWEEN 1 AND 12 AND ${table.periodYear} BETWEEN 2020 AND 2100`,
    ),
    physicalCheck: check(
      "project_progress_reports_physical_check",
      sql`${table.physicalProgress} BETWEEN 0 AND 100`,
    ),
    financialCheck: check(
      "project_progress_reports_financial_check",
      sql`${table.financialProgress} BETWEEN 0 AND 100`,
    ),
  }),
);

export const projectProgressAttachments = pgTable(
  "project_progress_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    reportId: uuid("report_id").notNull(),
    cloudinaryPublicId: varchar("cloudinary_public_id", {
      length: 512,
    }).notNull(),
    cloudinaryAssetId: varchar("cloudinary_asset_id", {
      length: 255,
    }).notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    mediaType: varchar("media_type", { length: 32 }).notNull(),
    fileSize: integer("file_size").notNull(),
    uploadedBy: uuid("uploaded_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uploadedByTenantFk: foreignKey({
      columns: [table.uploadedBy, table.tenantId],
      foreignColumns: [users.id, users.tenantId],
      name: "project_progress_attachments_uploaded_by_tenant_fk",
    }).onDelete("restrict"),
    reportTenantFk: foreignKey({
      columns: [table.reportId, table.tenantId],
      foreignColumns: [
        projectProgressReports.id,
        projectProgressReports.tenantId,
      ],
      name: "project_progress_attachments_report_tenant_fk",
    }).onDelete("cascade"),
    cloudinaryPublicIdUnique: uniqueIndex(
      "project_progress_attachments_cloudinary_public_id_idx",
    ).on(table.cloudinaryPublicId),
    tenantReportIndex: index(
      "project_progress_attachments_tenant_report_idx",
    ).on(table.tenantId, table.reportId),
    mediaTypeCheck: check(
      "project_progress_attachments_media_type_check",
      sql`${table.mediaType} IN ('image/jpeg', 'image/png')`,
    ),
    fileSizeCheck: check(
      "project_progress_attachments_file_size_check",
      sql`${table.fileSize} BETWEEN 1 AND 5242880`,
    ),
  }),
);
