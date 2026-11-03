import { sql } from "drizzle-orm";
import {
  check,
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

export const statisticOperatorAssignments = pgTable(
  "statistic_operator_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
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
      name: "statistic_operator_assignments_user_tenant_fk",
    }).onDelete("cascade"),
    scopeUnique: uniqueIndex("statistic_operator_assignments_scope_idx").on(
      table.userId,
      table.tenantId,
      table.agencyId,
      table.regionId,
      table.sectorId,
    ),
    userTenantIdx: index("statistic_operator_assignments_user_tenant_idx").on(
      table.userId,
      table.tenantId,
    ),
  }),
);

export const statisticEntries = pgTable(
  "statistic_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    agencyId: varchar("agency_id", { length: 120 }).notNull(),
    regionId: varchar("region_id", { length: 120 }).notNull(),
    regionName: varchar("region_name", { length: 160 }).notNull(),
    sectorId: varchar("sector_id", { length: 100 }).notNull(),
    indicatorId: varchar("indicator_id", { length: 100 }).notNull(),
    referenceYear: integer("reference_year").notNull(),
    sourceName: varchar("source_name", { length: 255 }).notNull().default(""),
    methodology: text("methodology").notNull().default(""),
    status: varchar("status", { length: 16 }).notNull().default("draft"),
    createdBy: uuid("created_by").notNull(),
    updatedBy: uuid("updated_by").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userTenantFk: foreignKey({
      columns: [table.createdBy, table.tenantId],
      foreignColumns: [users.id, users.tenantId],
      name: "statistic_entries_created_by_tenant_fk",
    }).onDelete("restrict"),
    updatedByTenantFk: foreignKey({
      columns: [table.updatedBy, table.tenantId],
      foreignColumns: [users.id, users.tenantId],
      name: "statistic_entries_updated_by_tenant_fk",
    }).onDelete("restrict"),
    idTenant: uniqueIndex("statistic_entries_id_tenant_idx").on(
      table.id,
      table.tenantId,
    ),
    contextUnique: uniqueIndex("statistic_entries_context_idx").on(
      table.tenantId,
      table.agencyId,
      table.regionId,
      table.sectorId,
      table.indicatorId,
      table.referenceYear,
    ),
    valueContextUnique: uniqueIndex("statistic_entries_value_context_idx").on(
      table.id,
      table.tenantId,
      table.agencyId,
      table.regionId,
      table.sectorId,
      table.indicatorId,
      table.referenceYear,
    ),
    contextIdx: index("statistic_entries_context_lookup_idx").on(
      table.tenantId,
      table.regionId,
      table.referenceYear,
      table.indicatorId,
    ),
    statusCheck: check(
      "statistic_entries_status_check",
      sql`${table.status} IN ('draft', 'published')`,
    ),
    yearCheck: check(
      "statistic_entries_reference_year_check",
      sql`${table.referenceYear} BETWEEN 2000 AND 2100`,
    ),
  }),
);

