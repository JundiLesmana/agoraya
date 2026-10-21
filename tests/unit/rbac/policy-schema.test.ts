import { describe, it, expect } from "vitest";

import {
  accessRequestSchema,
  assignRoleCommandSchema,
  policyConditionSchema,
  policyDefinitionSchema,
  savePolicyCommandSchema,
} from "@/modules/rbac/schema";

const validDefinition = {
  key: "tickets.read",
  name: "Membaca laporan",
  effect: "allow" as const,
  resources: ["tickets"],
  actions: ["read"],
  roles: ["checker"],
};

describe("modules/rbac schema", () => {
  describe("policyConditionSchema", () => {
    it("accepts a scalar comparison", () => {
      const parsed = policyConditionSchema.safeParse({
        attribute: "resource.tenantId",
        operator: "eq",
        value: "$subject.tenantId",
      });
      expect(parsed.success).toBe(true);
    });

    it("accepts a set comparison", () => {
      const parsed = policyConditionSchema.safeParse({
        attribute: "resource.status",
        operator: "in",
        value: ["submitted", "in_progress"],
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects a set operator with a scalar value", () => {
      const parsed = policyConditionSchema.safeParse({
        attribute: "resource.status",
        operator: "in",
        value: "submitted",
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects an unknown operator", () => {
      const parsed = policyConditionSchema.safeParse({
        attribute: "resource.status",
        operator: "matches",
        value: "submitted",
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects unknown keys", () => {
      const parsed = policyConditionSchema.safeParse({
        attribute: "resource.status",
        operator: "eq",
        value: "submitted",
        secret: "value",
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("policyDefinitionSchema", () => {
    it("applies defaults", () => {
      const parsed = policyDefinitionSchema.safeParse(validDefinition);
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      expect(parsed.data.priority).toBe(100);
      expect(parsed.data.status).toBe("active");
      expect(parsed.data.permissions).toEqual([]);
      expect(parsed.data.conditions).toEqual([]);
      expect(parsed.data.tenantId).toBeNull();
    });

    it("rejects a policy without resources", () => {
      const parsed = policyDefinitionSchema.safeParse({
        ...validDefinition,
        resources: [],
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects a policy without actions", () => {
      const parsed = policyDefinitionSchema.safeParse({
        ...validDefinition,
        actions: [],
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects a policy that does not constrain the subject", () => {
      const parsed = policyDefinitionSchema.safeParse({
        ...validDefinition,
        roles: [],
        permissions: [],
      });
      expect(parsed.success).toBe(false);
    });

    it("accepts a policy constrained by permission only", () => {
      const parsed = policyDefinitionSchema.safeParse({
        ...validDefinition,
        roles: [],
        permissions: ["audit:read"],
      });
      expect(parsed.success).toBe(true);
    });

    it("rejects an invalid policy key", () => {
      const parsed = policyDefinitionSchema.safeParse({
        ...validDefinition,
        key: "Tickets Read!",
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects unknown keys", () => {
      const parsed = policyDefinitionSchema.safeParse({
        ...validDefinition,
        bypass: true,
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("savePolicyCommandSchema", () => {
    it("rejects a command without an actor", () => {
      const parsed = savePolicyCommandSchema.safeParse({
        definition: validDefinition,
      });
      expect(parsed.success).toBe(false);
    });

    it("accepts a valid command", () => {
      const parsed = savePolicyCommandSchema.safeParse({
        definition: validDefinition,
        changedBy: "admin-1",
        reason: "initial rollout",
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe("accessRequestSchema", () => {
    const validRequest = {
      subject: { userId: "user-1", tenantId: "tenant-1" },
      resource: { type: "tickets", id: "ticket-1", tenantId: "tenant-1" },
      action: "read",
    };

    it("accepts a valid request", () => {
      const parsed = accessRequestSchema.safeParse(validRequest);
      expect(parsed.success).toBe(true);
    });

    it("rejects a request that injects roles", () => {
      const parsed = accessRequestSchema.safeParse({
        ...validRequest,
        subject: { ...validRequest.subject, roles: ["admin"] },
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects a request that injects permissions", () => {
      const parsed = accessRequestSchema.safeParse({
        ...validRequest,
        subject: { ...validRequest.subject, permissions: ["audit:read"] },
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects an empty action", () => {
      const parsed = accessRequestSchema.safeParse({
        ...validRequest,
        action: "",
      });
      expect(parsed.success).toBe(false);
    });

    it("rejects a request without a subject", () => {
      const parsed = accessRequestSchema.safeParse({
        ...validRequest,
        subject: undefined,
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("assignRoleCommandSchema", () => {
    it("accepts an expiry date as ISO string or Date", () => {
      const iso = assignRoleCommandSchema.safeParse({
        tenantId: "tenant-1",
        userId: "user-1",
        roleKey: "checker",
        grantedBy: "admin-1",
        expiresAt: "2026-12-31T00:00:00.000Z",
      });
      expect(iso.success).toBe(true);

      const date = assignRoleCommandSchema.safeParse({
        tenantId: "tenant-1",
        userId: "user-1",
        roleKey: "checker",
        grantedBy: "admin-1",
        expiresAt: new Date("2026-12-31T00:00:00.000Z"),
      });
      expect(date.success).toBe(true);
    });

    it("rejects an invalid expiry date", () => {
      const parsed = assignRoleCommandSchema.safeParse({
        tenantId: "tenant-1",
        userId: "user-1",
        roleKey: "checker",
        grantedBy: "admin-1",
        expiresAt: "not-a-date",
      });
      expect(parsed.success).toBe(false);
    });
  });
});
