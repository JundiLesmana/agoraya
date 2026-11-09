import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { tenants, users } from "./foundation";

export const reviewActivities = pgTable(
  "review_activities",
  {
    id: uuid("id").primaryKey().notNull(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    itemType: varchar("item_type", { length: 32 })
      .$type<"report" | "service_application">()
      .notNull(),
    itemId: uuid("item_id").notNull(),
    activityType: varchar("activity_type", { length: 32 })
      .$type<"internal_note" | "public_update" | "assignment">()
      .notNull(),
    status: varchar("status", { length: 32 }),
    message: text("message").notNull(),
    actorId: uuid("actor_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    itemCreatedIdx: index("review_activities_item_created_idx").on(
      table.tenantId,
      table.itemType,
      table.itemId,
      table.createdAt,
    ),
    activityTypeIdx: index("review_activities_type_idx").on(
      table.tenantId,
      table.itemType,
      table.itemId,
      table.activityType,
    ),
  }),
);
