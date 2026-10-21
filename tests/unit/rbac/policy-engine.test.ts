import { describe, it, expect } from "vitest";

import {
  evaluatePolicies,
  matchesPattern,
  policyMatchesSubject,
  resolveAttribute,
} from "@/modules/rbac/policies/engine";
import type {
  EffectiveSubject,
  ResourceContext,
  StoredPolicy,
} from "@/modules/rbac/types";

const TENANT_ID = "tenant-1";
const OTHER_TENANT_ID = "tenant-2";

function policy(overrides: Partial<StoredPolicy> = {}): StoredPolicy {
  return {
    id: "policy-1",
    key: "tickets.read",
    name: "Membaca laporan",
    effect: "allow",
    priority: 100,
    status: "active",
    roles: ["checker"],
    permissions: [],
    resources: ["tickets"],
    actions: ["read"],
    conditions: [],
    tenantId: null,
    version: 1,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function subject(overrides: Partial<EffectiveSubject> = {}): EffectiveSubject {
  return {
    userId: "user-1",
    tenantId: TENANT_ID,
    roles: ["checker"],
    permissions: [],
    ...overrides,
  };
}

function resource(overrides: Partial<ResourceContext> = {}): ResourceContext {
  return {
    type: "tickets",
    tenantId: TENANT_ID,
    ...overrides,
  };
}

describe("modules/rbac policies engine", () => {
  describe("matchesPattern", () => {
    it("matches everything with *", () => {
      expect(matchesPattern("*", "anything")).toBe(true);
    });

    it("matches a prefix wildcard", () => {
      expect(matchesPattern("audit:*", "audit:events")).toBe(true);
      expect(matchesPattern("audit:*", "tickets")).toBe(false);
    });

    it("matches exact values only", () => {
      expect(matchesPattern("tickets", "tickets")).toBe(true);
      expect(matchesPattern("tickets", "tickets:read")).toBe(false);
    });
  });

  describe("resolveAttribute", () => {
    it("resolves subject, resource, and action attributes", () => {
      const s = subject({ attributes: { region: "bandung" } });
      const r = resource({
        id: "ticket-1",
        ownerId: "user-1",
        status: "submitted",
      });

      expect(resolveAttribute(s, r, "read", "subject.id")).toBe("user-1");
      expect(resolveAttribute(s, r, "read", "subject.tenantId")).toBe(
        TENANT_ID,
      );
      expect(resolveAttribute(s, r, "read", "subject.roles")).toBe("checker");
      expect(resolveAttribute(s, r, "read", "subject.attributes.region")).toBe(
        "bandung",
      );
      expect(resolveAttribute(s, r, "read", "resource.id")).toBe("ticket-1");
      expect(resolveAttribute(s, r, "read", "resource.ownerId")).toBe("user-1");
      expect(resolveAttribute(s, r, "read", "resource.status")).toBe(
        "submitted",
      );
      expect(resolveAttribute(s, r, "read", "action")).toBe("read");
    });

    it("returns undefined for unknown attributes", () => {
      const s = subject();
      const r = resource();
      expect(resolveAttribute(s, r, "read", "subject.unknown")).toBeUndefined();
      expect(
        resolveAttribute(s, r, "read", "resource.attributes.missing"),
      ).toBeUndefined();
      expect(resolveAttribute(s, r, "read", "unknown.x")).toBeUndefined();
    });
  });

  describe("evaluatePolicies", () => {
    it("allows a request that matches an allow policy", () => {
      const result = evaluatePolicies({
        policies: [policy()],
        subject: subject(),
        resource: resource(),
        action: "read",
      });

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe("allow_by_policy");
      expect(result.matchedPolicy?.key).toBe("tickets.read");
      expect(result.matchedPolicy?.version).toBe(1);
    });

    it("denies by default when no policy matches", () => {
      const result = evaluatePolicies({
        policies: [policy()],
        subject: subject(),
        resource: resource(),
        action: "delete",
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("no_matching_policy");
      expect(result.matchedPolicy).toBeNull();
    });

    it("denies a request whose role is not listed in the policy", () => {
      const result = evaluatePolicies({
        policies: [policy({ roles: ["admin"] })],
        subject: subject(),
        resource: resource(),
        action: "read",
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("no_matching_policy");
    });

    it("denies when the subject does not hold the required permission", () => {
      const result = evaluatePolicies({
        policies: [policy({ permissions: ["audit:read"] })],
        subject: subject(),
        resource: resource(),
        action: "read",
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("no_matching_policy");
    });

    it("allows when the subject holds the required permission", () => {
      const result = evaluatePolicies({
        policies: [policy({ permissions: ["audit:read"] })],
        subject: subject({ permissions: ["audit:read"] }),
        resource: resource(),
        action: "read",
      });

      expect(result.allowed).toBe(true);
    });

    it("denies when the resource belongs to another tenant", () => {
      const result = evaluatePolicies({
        policies: [policy()],
        subject: subject(),
        resource: resource({ tenantId: OTHER_TENANT_ID }),
        action: "read",
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("tenant_mismatch");
    });

    it("lets an explicit deny policy override an allow policy", () => {
      const result = evaluatePolicies({
        policies: [
          policy({ id: "policy-allow", key: "tickets.read", priority: 10 }),
          policy({
            id: "policy-deny",
            key: "tickets.read.deny",
            effect: "deny",
            priority: 500,
          }),
        ],
        subject: subject(),
        resource: resource(),
        action: "read",
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("deny_by_policy");
      expect(result.matchedPolicy?.key).toBe("tickets.read.deny");
    });

    it("ignores policies that are not active", () => {
      for (const status of ["draft", "archived"] as const) {
        const result = evaluatePolicies({
          policies: [policy({ status })],
          subject: subject(),
          resource: resource(),
          action: "read",
        });

        expect(result.allowed).toBe(false);
        expect(result.reason).toBe("no_matching_policy");
      }
    });

    it("ignores policies scoped to another tenant", () => {
      const result = evaluatePolicies({
        policies: [policy({ tenantId: OTHER_TENANT_ID })],
        subject: subject(),
        resource: resource(),
        action: "read",
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("no_matching_policy");
    });

    it("applies tenant-scoped policies to their own tenant", () => {
      const result = evaluatePolicies({
        policies: [policy({ tenantId: TENANT_ID })],
        subject: subject(),
        resource: resource(),
        action: "read",
      });

      expect(result.allowed).toBe(true);
    });

    it("matches resource and action patterns", () => {
      const result = evaluatePolicies({
        policies: [policy({ resources: ["audit:*"], actions: ["*"] })],
        subject: subject(),
        resource: resource({ type: "audit:events" }),
        action: "read",
      });

      expect(result.allowed).toBe(true);
    });

    it("evaluates attribute conditions against the subject", () => {
      const sameTenant = policy({
        conditions: [
          {
            attribute: "resource.tenantId",
            operator: "eq",
            value: "$subject.tenantId",
          },
        ],
      });

      expect(
        evaluatePolicies({
          policies: [sameTenant],
          subject: subject(),
          resource: resource(),
          action: "read",
        }).allowed,
      ).toBe(true);

      expect(
        evaluatePolicies({
          policies: [sameTenant],
          subject: subject(),
          resource: resource({ tenantId: undefined }),
          action: "read",
        }).allowed,
      ).toBe(false);
    });

    it("enforces ownership conditions", () => {
      const owned = policy({
        roles: ["citizen"],
        conditions: [
          {
            attribute: "resource.ownerId",
            operator: "eq",
            value: "$subject.id",
          },
        ],
      });

      expect(
        evaluatePolicies({
          policies: [owned],
          subject: subject({ roles: ["citizen"] }),
          resource: resource({ ownerId: "user-1" }),
          action: "read",
        }).allowed,
      ).toBe(true);

      expect(
        evaluatePolicies({
          policies: [owned],
          subject: subject({ roles: ["citizen"] }),
          resource: resource({ ownerId: "user-2" }),
          action: "read",
        }).allowed,
      ).toBe(false);
    });

    it("fails closed when a condition attribute cannot be resolved", () => {
      const result = evaluatePolicies({
        policies: [
          policy({
            conditions: [
              {
                attribute: "resource.status",
                operator: "eq",
                value: "resolved",
              },
            ],
          }),
        ],
        subject: subject(),
        resource: resource(),
        action: "read",
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("no_matching_policy");
    });

    it("fails closed when an attribute reference cannot be resolved", () => {
      const result = evaluatePolicies({
        policies: [
          policy({
            conditions: [
              {
                attribute: "resource.tenantId",
                operator: "eq",
                value: "$subject.attributes.tenant",
              },
            ],
          }),
        ],
        subject: subject(),
        resource: resource(),
        action: "read",
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("no_matching_policy");
    });

    it("supports the not_in operator", () => {
      const result = evaluatePolicies({
        policies: [
          policy({
            conditions: [
              {
                attribute: "resource.status",
                operator: "not_in",
                value: ["closed"],
              },
            ],
          }),
        ],
        subject: subject(),
        resource: resource({ status: "submitted" }),
        action: "read",
      });

      expect(result.allowed).toBe(true);
    });

    it("denies when a not_in member cannot be resolved", () => {
      const result = evaluatePolicies({
        policies: [
          policy({
            conditions: [
              {
                attribute: "resource.status",
                operator: "not_in",
                value: ["$resource.unknown"],
              },
            ],
          }),
        ],
        subject: subject(),
        resource: resource({ status: "submitted" }),
        action: "read",
      });

      expect(result.allowed).toBe(false);
    });

    it("reports the highest priority matching allow policy", () => {
      const result = evaluatePolicies({
        policies: [
          policy({ id: "low", key: "tickets.read.low", priority: 900 }),
          policy({ id: "high", key: "tickets.read.high", priority: 10 }),
        ],
        subject: subject(),
        resource: resource(),
        action: "read",
      });

      expect(result.matchedPolicy?.key).toBe("tickets.read.high");
    });
  });

  describe("policyMatchesSubject", () => {
    it("requires every condition to hold", () => {
      const p = policy({
        conditions: [
          {
            attribute: "resource.tenantId",
            operator: "eq",
            value: "$subject.tenantId",
          },
          {
            attribute: "resource.ownerId",
            operator: "eq",
            value: "$subject.id",
          },
        ],
      });

      expect(
        policyMatchesSubject(
          p,
          subject(),
          resource({ ownerId: "user-1" }),
          "read",
        ),
      ).toBe(true);
      expect(
        policyMatchesSubject(
          p,
          subject(),
          resource({ ownerId: "someone-else" }),
          "read",
        ),
      ).toBe(false);
    });
  });
});
