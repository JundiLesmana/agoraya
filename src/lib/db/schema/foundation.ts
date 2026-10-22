import { index, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { userStatusEnum, bpsSourceEnum } from "./enums";

export const auditColumns = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const tenants = pgTable("tenants", { id: uuid("id").primaryKey().notNull(), name: varchar("name", { length: 255 }).notNull(), slug: varchar("slug", { length: 100 }).notNull().unique(), status: varchar("status", { length: 50 }).notNull().default("active"), ...auditColumns });
export const users = pgTable("users", { id: uuid("id").primaryKey().notNull(), tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(), email: varchar("email", { length: 255 }).notNull().unique(), name: varchar("name", { length: 255 }).notNull(), nik: varchar("nik", { length: 32 }), status: userStatusEnum("user_status").notNull().default("active"), ...auditColumns }, (t) => ({ tenantIdx: index("users_tenant_id_idx").on(t.tenantId), emailIdx: uniqueIndex("users_email_lower_idx").on(t.email) }));
export const userSessions = pgTable("user_sessions", { id: uuid("id").primaryKey().notNull(), userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(), tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), ...auditColumns }, (t) => ({ userIdx: index("user_sessions_user_id_idx").on(t.userId) }));
export const otpCodes = pgTable("otp_codes", { id: uuid("id").primaryKey().notNull(), identifierHash: varchar("identifier_hash", { length: 255 }).notNull(), codeHash: varchar("code_hash", { length: 255 }).notNull(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), attempts: varchar("attempts", { length: 10 }).notNull().default("0"), ...auditColumns }, (t) => ({ identifierIdx: index("otp_codes_identifier_hash_idx").on(t.identifierHash) }));
