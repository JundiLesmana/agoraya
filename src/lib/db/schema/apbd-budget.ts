import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { tenants, users } from "./foundation";
import { asnDatasetSubmissions } from "./asn-dataset-submissions";

export const apbdOperatorAssignments = pgTable(
  "apbd_operator_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "restrict" })
      .notNull(),
    userId: uuid("user_id").notNull(),
    agencyId: varchar("agency_id", { length: 120 }).notNull(),
    regionId: varchar("region_id", { length: 120 }).notNull(),
    regionName: varchar("region_name", { length: 160 }).notNull(),
    sectorId: varchar("sector_id", { length: 100 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userTenantFk: foreignKey({
      columns: [table.userId, table.tenantId],
      foreignColumns: [users.id, users.tenantId],
      name: "apbd_operator_assignments_user_tenant_fk",
    }).onDelete("restrict"),
    scopeUnique: uniqueIndex("apbd_operator_assignments_scope_idx").on(
      table.userId,
      table.tenantId,
      table.agencyId,
      table.regionId,
      table.sectorId,
    ),
    userTenantIdx: index("apbd_operator_assignments_user_tenant_idx").on(
      table.userId,
      table.tenantId,
    ),
  }),
);

export const apbdEntries = pgTable(
  "apbd_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "restrict" })
      .notNull(),
    agencyId: varchar("agency_id", { length: 120 }).notNull(),
    regionId: varchar("region_id", { length: 120 }).notNull(),
    regionName: varchar("region_name", { length: 160 }).notNull(),
    sectorId: varchar("sector_id", { length: 100 }).notNull(),
    referenceYear: integer("reference_year").notNull(),
    status: varchar("status", { length: 16 }).notNull().default("draft"),
    revisionOfId: uuid("revision_of_id"),
    sourceDatasetSubmissionId: uuid("source_dataset_submission_id"),
    revisionReason: text("revision_reason").notNull().default(""),
    recordMetadata: jsonb("record_metadata")
      .$type<Record<string, string | null>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdBy: uuid("created_by").notNull(),
    updatedBy: uuid("updated_by").notNull(),
    submittedBy: uuid("submitted_by"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idTenantUnique: uniqueIndex("apbd_entries_id_tenant_unique").on(
      table.id,
      table.tenantId,
    ),
    revisionTenantFk: foreignKey({
      columns: [table.revisionOfId, table.tenantId],
      foreignColumns: [table.id, table.tenantId],
      name: "apbd_entries_revision_tenant_fk",
    }).onDelete("restrict"),
    sourceDatasetScopeFk: foreignKey({
      columns: [
        table.sourceDatasetSubmissionId,
        table.tenantId,
        table.agencyId,
        table.regionId,
        table.sectorId,
        table.referenceYear,
      ],
      foreignColumns: [
        asnDatasetSubmissions.id,
        asnDatasetSubmissions.tenantId,
        asnDatasetSubmissions.agencyId,
        asnDatasetSubmissions.regionId,
        asnDatasetSubmissions.sectorId,
        asnDatasetSubmissions.referenceYear,
      ],
      name: "apbd_entries_source_dataset_scope_fk",
    }).onDelete("restrict"),
    createdByTenantFk: foreignKey({
      columns: [table.createdBy, table.tenantId],
      foreignColumns: [users.id, users.tenantId],
      name: "apbd_entries_created_by_tenant_fk",
    }).onDelete("restrict"),
    updatedByTenantFk: foreignKey({
      columns: [table.updatedBy, table.tenantId],
      foreignColumns: [users.id, users.tenantId],
      name: "apbd_entries_updated_by_tenant_fk",
    }).onDelete("restrict"),
    submittedByTenantFk: foreignKey({
      columns: [table.submittedBy, table.tenantId],
      foreignColumns: [users.id, users.tenantId],
      name: "apbd_entries_submitted_by_tenant_fk",
    }).onDelete("restrict"),
    reviewedByTenantFk: foreignKey({
      columns: [table.reviewedBy, table.tenantId],
      foreignColumns: [users.id, users.tenantId],
      name: "apbd_entries_reviewed_by_tenant_fk",
    }).onDelete("restrict"),
    draftContextUnique: uniqueIndex("apbd_entries_draft_context_idx")
      .on(
        table.tenantId,
        table.agencyId,
        table.regionId,
        table.sectorId,
        table.referenceYear,
      )
      .where(sql`${table.status} IN ('draft', 'in_review')`),
    publicationIdx: index("apbd_entries_publication_idx").on(
      table.status,
      table.publishedAt,
      table.referenceYear,
    ),
    statusCheck: check(
      "apbd_entries_status_check",
      sql`${table.status} IN ('draft', 'in_review', 'published')`,
    ),
    yearCheck: check(
      "apbd_entries_reference_year_check",
      sql`${table.referenceYear} BETWEEN 2000 AND 2100`,
    ),
    revisionNoteCheck: check(
      "apbd_entries_revision_note_check",
      sql`${table.revisionOfId} IS NULL OR length(btrim(${table.revisionReason})) >= 10`,
    ),
    publishedAtCheck: check(
      "apbd_entries_published_at_check",
      sql`${table.status} <> 'published' OR ${table.publishedAt} IS NOT NULL`,
    ),
    reviewStateCheck: check(
      "apbd_entries_review_state_check",
      sql`${table.status} <> 'in_review' OR (${table.submittedBy} IS NOT NULL AND ${table.submittedAt} IS NOT NULL)`,
    ),
  }),
);

