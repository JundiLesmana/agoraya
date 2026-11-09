import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
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

export interface DatasetDictionaryColumn {
  name: string;
  type: string;
  description: string;
}

const tsvector = customType<{ data: string; driverData: string }>({
  dataType: () => "tsvector",
});

export const datasets = pgTable(
  "datasets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 160 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    summary: varchar("summary", { length: 500 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    sourceOrganization: varchar("source_organization", {
      length: 255,
    }).notNull(),
    sourceUrl: text("source_url"),
    sourceLabel: bpsSourceEnum("source_label").notNull().default("SIMULATED"),
    licenseName: varchar("license_name", { length: 160 }).notNull(),
    licenseUrl: text("license_url"),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    dataDictionary: jsonb("data_dictionary")
      .$type<DatasetDictionaryColumn[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    lastUpdatedAt: timestamp("last_updated_at", {
      withTimezone: true,
    }).notNull(),
    downloadsCount: integer("downloads_count").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(true),
    csvData: text("csv_data"),
    searchVector: tsvector("search_vector")
      .notNull()
      .default(sql`''::tsvector`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    slugUnique: uniqueIndex("datasets_slug_unique_idx").on(table.slug),
    publishedUpdated: index("datasets_published_updated_idx").on(
      table.isPublished,
      table.lastUpdatedAt.desc(),
    ),
    categoryIdx: index("datasets_category_idx").on(table.category),
    agencyIdx: index("datasets_source_organization_idx").on(
      table.sourceOrganization,
    ),
    searchVectorGin: index("datasets_search_vector_gin_idx").using(
      "gin",
      table.searchVector,
    ),
    tagsGin: index("datasets_tags_gin_idx").using("gin", table.tags),
    downloadsIdx: index("datasets_downloads_idx").on(
      table.downloadsCount.desc(),
    ),
  }),
);

export const datasetResources = pgTable(
  "dataset_resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    datasetId: uuid("dataset_id")
      .notNull()
      .references(() => datasets.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    format: varchar("format", { length: 16 }).notNull(),
    url: text("url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    datasetIdx: index("dataset_resources_dataset_id_idx").on(table.datasetId),
    datasetFormatUnique: uniqueIndex(
      "dataset_resources_dataset_format_url_idx",
    ).on(table.datasetId, table.format, table.url),
    formatIdx: index("dataset_resources_format_idx").on(table.format),
    formatCheck: check(
      "dataset_resources_format_check",
      sql`${table.format} IN ('CSV', 'JSON', 'PDF', 'API')`,
    ),
  }),
);
