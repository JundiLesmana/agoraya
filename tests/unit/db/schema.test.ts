import { describe, it, expect } from "vitest";
import {
  tables,
  kycStatusEnum,
  kycApprovalDecisionEnum,
  cmsContentStatusEnum,
  cmsRiskLevelEnum,
  cmsRiskDecisionEnum,
  userStatusEnum,
  ticketStatusEnum,
  bpsSourceEnum,
} from "../../../src/lib/db/schema/index.js";

const TABLES = tables as unknown as Record<string, Record<string, unknown>>;

const EXPECTED_TABLES = [
  "tenants",
  "users",
  "userSessions",
  "otpCodes",
  "roles",
  "permissions",
  "rolePermissions",
  "userRoles",
  "tickets",
  "ticketAuditLogs",
  "bpsSnapshots",
  "auditEvents",
  "rbacPolicies",
  "rbacPolicyVersions",
  "ticketEvidence",
  "ticketVotes",
  "kycRoster",
  "kycApprovals",
  "cmsContents",
  "cmsContentVersions",
  "cmsRiskReviews",
  "cmsAuditLogs",
] as const;

// Column keys as exposed on the Drizzle table object (camelCase TS property names).
const TABLE_COLUMNS: Record<string, readonly string[]> = {
  tenants: ["id", "name", "slug", "status", "createdAt", "updatedAt"],
  users: [
    "id",
    "tenantId",
    "email",
    "name",
    "nik",
    "status",
    "createdAt",
    "updatedAt",
  ],
  userSessions: [
    "id",
    "userId",
    "tokenHash",
    "expiresAt",
    "createdAt",
    "updatedAt",
  ],
  otpCodes: [
    "id",
    "identifierHash",
    "codeHash",
    "expiresAt",
    "attempts",
    "createdAt",
    "updatedAt",
  ],
  roles: ["id", "tenantId", "name", "key", "createdAt", "updatedAt"],
  permissions: ["id", "key", "description", "createdAt", "updatedAt"],
  rolePermissions: ["roleId", "permissionId"],
  userRoles: ["userId", "roleId"],
  tickets: [
    "id",
    "tenantId",
    "citizenId",
    "category",
    "title",
    "description",
    "status",
    "urgency",
    "location",
    "createdAt",
    "updatedAt",
  ],
  ticketAuditLogs: [
    "id",
    "ticketId",
    "actorId",
    "action",
    "previousState",
    "newState",
    "reason",
    "createdAt",
    "updatedAt",
  ],
  bpsSnapshots: [
    "id",
    "dataset",
    "region",
    "year",
    "month",
    "payload",
    "sourceLabel",
    "fetchedAt",
    "createdAt",
    "updatedAt",
  ],
  auditEvents: [
    "id",
    "actorId",
    "action",
    "targetTable",
    "targetId",
    "metadata",
    "createdAt",
    "updatedAt",
  ],
  rbacPolicies: [
    "id",
    "key",
    "name",
    "description",
    "effect",
    "priority",
    "status",
    "version",
    "tenantId",
    "roles",
    "permissions",
    "resources",
    "actions",
    "conditions",
    "createdAt",
    "updatedAt",
  ],
  rbacPolicyVersions: [
    "id",
    "policyId",
    "policyKey",
    "version",
    "definition",
    "changedBy",
    "reason",
    "createdAt",
    "updatedAt",
  ],
  ticketEvidence: [
    "id",
    "ticketId",
    "tenantId",
    "uploadedBy",
    "storageKey",
    "mediaType",
    "purpose",
    "note",
    "createdAt",
    "updatedAt",
  ],
  ticketVotes: ["ticketId", "tenantId", "voterId", "value", "createdAt", "updatedAt"],
  kycRoster: [
    "id",
    "tenantId",
    "userId",
    "nikHash",
    "name",
    "status",
    "expiresAt",
    "submittedBy",
    "createdAt",
    "updatedAt",
  ],
  kycApprovals: [
    "id",
    "rosterId",
    "tenantId",
    "approverId",
    "approvalSlot",
    "decision",
    "reason",
    "createdAt",
    "updatedAt",
  ],
  cmsContents: [
    "id",
    "tenantId",
    "slug",
    "title",
    "body",
    "status",
    "version",
    "createdBy",
    "publishedAt",
    "archivedAt",
    "deletedAt",
    "createdAt",
    "updatedAt",
  ],
  cmsContentVersions: [
    "id",
    "contentId",
    "tenantId",
    "version",
    "title",
    "body",
    "status",
    "changedBy",
    "changeReason",
    "createdAt",
  ],
  cmsRiskReviews: [
    "id",
    "contentId",
    "tenantId",
    "reviewerId",
    "score",
    "level",
    "decision",
    "rationale",
    "createdAt",
  ],
  cmsAuditLogs: [
    "id",
    "contentId",
    "tenantId",
    "actorId",
    "action",
    "previousStatus",
    "nextStatus",
    "metadata",
    "createdAt",
  ],
};