export const apbdBudgetItems = pgTable(
  "apbd_budget_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "restrict" })
      .notNull(),
    entryId: uuid("entry_id").notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    programName: varchar("program_name", { length: 160 }).notNull(),
    subactivityName: varchar("subactivity_name", { length: 240 }).notNull(),
    affairCode: varchar("affair_code", { length: 64 }).notNull().default(""),
    programCode: varchar("program_code", { length: 64 }).notNull().default(""),
    activityCode: varchar("activity_code", { length: 64 }).notNull().default(""),
    activityName: varchar("activity_name", { length: 240 }).notNull().default(""),
    fundingSource: varchar("funding_source", { length: 160 }).notNull().default(""),
    supportingDocument: text("supporting_document").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    entryTenantFk: foreignKey({
      columns: [table.entryId, table.tenantId],
      foreignColumns: [apbdEntries.id, apbdEntries.tenantId],
      name: "apbd_budget_items_entry_tenant_fk",
    }).onDelete("restrict"),
    idScopeUnique: uniqueIndex("apbd_budget_items_id_scope_unique").on(
      table.id,
      table.tenantId,
      table.entryId,
    ),
    codeUnique: uniqueIndex("apbd_budget_items_code_idx").on(
      table.entryId,
      table.code,
    ),
    entryIdx: index("apbd_budget_items_entry_idx").on(
      table.tenantId,
      table.entryId,
    ),
  }),
);

export const apbdBudgetPeriodValues = pgTable(
  "apbd_budget_period_values",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "restrict" })
      .notNull(),
    entryId: uuid("entry_id").notNull(),
    itemId: uuid("item_id").notNull(),
    periodType: varchar("period_type", { length: 16 }).notNull(),
    periodValue: varchar("period_value", { length: 16 }).notNull(),
    pagu: numeric("pagu", { precision: 20, scale: 0, mode: "string" }),
    realisasi: numeric("realisasi", {
      precision: 20,
      scale: 0,
      mode: "string",
    }),
    targetValue: numeric("target_value", {
      precision: 20,
      scale: 0,
      mode: "string",
    }),
    targetDate: timestamp("target_date", { withTimezone: true, mode: "string" }),
    documentReference: text("document_reference").notNull().default(""),
    updatedBy: uuid("updated_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    itemScopeFk: foreignKey({
      columns: [table.itemId, table.tenantId, table.entryId],
      foreignColumns: [
        apbdBudgetItems.id,
        apbdBudgetItems.tenantId,
        apbdBudgetItems.entryId,
      ],
      name: "apbd_budget_period_item_scope_fk",
    }).onDelete("restrict"),
    updatedByTenantFk: foreignKey({
      columns: [table.updatedBy, table.tenantId],
      foreignColumns: [users.id, users.tenantId],
      name: "apbd_budget_period_updated_by_tenant_fk",
    }).onDelete("restrict"),
    periodUnique: uniqueIndex("apbd_budget_period_value_idx").on(
      table.itemId,
      table.periodType,
      table.periodValue,
    ),
    entryIdx: index("apbd_budget_period_entry_idx").on(
      table.tenantId,
      table.entryId,
      table.periodType,
      table.periodValue,
    ),
    periodTypeCheck: check(
      "apbd_budget_period_type_check",
      sql`${table.periodType} IN ('monthly', 'quarterly')`,
    ),
    periodValueCheck: check(
      "apbd_budget_period_value_check",
      sql`(${table.periodType} = 'monthly' AND ${table.periodValue} ~ '^(0[1-9]|1[0-2])$') OR (${table.periodType} = 'quarterly' AND ${table.periodValue} ~ '^Q[1-4]$')`,
    ),
    targetValueCheck: check(
      "apbd_budget_period_target_value_check",
      sql`${table.targetValue} IS NULL OR ${table.targetValue} >= 0`,
    ),
    paguCheck: check(
      "apbd_budget_period_pagu_check",
      sql`${table.pagu} IS NULL OR ${table.pagu} >= 0`,
    ),
    realisasiCheck: check(
      "apbd_budget_period_realisasi_check",
      sql`${table.realisasi} IS NULL OR ${table.realisasi} >= 0`,
    ),
  }),
);

