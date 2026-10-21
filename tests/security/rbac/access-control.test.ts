import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { createRbacModule } from "@/modules/rbac";
import {
  InMemoryPolicyRepository,
  builtinPolicyDefinitions,
} from "@/modules/rbac/policies";
import { InMemoryGrantRepository } from "@/modules/rbac/grants";
import { InMemoryAuditSink } from "@/modules/rbac/audit";
import type { AuditSink } from "@/modules/rbac/audit";
import { logger } from "@/lib/logger";

const TENANT_ID = "tenant-1";
const OTHER_TENANT_ID = "tenant-2";

describe("modules/rbac access control (security)", () => {
  let policyRepository: InMemoryPolicyRepository;
  let grantRepository: InMemoryGrantRepository;
  let audit: InMemoryAuditSink;
  let rbac: ReturnType<typeof createRbacModule>;

  beforeEach(() => {
    policyRepository = new InMemoryPolicyRepository(builtinPolicyDefinitions());
    grantRepository = new InMemoryGrantRepository();

    for (const roleKey of ["citizen", "checker", "superadmin"]) {
      grantRepository.registerRole({
        id: `role-${roleKey}`,
        key: roleKey,
        tenantId: TENANT_ID,
      });
      grantRepository.registerRole({
        id: `role-other-${roleKey}`,
        key: roleKey,
        tenantId: OTHER_TENANT_ID,
      });
    }

    audit = new InMemoryAuditSink();
    rbac = createRbacModule({
      policyRepository,
      grantRepository,
      audit,
      cacheTtlMs: 30_000,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function assignRole(
    userId: string,
    roleKey: string,
    tenantId = TENANT_ID,
  ): Promise<void> {
    await rbac.grantService.assignRole({
      tenantId,
      userId,
      roleKey,
      grantedBy: "admin-1",
    });
  }

  const ticketRequest = {
    subject: { userId: "user-1", tenantId: TENANT_ID },
    resource: { type: "tickets", id: "ticket-1", tenantId: TENANT_ID },
    action: "read",
  } as const;

  describe("unauthorized access", () => {
    it("denies a user without any grant", async () => {
      const decision = await rbac.pdp.evaluate(ticketRequest);

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toBe("no_matching_policy");
    });

    it("denies every action that is not covered by a policy", async () => {
      await assignRole("user-1", "citizen");

      const decision = await rbac.pdp.evaluate({
        ...ticketRequest,
        action: "delete",
      });

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toBe("no_matching_policy");
    });

    it("denies a request with an invalid payload", async () => {
      const decision = await rbac.pdp.evaluate({
        subject: { userId: "", tenantId: TENANT_ID },
        resource: { type: "tickets" },
        action: "",
      });

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toBe("invalid_request");
    });
  });

  describe("privilege escalation", () => {
    it("ignores roles injected into the request payload", async () => {
      const decision = await rbac.pdp.evaluate({
        subject: {
          userId: "user-1",
          tenantId: TENANT_ID,
          roles: ["superadmin"],
          permissions: ["audit:read"],
        } as never,
        resource: { type: "tickets", id: "ticket-1", tenantId: TENANT_ID },
        action: "update",
      });

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toBe("invalid_request");
    });

    it("does not widen the access of a user with a grant from another tenant", async () => {
      await assignRole("user-1", "superadmin", OTHER_TENANT_ID);

      const decision = await rbac.pdp.evaluate({
        subject: { userId: "user-1", tenantId: TENANT_ID },
        resource: { type: "tickets", id: "ticket-1", tenantId: TENANT_ID },
        action: "update",
      });

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toBe("no_matching_policy");
    });

    it("drops the cached decision when a role is revoked", async () => {
      await assignRole("user-1", "checker");

      const before = await rbac.pdp.evaluate({
        ...ticketRequest,
        action: "update",
      });
      expect(before.allowed).toBe(true);

      await rbac.grantService.revokeRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        revokedBy: "admin-1",
      });

      const after = await rbac.pdp.evaluate({
        ...ticketRequest,
        action: "update",
      });
      expect(after.allowed).toBe(false);
    });

    it("ignores an expired grant", async () => {
      await rbac.grantService.assignRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        grantedBy: "admin-1",
        expiresAt: new Date(Date.now() - 60_000),
      });

      const decision = await rbac.pdp.evaluate({
        ...ticketRequest,
        action: "update",
      });

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toBe("no_matching_policy");
    });
  });

  describe("policy bypass attempts", () => {
    it("denies a request for a resource of another tenant", async () => {
      await assignRole("user-1", "checker");

      const decision = await rbac.pdp.evaluate({
        subject: { userId: "user-1", tenantId: TENANT_ID },
        resource: {
          type: "tickets",
          id: "ticket-1",
          tenantId: OTHER_TENANT_ID,
        },
        action: "read",
      });

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toBe("tenant_mismatch");
    });

    it("fails closed when the tenant of the resource is unknown", async () => {
      await assignRole("user-1", "checker");

      const decision = await rbac.pdp.evaluate({
        subject: { userId: "user-1", tenantId: TENANT_ID },
        resource: { type: "tickets", id: "ticket-1" },
        action: "read",
      });

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toBe("no_matching_policy");
    });

    it("denies a resource type that no policy covers", async () => {
      await assignRole("user-1", "superadmin");

      const decision = await rbac.pdp.evaluate({
        subject: { userId: "user-1", tenantId: TENANT_ID },
        resource: { type: "secrets", id: "secret-1", tenantId: TENANT_ID },
        action: "read",
      });

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toBe("no_matching_policy");
    });

    it("denies when the ownership condition cannot be satisfied", async () => {
      await assignRole("user-1", "citizen");

      const decision = await rbac.pdp.evaluate({
        subject: { userId: "user-1", tenantId: TENANT_ID },
        resource: { type: "tickets", id: "ticket-1", tenantId: TENANT_ID },
        action: "read",
      });

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toBe("no_matching_policy");
    });

    it("does not let an archived policy allow access", async () => {
      await assignRole("user-1", "checker");

      const before = await rbac.pdp.evaluate({
        ...ticketRequest,
        action: "update",
      });
      expect(before.allowed).toBe(true);

      await rbac.policyService.archivePolicy("tickets.update", "admin-1");

      const after = await rbac.pdp.evaluate({
        ...ticketRequest,
        action: "update",
      });
      expect(after.allowed).toBe(false);
    });
  });

  describe("audit trail", () => {
    it("records an audit event for every decision", async () => {
      await assignRole("user-1", "checker");

      await rbac.pdp.evaluate({ ...ticketRequest, action: "update" });
      await rbac.pdp.evaluate({ ...ticketRequest, action: "delete" });

      expect(audit.byAction("rbac.access.granted")).toHaveLength(1);
      expect(audit.byAction("rbac.access.denied")).toHaveLength(1);

      const denied = audit.byAction("rbac.access.denied")[0];
      expect(denied?.metadata).toMatchObject({
        userId: "user-1",
        tenantId: TENANT_ID,
        action: "delete",
        reason: "no_matching_policy",
      });
    });

    it("records the matched policy of an allowed decision", async () => {
      await assignRole("user-1", "checker");

      await rbac.pdp.evaluate({ ...ticketRequest, action: "update" });

      const granted = audit.byAction("rbac.access.granted")[0];
      expect(granted?.metadata).toMatchObject({
        policyKey: "tickets.update",
        policyVersion: 1,
      });
    });

    it("raises a security event for a denied access", async () => {
      const warn = vi.spyOn(logger, "warn");

      await rbac.pdp.evaluate(ticketRequest);

      const denied = warn.mock.calls.find(
        (call) => call[0] === "rbac.access.denied",
      );
      expect(denied).toBeDefined();
      expect(denied?.[1]).toMatchObject({
        userId: "user-1",
        action: "read",
        reason: "no_matching_policy",
      });
    });

    it("records the grant changes in the audit trail", async () => {
      await assignRole("user-1", "checker");
      await rbac.grantService.revokeRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        revokedBy: "admin-1",
      });

      expect(audit.byAction("rbac.grant.role_assigned")).toHaveLength(1);
      expect(audit.byAction("rbac.grant.role_revoked")).toHaveLength(1);
    });

    it("denies the access when the audit trail cannot be written", async () => {
      const failingSink: AuditSink = {
        async record(): Promise<void> {
          throw new Error("audit storage unavailable");
        },
      };

      await assignRole("user-1", "checker");

      const failing = createRbacModule({
        policyRepository,
        grantRepository,
        audit: failingSink,
      });

      const decision = await failing.pdp.evaluate({
        ...ticketRequest,
        action: "update",
      });

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toBe("audit_unavailable");
    });
  });
});
