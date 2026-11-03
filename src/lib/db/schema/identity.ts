import {
  index,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { auditColumns, tenants, users } from "./foundation";
import { jobPositionTypeEnum } from "./enums";

export const jobPositions = pgTable(
  "job_positions",
  {
    id: uuid("id").primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: jobPositionTypeEnum("position_type"),
    ...auditColumns,
  },
  (table) => ({
    nameIdx: uniqueIndex("job_positions_name_idx").on(table.name),
  }),
);

export const asnProfiles = pgTable(
  "asn_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    nip: varchar("nip", { length: 32 }),
    opdName: varchar("opd_name", { length: 255 }),
    unitName: varchar("unit_name", { length: 255 }),
    positionId: uuid("position_id").references(() => jobPositions.id, {
      onDelete: "set null",
    }),
    ...auditColumns,
  },
  (table) => ({
    tenantIdx: index("asn_profiles_tenant_id_idx").on(table.tenantId),
    opdIdx: index("asn_profiles_opd_name_idx").on(table.opdName),
    positionIdx: index("asn_profiles_position_id_idx").on(table.positionId),
  }),
);