export const apbdEntryDocuments = pgTable(
  "apbd_entry_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "restrict" })
      .notNull(),
    entryId: uuid("entry_id").notNull(),
    cloudinaryPublicId: varchar("cloudinary_public_id", { length: 512 }).notNull(),
    cloudinaryAssetId: varchar("cloudinary_asset_id", { length: 255 }).notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    mediaType: varchar("media_type", { length: 100 }).notNull(),
    fileSize: integer("file_size").notNull(),
    uploadedBy: uuid("uploaded_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    entryTenantFk: foreignKey({
      columns: [table.entryId, table.tenantId],
      foreignColumns: [apbdEntries.id, apbdEntries.tenantId],
      name: "apbd_entry_documents_entry_tenant_fk",
    }).onDelete("cascade"),
    uploadedByTenantFk: foreignKey({
      columns: [table.uploadedBy, table.tenantId],
      foreignColumns: [users.id, users.tenantId],
      name: "apbd_entry_documents_uploaded_by_tenant_fk",
    }).onDelete("restrict"),
    publicIdUnique: uniqueIndex("apbd_entry_documents_public_id_idx").on(
      table.cloudinaryPublicId,
    ),
    entryIdx: index("apbd_entry_documents_entry_idx").on(
      table.tenantId,
      table.entryId,
    ),
    fileSizeCheck: check(
      "apbd_entry_documents_file_size_check",
      sql`${table.fileSize} BETWEEN 1 AND 10485760`,
    ),
  }),
);

export const apbdValueAudit = pgTable(
  "apbd_value_audit",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "restrict" })
      .notNull(),
    entryId: uuid("entry_id").notNull(),
    itemId: uuid("item_id").notNull(),
    periodType: varchar("period_type", { length: 16 }).notNull(),
    periodValue: varchar("period_value", { length: 16 }).notNull(),
    field: varchar("field", { length: 16 }).notNull(),
    previousValue: numeric("previous_value", {
      precision: 20,
      scale: 0,
      mode: "string",
    }),
    newValue: numeric("new_value", {
      precision: 20,
      scale: 0,
      mode: "string",
    }),
    actorId: uuid("actor_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    itemScopeFk: foreignKey({
      columns: [table.itemId, table.tenantId, table.entryId],
      foreignColumns: [
        apbdBudgetItems.id,
        apbdBudgetItems.tenantId,
        apbdBudgetItems.entryId,
      ],
      name: "apbd_value_audit_item_scope_fk",
    }).onDelete("restrict"),
    actorTenantFk: foreignKey({
      columns: [table.actorId, table.tenantId],
      foreignColumns: [users.id, users.tenantId],
      name: "apbd_value_audit_actor_tenant_fk",
    }).onDelete("restrict"),
    entryCreatedIdx: index("apbd_value_audit_entry_created_idx").on(
      table.tenantId,
      table.entryId,
      table.createdAt,
    ),
    fieldCheck: check(
      "apbd_value_audit_field_check",
      sql`${table.field} IN ('pagu', 'realisasi')`,
    ),
    changedCheck: check(
      "apbd_value_audit_value_changed_check",
      sql`${table.previousValue} IS DISTINCT FROM ${table.newValue}`,
    ),
  }),
);