export const statisticValues = pgTable(
  "statistic_values",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    entryId: uuid("entry_id").notNull(),
    agencyId: varchar("agency_id", { length: 120 }).notNull(),
    regionId: varchar("region_id", { length: 120 }).notNull(),
    sectorId: varchar("sector_id", { length: 100 }).notNull(),
    indicatorId: varchar("indicator_id", { length: 100 }).notNull(),
    referenceYear: integer("reference_year").notNull(),
    periodType: varchar("period_type", { length: 16 }).notNull(),
    periodValue: varchar("period_value", { length: 16 }).notNull(),
    actualValue: numeric("actual_value", {
      precision: 20,
      scale: 6,
      mode: "number",
    }).notNull(),
    explanation: text("explanation").notNull().default(""),
    updatedBy: uuid("updated_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    entryTenantFk: foreignKey({
      columns: [
        table.entryId,
        table.tenantId,
        table.agencyId,
        table.regionId,
        table.sectorId,
        table.indicatorId,
        table.referenceYear,
      ],
      foreignColumns: [
        statisticEntries.id,
        statisticEntries.tenantId,
        statisticEntries.agencyId,
        statisticEntries.regionId,
        statisticEntries.sectorId,
        statisticEntries.indicatorId,
        statisticEntries.referenceYear,
      ],
      name: "statistic_values_entry_tenant_fk",
    }).onDelete("cascade"),
    updatedByTenantFk: foreignKey({
      columns: [table.updatedBy, table.tenantId],
      foreignColumns: [users.id, users.tenantId],
      name: "statistic_values_updated_by_tenant_fk",
    }).onDelete("restrict"),
    periodUnique: uniqueIndex("statistic_values_period_idx").on(
      table.entryId,
      table.periodType,
      table.periodValue,
    ),
    idTenant: uniqueIndex("statistic_values_id_tenant_idx").on(
      table.id,
      table.tenantId,
    ),
    regionYearIdx: index("statistic_values_region_year_idx").on(
      table.tenantId,
      table.regionId,
      table.indicatorId,
      table.referenceYear,
    ),
    valueCheck: check(
      "statistic_values_actual_value_check",
      sql`${table.actualValue} >= 0`,
    ),
    periodTypeCheck: check(
      "statistic_values_period_type_check",
      sql`${table.periodType} IN ('monthly', 'quarterly', 'annual')`,
    ),
    periodValueCheck: check(
      "statistic_values_period_value_check",
      sql`(${table.periodType} = 'monthly' AND ${table.periodValue} ~ '^(0[1-9]|1[0-2])$')
        OR (${table.periodType} = 'quarterly' AND ${table.periodValue} ~ '^Q[1-4]$')
        OR (${table.periodType} = 'annual' AND ${table.periodValue} = ${table.referenceYear}::text)`,
    ),
  }),
);

export const statisticValueAudit = pgTable(
  "statistic_value_audit",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    entryId: uuid("entry_id").notNull(),
    valueId: uuid("value_id").notNull(),
    periodValue: varchar("period_value", { length: 16 }).notNull(),
    previousValue: numeric("previous_value", {
      precision: 20,
      scale: 6,
      mode: "number",
    }),
    newValue: numeric("new_value", {
      precision: 20,
      scale: 6,
      mode: "number",
    }).notNull(),
    actorId: uuid("actor_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    entryTenantFk: foreignKey({
      columns: [table.entryId, table.tenantId],
      foreignColumns: [statisticEntries.id, statisticEntries.tenantId],
      name: "statistic_value_audit_entry_tenant_fk",
    }).onDelete("restrict"),
    valueTenantFk: foreignKey({
      columns: [table.valueId, table.tenantId],
      foreignColumns: [statisticValues.id, statisticValues.tenantId],
      name: "statistic_value_audit_value_tenant_fk",
    }).onDelete("restrict"),
    actorTenantFk: foreignKey({
      columns: [table.actorId, table.tenantId],
      foreignColumns: [users.id, users.tenantId],
      name: "statistic_value_audit_actor_tenant_fk",
    }).onDelete("restrict"),
    entryCreatedIdx: index("statistic_value_audit_entry_created_idx").on(
      table.entryId,
      table.createdAt,
    ),
  }),
);

export const statisticEntryDocuments = pgTable(
  "statistic_entry_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    entryId: uuid("entry_id").notNull(),
    cloudinaryPublicId: varchar("cloudinary_public_id", {
      length: 512,
    }).notNull(),
    cloudinaryAssetId: varchar("cloudinary_asset_id", {
      length: 255,
    }).notNull(),
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
      foreignColumns: [statisticEntries.id, statisticEntries.tenantId],
      name: "statistic_entry_documents_entry_tenant_fk",
    }).onDelete("cascade"),
    uploadedByTenantFk: foreignKey({
      columns: [table.uploadedBy, table.tenantId],
      foreignColumns: [users.id, users.tenantId],
      name: "statistic_entry_documents_uploaded_by_tenant_fk",
    }).onDelete("restrict"),
    cloudinaryPublicIdUnique: uniqueIndex(
      "statistic_entry_documents_cloudinary_public_id_idx",
    ).on(table.cloudinaryPublicId),
    entryIdx: index("statistic_entry_documents_entry_idx").on(
      table.tenantId,
      table.entryId,
    ),
    fileSizeCheck: check(
      "statistic_entry_documents_file_size_check",
      sql`${table.fileSize} BETWEEN 1 AND 10485760`,
    ),
  }),
);