// DB table names (snake_case) as registered with pgTable.
const DB_TABLE_NAMES: Record<string, string> = {
  tenants: "tenants",
  users: "users",
  userSessions: "user_sessions",
  otpCodes: "otp_codes",
  roles: "roles",
  permissions: "permissions",
  rolePermissions: "role_permissions",
  userRoles: "user_roles",
  tickets: "tickets",
  ticketAuditLogs: "ticket_audit_logs",
  bpsSnapshots: "bps_snapshots",
  auditEvents: "audit_events",
  rbacPolicies: "rbac_policies",
  rbacPolicyVersions: "rbac_policy_versions",
  ticketEvidence: "ticket_evidence",
  ticketVotes: "ticket_votes",
  kycRoster: "kyc_roster",
  kycApprovals: "kyc_approvals",
  cmsContents: "cms_contents",
  cmsContentVersions: "cms_content_versions",
  cmsRiskReviews: "cms_risk_reviews",
  cmsAuditLogs: "cms_audit_logs",
};

function getTableName(table: unknown): string | undefined {
  const symbols = Object.getOwnPropertySymbols(table as object);
  const nameSymbol = symbols.find((s) => s.description === "drizzle:Name");
  if (!nameSymbol) return undefined;
  return (table as Record<symbol, unknown>)[nameSymbol] as string | undefined;
}

describe("foundation database schema", () => {
  it("defines all expected foundation tables", () => {
    for (const name of EXPECTED_TABLES) {
      expect(TABLES[name]).toBeTruthy();
    }
  });

  it("registers snake_case DB table names via pgTable", () => {
    for (const [key, expectedDbName] of Object.entries(DB_TABLE_NAMES)) {
      const table = TABLES[key];
      const tableName = getTableName(table);
      expect(tableName, `missing drizzle:Name symbol for ${key}`).toBeDefined();
      expect(tableName as string).toBe(expectedDbName);
      expect(/^[a-z][a-z0-9_]*$/.test(tableName as string)).toBe(true);
    }
  });

  it("users table has expected columns", () => {
    const users = TABLES.users;
    for (const col of TABLE_COLUMNS.users) {
      expect(users).toHaveProperty(col);
    }
  });

  it("ticket status enum contains only demo-safe values", () => {
    expect(ticketStatusEnum.enumValues).toEqual([
      "draft",
      "submitted",
      "verified",
      "in_progress",
      "resolved",
      "rejected",
      "closed",
    ]);
  });

  it("module-specific enums contain expected values", () => {
    expect(kycStatusEnum.enumValues).toEqual([
      "pending",
      "partially_approved",
      "verified",
      "rejected",
      "expired",
    ]);
    expect(kycApprovalDecisionEnum.enumValues).toEqual(["approved", "rejected"]);
    expect(cmsContentStatusEnum.enumValues).toEqual(["draft", "in_review", "published", "archived"]);
    expect(cmsRiskLevelEnum.enumValues).toEqual(["low", "medium", "high"]);
    expect(cmsRiskDecisionEnum.enumValues).toEqual(["approved", "rejected"]);
  });

  it("user status enum contains expected lifecycle values", () => {
    expect(userStatusEnum.enumValues).toEqual([
      "active",
      "inactive",
      "suspended",
    ]);
  });

  it("bps source enum labels data as simulated, never real government access", () => {
    expect(bpsSourceEnum.enumValues).toContain("SIMULATED");
    expect(bpsSourceEnum.enumValues).toContain("BPS_API");
    expect(bpsSourceEnum.enumValues).toContain("CITIZEN_UNVERIFIED");
    expect(bpsSourceEnum.enumValues).not.toContain("REAL_DUKCAPIL");
    expect(bpsSourceEnum.enumValues).not.toContain("REAL_SIASN");
  });

  it("bps_snapshots has the expected columns", () => {
    const snapshots = TABLES.bpsSnapshots;
    for (const col of TABLE_COLUMNS.bpsSnapshots) {
      expect(snapshots).toHaveProperty(col);
    }
  });

  it("every foundation table exposes its declared columns", () => {
    for (const key of EXPECTED_TABLES) {
      const table = TABLES[key];
      const expected = TABLE_COLUMNS[key];
      if (!expected) continue;
      for (const col of expected) {
        expect(table).toHaveProperty(col);
      }
    }
  });
});
