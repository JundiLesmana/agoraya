import {
  index,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { auditColumns, tenants, users } from "./foundation";

export const serviceApplications = pgTable(
  "service_applications",
  {
    id: uuid("id").primaryKey().notNull(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    applicantUserId: uuid("applicant_user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    assigneeId: uuid("assignee_id").references(() => users.id, {
      onDelete: "set null",
    }),
    trackingNumber: varchar("tracking_number", { length: 40 }).notNull(),
    category: varchar("category", { length: 32 }).notNull(),
    serviceType: varchar("service_type", { length: 80 }).notNull(),
    serviceId: varchar("service_id", { length: 80 }).notNull(),
    routeKey: varchar("route_key", { length: 160 }).notNull(),
    serviceName: varchar("service_name", { length: 255 }).notNull(),
    agency: varchar("agency", { length: 255 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("submitted"),
    applicantName: varchar("applicant_name", { length: 255 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull(),
    ...auditColumns,
  },
  (t) => ({
    trackingNumberIdx: uniqueIndex(
      "service_applications_tracking_number_idx",
    ).on(t.trackingNumber),
    tenantIdx: index("service_applications_tenant_id_idx").on(t.tenantId),
    applicantUserIdx: index("service_applications_applicant_user_id_idx").on(
      t.applicantUserId,
    ),
    categoryIdx: index("service_applications_category_idx").on(
      t.tenantId,
      t.category,
    ),
    serviceIdx: index("service_applications_service_idx").on(
      t.tenantId,
      t.category,
      t.serviceType,
      t.serviceId,
    ),
    submittedAtIdx: index("service_applications_submitted_at_idx").on(
      t.submittedAt,
    ),
  }),
);
