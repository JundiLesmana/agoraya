import { describe, it, expect, beforeEach } from "vitest";

import { createRbacModule } from "@/modules/rbac";
import {
  InMemoryPolicyRepository,
  builtinPolicyDefinitions,
} from "@/modules/rbac/policies";
import { InMemoryGrantRepository } from "@/modules/rbac/grants";
import { InMemoryAuditSink } from "@/modules/rbac/audit";
import type { AccessRequest } from "@/modules/rbac/types";

const TENANT_ID = "tenant-1";

interface TestModule {
  readonly rbac: ReturnType<typeof createRbacModule>;
  readonly policyRepository: InMemoryPolicyRepository;
  readonly grantRepository: InMemoryGrantRepository;
  readonly audit: InMemoryAuditSink;
}

describe("modules/rbac policy decision point (integration)", () => {
  let context: TestModule;

  beforeEach(() => {
    const policyRepository = new InMemoryPolicyRepository(
      builtinPolicyDefinitions(),
    );
    const grantRepository = new InMemoryGrantRepository();

    for (const roleKey of ["citizen", "maker", "checker", "superadmin"]) {
      grantRepository.registerRole({
        id: `role-${roleKey}`,
        key: roleKey,
        tenantId: TENANT_ID,
      });
    }
    grantRepository.registerPermission({
      id: "perm-tickets-read",
      key: "tickets:read",
    });
    grantRepository.registerPermission({
      id: "perm-audit-read",
      key: "audit:read",
    });

    const audit = new InMemoryAuditSink();
    const rbac = createRbacModule({
      policyRepository,
      grantRepository,
      audit,
      cacheTtlMs: 30_000,
    });

    context = { rbac, policyRepository, grantRepository, audit };
  });

  async function assignRole(userId: string, roleKey: string): Promise<void> {
    await context.rbac.grantService.assignRole({
      tenantId: TENANT_ID,
      userId,
      roleKey,
      grantedBy: "admin-1",
    });
  }

  function ticketRequest(
    userId: string,
    action: string,
    overrides: Partial<AccessRequest["resource"]> = {},
  ): AccessRequest {
    return {
      subject: { userId, tenantId: TENANT_ID },
      resource: {
        type: "tickets",
        id: "ticket-1",
        tenantId: TENANT_ID,
        ...overrides,
      },
      action,
      requestId: `req-${action}-${userId}`,
    };
  }

  describe("policy evaluation", () => {
    it("allows a checker to update a ticket of the same tenant", async () => {
      await assignRole("checker-1", "checker");

      const decision = await context.rbac.pdp.evaluate(
        ticketRequest("checker-1", "update"),
      );

      expect(decision.allowed).toBe(true);
      expect(decision.reason).toBe("allow_by_policy");
      expect(decision.matchedPolicy?.key).toBe("tickets.update");
    });

    it("denies a citizen to update a ticket", async () => {
      await assignRole("citizen-1", "citizen");

      const decision = await context.rbac.pdp.evaluate(
        ticketRequest("citizen-1", "update"),
      );

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toBe("no_matching_policy");
    });

    it("allows a citizen to read their own ticket but not another one", async () => {
      await assignRole("citizen-1", "citizen");

      const own = await context.rbac.pdp.evaluate(
        ticketRequest("citizen-1", "read", { ownerId: "citizen-1" }),
      );
      expect(own.allowed).toBe(true);
      expect(own.matchedPolicy?.key).toBe("tickets.read.own");

      const other = await context.rbac.pdp.evaluate(
        ticketRequest("citizen-1", "read", { ownerId: "citizen-2" }),
      );
      expect(other.allowed).toBe(false);
    });

    it("denies access to a ticket of another tenant", async () => {
      await assignRole("checker-1", "checker");

      const decision = await context.rbac.pdp.evaluate(
        ticketRequest("checker-1", "read", { tenantId: "tenant-2" }),
      );

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toBe("tenant_mismatch");
    });

    it("requires the granted permission for a permission constrained policy", async () => {
      await assignRole("admin-1", "superadmin");

      const withoutPermission = await context.rbac.pdp.evaluate({
        subject: { userId: "admin-1", tenantId: TENANT_ID },
        resource: { type: "audit", id: "audit-1", tenantId: TENANT_ID },
        action: "read",
      });
      expect(withoutPermission.allowed).toBe(false);

      await context.rbac.grantService.assignPermission({
        tenantId: TENANT_ID,
        roleKey: "superadmin",
        permissionKey: "audit:read",
        grantedBy: "admin-1",
      });

      const withPermission = await context.rbac.pdp.evaluate({
        subject: { userId: "admin-1", tenantId: TENANT_ID },
        resource: { type: "audit", id: "audit-1", tenantId: TENANT_ID },
        action: "read",
      });
      expect(withPermission.allowed).toBe(true);
    });
  });

  describe("policy storage", () => {
    it("stores a saved policy and evaluates it", async () => {
      const saved = await context.rbac.policyService.savePolicy({
        definition: {
          key: "tickets.archive",
          name: "Mengarsipkan laporan",
          effect: "allow",
          priority: 100,
          status: "active",
          roles: ["checker"],
          permissions: [],
          resources: ["tickets"],
          actions: ["archive"],
          conditions: [
            {
              attribute: "resource.tenantId",
              operator: "eq",
              value: "$subject.tenantId",
            },
          ],
          tenantId: null,
        },
        changedBy: "admin-1",
        reason: "initial rollout",
      });

      expect(saved.version).toBe(1);

      const stored =
        await context.rbac.policyService.getPolicyByKey("tickets.archive");
      expect(stored?.name).toBe("Mengarsipkan laporan");

      await assignRole("checker-1", "checker");
      const decision = await context.rbac.pdp.evaluate(
        ticketRequest("checker-1", "archive"),
      );
      expect(decision.allowed).toBe(true);
    });

    it("keeps a version history of a policy", async () => {
      const definition = {
        key: "tickets.read",
        name: "Membaca laporan",
        effect: "allow" as const,
        priority: 100,
        status: "active" as const,
        roles: ["checker"],
        permissions: [],
        resources: ["tickets"],
        actions: ["read"],
        conditions: [],
        tenantId: null,
      };

      await context.rbac.policyService.savePolicy({
        definition,
        changedBy: "admin-1",
      });
      const updated = await context.rbac.policyService.savePolicy({
        definition: { ...definition, name: "Membaca seluruh laporan" },
        changedBy: "admin-2",
        reason: "review",
      });

      expect(updated.version).toBe(2);

      const versions =
        await context.rbac.policyService.listVersions("tickets.read");
      expect(versions).toHaveLength(2);
      expect(versions[0]?.version).toBe(1);
      expect(versions[1]?.version).toBe(2);
      expect(versions[1]?.changedBy).toBe("admin-2");
    });
  });

  describe("cache behaviour", () => {
    it("serves a repeated request from the cache", async () => {
      await assignRole("checker-1", "checker");

      const first = await context.rbac.pdp.evaluate(
        ticketRequest("checker-1", "read"),
      );
      expect(first.cached).toBe(false);

      const second = await context.rbac.pdp.evaluate(
        ticketRequest("checker-1", "read"),
      );
      expect(second.cached).toBe(true);
      expect(second.allowed).toBe(first.allowed);
      expect(second.matchedPolicy?.key).toBe(first.matchedPolicy?.key);
    });

    it("answers a cached evaluation in under 10ms", async () => {
      await assignRole("checker-1", "checker");

      await context.rbac.pdp.evaluate(ticketRequest("checker-1", "read"));

      const started = performance.now();
      const decision = await context.rbac.pdp.evaluate(
        ticketRequest("checker-1", "read"),
      );
      const elapsed = performance.now() - started;

      expect(decision.cached).toBe(true);
      expect(elapsed).toBeLessThan(10);
    });

    it("evaluates different resources separately", async () => {
      await assignRole("citizen-1", "citizen");

      const own = await context.rbac.pdp.evaluate(
        ticketRequest("citizen-1", "read", { ownerId: "citizen-1" }),
      );
      const other = await context.rbac.pdp.evaluate(
        ticketRequest("citizen-1", "read", { ownerId: "citizen-2" }),
      );

      expect(own.cached).toBe(false);
      expect(other.cached).toBe(false);
      expect(own.allowed).toBe(true);
      expect(other.allowed).toBe(false);
    });

    it("invalidates the cached decision of a user when the grant changes", async () => {
      const request = ticketRequest("checker-1", "update");

      const before = await context.rbac.pdp.evaluate(request);
      expect(before.allowed).toBe(false);

      await assignRole("checker-1", "checker");

      const after = await context.rbac.pdp.evaluate(request);
      expect(after.allowed).toBe(true);
      expect(after.cached).toBe(false);
    });

    it("invalidates the cached decision when the role is revoked", async () => {
      await assignRole("checker-1", "checker");

      const before = await context.rbac.pdp.evaluate(
        ticketRequest("checker-1", "update"),
      );
      expect(before.allowed).toBe(true);

      await context.rbac.grantService.revokeRole({
        tenantId: TENANT_ID,
        userId: "checker-1",
        roleKey: "checker",
        revokedBy: "admin-1",
      });

      const after = await context.rbac.pdp.evaluate(
        ticketRequest("checker-1", "update"),
      );
      expect(after.allowed).toBe(false);
    });
  });

  describe("policy updates", () => {
    it("uses the new policy after an update", async () => {
      await assignRole("checker-1", "checker");

      const before = await context.rbac.pdp.evaluate(
        ticketRequest("checker-1", "archive"),
      );
      expect(before.allowed).toBe(false);

      await context.rbac.policyService.savePolicy({
        definition: {
          key: "tickets.archive",
          name: "Mengarsipkan laporan",
          effect: "allow",
          priority: 100,
          status: "active",
          roles: ["checker"],
          permissions: [],
          resources: ["tickets"],
          actions: ["archive"],
          conditions: [],
          tenantId: null,
        },
        changedBy: "admin-1",
      });

      const after = await context.rbac.pdp.evaluate(
        ticketRequest("checker-1", "archive"),
      );
      expect(after.allowed).toBe(true);
      expect(after.matchedPolicy?.key).toBe("tickets.archive");
    });

    it("stops applying a policy after it is archived", async () => {
      await assignRole("checker-1", "checker");

      const before = await context.rbac.pdp.evaluate(
        ticketRequest("checker-1", "update"),
      );
      expect(before.allowed).toBe(true);

      await context.rbac.policyService.archivePolicy(
        "tickets.update",
        "admin-1",
      );

      const after = await context.rbac.pdp.evaluate(
        ticketRequest("checker-1", "update"),
      );
      expect(after.allowed).toBe(false);
    });
  });

  describe("batch evaluation", () => {
    it("evaluates several resources of the same user", async () => {
      await assignRole("citizen-1", "citizen");

      const decisions = await context.rbac.pdp.evaluateBatch([
        ticketRequest("citizen-1", "read", {
          id: "ticket-1",
          ownerId: "citizen-1",
        }),
        ticketRequest("citizen-1", "read", {
          id: "ticket-2",
          ownerId: "citizen-2",
        }),
      ]);

      expect(decisions.map((decision) => decision.allowed)).toEqual([
        true,
        false,
      ]);
    });
  });
});
