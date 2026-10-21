import { describe, it, expect, beforeEach, vi } from "vitest";

import { InMemoryGrantRepository } from "@/modules/rbac/grants/repository";
import { GrantService } from "@/modules/rbac/grants/service";
import type { GrantChangeEvent } from "@/modules/rbac/grants/service";
import { InMemoryAuditSink } from "@/modules/rbac/audit";
import { NotFoundError, ValidationError } from "@/lib/errors";

const TENANT_ID = "tenant-1";
const OTHER_TENANT_ID = "tenant-2";

describe("modules/rbac grants service", () => {
  let repository: InMemoryGrantRepository;
  let audit: InMemoryAuditSink;
  let service: GrantService;
  let now: Date;

  beforeEach(() => {
    repository = new InMemoryGrantRepository();
    repository.registerRole({
      id: "role-checker",
      key: "checker",
      tenantId: TENANT_ID,
    });
    repository.registerRole({
      id: "role-citizen",
      key: "citizen",
      tenantId: TENANT_ID,
    });
    repository.registerRole({
      id: "role-other",
      key: "checker",
      tenantId: OTHER_TENANT_ID,
    });
    repository.registerPermission({
      id: "perm-tickets-read",
      key: "tickets:read",
    });

    audit = new InMemoryAuditSink();
    now = new Date("2026-01-01T00:00:00.000Z");
    service = new GrantService({
      repository,
      audit,
      clock: () => now,
    });
  });

  describe("assignRole", () => {
    it("assigns a role and reflects it in the effective access", async () => {
      const grant = await service.assignRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        grantedBy: "admin-1",
      });

      expect(grant.roleKey).toBe("checker");
      expect(grant.revokedAt).toBeNull();

      const access = await service.getEffectiveAccess("user-1");
      expect(access.roles).toEqual(["checker"]);
      expect(access.permissions).toEqual([]);
    });

    it("resolves the permissions of the assigned role", async () => {
      await repository.upsertPermissionGrant({
        roleId: "role-checker",
        roleKey: "checker",
        permissionId: "perm-tickets-read",
        permissionKey: "tickets:read",
        grantedBy: "admin-1",
        grantedAt: now,
      });

      await service.assignRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        grantedBy: "admin-1",
      });

      const access = await service.getEffectiveAccess("user-1");
      expect(access.permissions).toEqual(["tickets:read"]);
    });

    it("is idempotent for the same user and role", async () => {
      await service.assignRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        grantedBy: "admin-1",
      });
      await service.assignRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        grantedBy: "admin-2",
      });

      const grants = await repository.listRoleGrants("user-1");
      expect(grants).toHaveLength(1);

      const access = await service.getEffectiveAccess("user-1");
      expect(access.roles).toEqual(["checker"]);
    });

    it("rejects an unknown role", async () => {
      await expect(
        service.assignRole({
          tenantId: TENANT_ID,
          userId: "user-1",
          roleKey: "unknown-role",
          grantedBy: "admin-1",
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("rejects an invalid command", async () => {
      await expect(
        service.assignRole({
          tenantId: TENANT_ID,
          userId: "",
          roleKey: "checker",
          grantedBy: "admin-1",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("records an audit event", async () => {
      await service.assignRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        grantedBy: "admin-1",
      });

      const events = audit.byAction("rbac.grant.role_assigned");
      expect(events).toHaveLength(1);
      expect(events[0]?.metadata).toMatchObject({
        userId: "user-1",
        roleKey: "checker",
      });
    });
  });

  describe("revokeRole", () => {
    it("removes the role from the effective access but keeps the grant row", async () => {
      await service.assignRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        grantedBy: "admin-1",
      });

      const revoked = await service.revokeRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        revokedBy: "admin-1",
      });

      expect(revoked).toBe(true);

      const access = await service.getEffectiveAccess("user-1");
      expect(access.roles).toEqual([]);

      const grants = await repository.listRoleGrants("user-1");
      expect(grants).toHaveLength(1);
      expect(grants[0]?.revokedAt).not.toBeNull();
    });

    it("returns false when there is no active grant to revoke", async () => {
      const revoked = await service.revokeRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        revokedBy: "admin-1",
      });

      expect(revoked).toBe(false);
    });

    it("can be re-assigned after a revocation", async () => {
      await service.assignRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        grantedBy: "admin-1",
      });
      await service.revokeRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        revokedBy: "admin-1",
      });
      await service.assignRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        grantedBy: "admin-1",
      });

      const access = await service.getEffectiveAccess("user-1");
      expect(access.roles).toEqual(["checker"]);
    });
  });

  describe("getEffectiveAccess", () => {
    it("ignores expired grants", async () => {
      await service.assignRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        grantedBy: "admin-1",
        expiresAt: new Date("2025-12-31T00:00:00.000Z"),
      });

      const access = await service.getEffectiveAccess("user-1");
      expect(access.roles).toEqual([]);
    });

    it("keeps grants that expire in the future", async () => {
      await service.assignRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        grantedBy: "admin-1",
        expiresAt: new Date("2026-06-30T00:00:00.000Z"),
      });

      const access = await service.getEffectiveAccess("user-1");
      expect(access.roles).toEqual(["checker"]);
    });

    it("ignores grants from another tenant", async () => {
      await service.assignRole({
        tenantId: OTHER_TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        grantedBy: "admin-1",
      });

      const scoped = await service.getEffectiveAccess("user-1", {
        tenantId: TENANT_ID,
      });
      expect(scoped.roles).toEqual([]);

      const unscoped = await service.getEffectiveAccess("user-1");
      expect(unscoped.roles).toEqual(["checker"]);
    });

    it("returns empty access for a user without grants", async () => {
      const access = await service.getEffectiveAccess("user-unknown");
      expect(access.roles).toEqual([]);
      expect(access.permissions).toEqual([]);
    });
  });

  describe("permissions", () => {
    it("grants and revokes a permission of a role", async () => {
      await service.assignPermission({
        tenantId: TENANT_ID,
        roleKey: "checker",
        permissionKey: "tickets:read",
        grantedBy: "admin-1",
      });

      await service.assignRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        grantedBy: "admin-1",
      });

      let access = await service.getEffectiveAccess("user-1");
      expect(access.permissions).toEqual(["tickets:read"]);

      const revoked = await service.revokePermission({
        tenantId: TENANT_ID,
        roleKey: "checker",
        permissionKey: "tickets:read",
        revokedBy: "admin-1",
      });
      expect(revoked).toBe(true);

      access = await service.getEffectiveAccess("user-1");
      expect(access.permissions).toEqual([]);
    });

    it("rejects an unknown permission", async () => {
      await expect(
        service.assignPermission({
          tenantId: TENANT_ID,
          roleKey: "checker",
          permissionKey: "unknown:permission",
          grantedBy: "admin-1",
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("change notification", () => {
    it("emits a user event when a role is assigned or revoked", async () => {
      const events: GrantChangeEvent[] = [];
      service.onChange((event) => events.push(event));

      await service.assignRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        grantedBy: "admin-1",
      });
      await service.revokeRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        revokedBy: "admin-1",
      });

      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({ kind: "user", userId: "user-1" });
      expect(events[1]).toEqual({ kind: "user", userId: "user-1" });
    });

    it("emits a role event with the affected users when a permission changes", async () => {
      await service.assignRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        grantedBy: "admin-1",
      });

      const events: GrantChangeEvent[] = [];
      service.onChange((event) => events.push(event));

      await service.assignPermission({
        tenantId: TENANT_ID,
        roleKey: "checker",
        permissionKey: "tickets:read",
        grantedBy: "admin-1",
      });

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        kind: "role",
        roleId: "role-checker",
        userIds: ["user-1"],
      });
    });

    it("stops notifying after unsubscribe", async () => {
      const listener = vi.fn();
      const unsubscribe = service.onChange(listener);
      unsubscribe();

      await service.assignRole({
        tenantId: TENANT_ID,
        userId: "user-1",
        roleKey: "checker",
        grantedBy: "admin-1",
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
