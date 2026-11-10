import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { bpsSourceEnum } from "./enums";
import { datasets } from "./datasets";
import { tenants, users } from "./foundation";
import { infrastructureProjects } from "./project-progress";

export interface AsnDatasetDictionaryColumn {
  name: string;
  type: "integer" | "decimal" | "date" | "text";
  description: string;
}

export const asnDatasetSubmissions = pgTable(
  "asn_dataset_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "restrict" })
      .notNull(),
    datasetId: uuid("dataset_id")
      .references(() => datasets.id, { onDelete: "restrict" })
      .notNull(),
    createdBy: uuid("created_by").notNull(),
    updatedBy: uuid("updated_by").notNull(),
    assignmentType: varchar("assignment_type", { length: 16 }).notNull(),
    agencyId: varchar("agency_id", { length: 120 }),
    regionId: varchar("region_id", { length: 120 }),
    regionName: varchar("region_name", { length: 160 }),
    sectorId: varchar("sector_id", { length: 100 }),
    referenceYear: integer("reference_year").notNull(),
    projectId: uuid("project_id"),
    title: varchar("title", { length: 255 }).notNull(),
    summary: varchar("summary", { length: 500 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 32 }).notNull(),
    sourceOrganization: varchar("source_organization", {
      length: 255,
    }).notNull(),
    sourceUrl: text("source_url"),
    sourceLabel: bpsSourceEnum("source_label").notNull(),
    sourceKind: varchar("source_kind", { length: 16 }).notNull(),
    licenseName: varchar("license_name", { length: 160 }).notNull(),
    licenseUrl: text("license_url"),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    dataDictionary: jsonb("data_dictionary")
      .$type<AsnDatasetDictionaryColumn[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    periodStart: date("period_start", { mode: "string" }),
    periodEnd: date("period_end", { mode: "string" }),
    frequency: varchar("frequency", { length: 16 }).notNull(),
    csvData: text("csv_data").notNull(),
    recordCount: integer("record_count").notNull(),
    status: varchar("status", { length: 16 }).notNull().default("draft"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    createdByTenantFk: foreignKey({
      columns: [table.createdBy, table.tenantId],
      foreignColumns: [users.id, users.tenantId],
      name: "asn_dataset_submissions_created_by_tenant_fk",
    }).onDelete("restrict"),
    updatedByTenantFk: foreignKey({
      columns: [table.updatedBy, table.tenantId],
      foreignColumns: [users.id, users.tenantId],
      name: "asn_dataset_submissions_updated_by_tenant_fk",
    }).onDelete("restrict"),
    projectTenantFk: foreignKey({
      columns: [table.projectId, table.tenantId],
      foreignColumns: [infrastructureProjects.id, infrastructureProjects.tenantId],
      name: "asn_dataset_submissions_project_tenant_fk",
    }).onDelete("restrict"),
    idTenantUnique: uniqueIndex("asn_dataset_submissions_id_tenant_idx").on(
      table.id,
      table.tenantId,
    ),
    idScopeUnique: uniqueIndex("asn_dataset_submissions_apbd_scope_idx").on(
      table.id,
      table.tenantId,
      table.agencyId,
      table.regionId,
      table.sectorId,
      table.referenceYear,
    ),
    idProjectScopeUnique: uniqueIndex(
      "asn_dataset_submissions_project_scope_idx",
    ).on(table.id, table.tenantId, table.projectId),
    ownerIdx: index("asn_dataset_submissions_owner_idx").on(
      table.tenantId,
      table.createdBy,
      table.status,
    ),
    assignmentIdx: index("asn_dataset_submissions_assignment_idx").on(
      table.tenantId,
      table.assignmentType,
      table.agencyId,
      table.regionId,
      table.sectorId,
      table.referenceYear,
      table.status,
    ),
    projectIdx: index("asn_dataset_submissions_project_idx").on(
      table.tenantId,
      table.projectId,
      table.status,
    ),
    assignmentCheck: check(
      "asn_dataset_submissions_assignment_check",
      sql`
        (${table.assignmentType} IN ('statistics', 'apbd')
          AND ${table.agencyId} IS NOT NULL
          AND ${table.regionId} IS NOT NULL
          AND ${table.regionName} IS NOT NULL
          AND ${table.sectorId} IS NOT NULL
          AND ${table.referenceYear} BETWEEN 2000 AND 2100
          AND ${table.projectId} IS NULL)
        OR
        (${table.assignmentType} = 'project'
          AND ${table.projectId} IS NOT NULL
          AND ${table.referenceYear} BETWEEN 2000 AND 2100)
      `,
    ),
    categoryCheck: check(
      "asn_dataset_submissions_category_check",
      sql`${table.category} IN ('Anggaran', 'Proyek', 'Statistik')`,
    ),
    categoryAssignmentCheck: check(
      "asn_dataset_submissions_category_assignment_check",
      sql`
        (${table.category} = 'Anggaran' AND ${table.assignmentType} = 'apbd')
        OR (${table.category} = 'Statistik' AND ${table.assignmentType} = 'statistics')
        OR (${table.category} = 'Proyek' AND ${table.assignmentType} = 'project')
      `,
    ),
    sourceKindCheck: check(
      "asn_dataset_submissions_source_kind_check",
      sql`${table.sourceKind} IN ('manual', 'bps')`,
    ),
    frequencyCheck: check(
      "asn_dataset_submissions_frequency_check",
      sql`${table.frequency} IN ('monthly', 'quarterly', 'annual', 'irregular')`,
    ),
    statusCheck: check(
      "asn_dataset_submissions_status_check",
      sql`${table.status} IN ('draft', 'submitted')`,
    ),
    recordCountCheck: check(
      "asn_dataset_submissions_record_count_check",
      sql`${table.recordCount} BETWEEN 1 AND 10000`,
    ),
    periodCheck: check(
      "asn_dataset_submissions_period_check",
      sql`${table.periodStart} IS NULL OR ${table.periodEnd} IS NULL OR ${table.periodEnd} >= ${table.periodStart}`,
    ),
    submittedAtCheck: check(
      "asn_dataset_submissions_submitted_at_check",
      sql`${table.status} <> 'submitted' OR ${table.submittedAt} IS NOT NULL`,
    ),
  }),
);
