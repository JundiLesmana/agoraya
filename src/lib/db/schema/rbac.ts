import { foreignKey, index, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid, varchar, integer } from "drizzle-orm/pg-core";
import { auditColumns, tenants, users } from "./foundation";

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().notNull(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    key: varchar("key", { length: 100 }).notNull(),
    ...auditColumns,
  },
  (t) => ({ tenantKeyIdx: uniqueIndex("roles_tenant_id_key_idx").on(t.tenantId, t.key) }),
);
export const permissions = pgTable("permissions", { id: uuid("id").primaryKey().notNull(), key: varchar("key", { length: 100 }).notNull().unique(), description: text("description"), ...auditColumns });
export const rolePermissions = pgTable("role_permissions", { roleId: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(), permissionId: uuid("permission_id").references(() => permissions.id, { onDelete: "cascade" }).notNull(), grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(), grantedBy: uuid("granted_by").references(() => users.id, { onDelete: "set null" }), revokedAt: timestamp("revoked_at", { withTimezone: true }) }, (t) => ({ pk: primaryKey({ columns: [t.roleId, t.permissionId] }) }));
export const userRoles = pgTable("user_roles", { userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(), roleId: uuid("role_id").references(() => roles.id, { onDelete: "cascade" }).notNull(), grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(), grantedBy: uuid("granted_by").references(() => users.id, { onDelete: "set null" }), expiresAt: timestamp("expires_at", { withTimezone: true }), revokedAt: timestamp("revoked_at", { withTimezone: true }) }, (t) => ({ pk: primaryKey({ columns: [t.userId, t.roleId] }), roleIdx: index("user_roles_role_id_idx").on(t.roleId) }));
export const rbacPolicies = pgTable("rbac_policies", { id: uuid("id").primaryKey().notNull(), key: varchar("key", { length: 100 }).notNull().unique(), name: varchar("name", { length: 200 }).notNull(), description: text("description"), effect: varchar("effect", { length: 20 }).notNull().default("allow"), priority: integer("priority").notNull().default(100), status: varchar("status", { length: 20 }).notNull().default("active"), version: integer("version").notNull().default(1), tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }), roles: jsonb("roles").$type<string[]>().notNull(), permissions: jsonb("permissions").$type<string[]>().notNull(), resources: jsonb("resources").$type<string[]>().notNull(), actions: jsonb("actions").$type<string[]>().notNull(), conditions: jsonb("conditions").$type<unknown>().notNull(), ...auditColumns }, (t) => ({ statusIdx: index("rbac_policies_status_idx").on(t.status), tenantIdx: index("rbac_policies_tenant_id_idx").on(t.tenantId) }));
export const rbacPolicyVersions = pgTable("rbac_policy_versions", { id: uuid("id").primaryKey().notNull(), policyId: uuid("policy_id").references(() => rbacPolicies.id, { onDelete: "cascade" }).notNull(), policyKey: varchar("policy_key", { length: 100 }).notNull(), version: integer("version").notNull(), definition: jsonb("definition").$type<unknown>().notNull(), changedBy: uuid("changed_by").references(() => users.id, { onDelete: "set null" }), reason: text("reason"), ...auditColumns }, (t) => ({ policyVersionIdx: uniqueIndex("rbac_policy_versions_policy_id_version_idx").on(t.policyId, t.version), policyKeyIdx: index("rbac_policy_versions_policy_key_idx").on(t.policyKey) }));
