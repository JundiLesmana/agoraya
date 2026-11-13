import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const bpsStatistics = pgTable(
  "bps_statistics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    indicatorCode: varchar("indicator_code", { length: 100 }).notNull(),
    indicatorName: varchar("indicator_name", { length: 255 })
      .notNull()
      .default(""),
    regionCode: varchar("region_code", { length: 100 }).notNull(),
    year: integer("year").notNull(),
    value: numeric("value", { precision: 20, scale: 6, mode: "number" }).notNull(),
    unit: varchar("unit", { length: 50 }).notNull(),
    category: varchar("category", { length: 100 }).notNull().default(""),
    sourceLabel: varchar("source_label", { length: 100 }).notNull(),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    indicatorRegionYearUnique: uniqueIndex(
      "bps_statistics_indicator_region_year_unique",
    ).on(table.indicatorCode, table.regionCode, table.year),
    regionCodeIdx: index("bps_statistics_region_code_idx").on(table.regionCode),
    indicatorCodeIdx: index(
      "bps_statistics_indicator_code_idx",
    ).on(table.indicatorCode),
    yearCheck: check(
      "bps_statistics_year_check",
      sql`${table.year} BETWEEN 2000 AND 2100`,
    ),
    valueCheck: check(
      "bps_statistics_value_check",
      sql`${table.value} >= 0`,
    ),
  }),
);
