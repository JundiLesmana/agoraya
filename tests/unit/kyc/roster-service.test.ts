import { describe, it, expect, beforeEach } from "vitest";

import { InMemoryKycRepository } from "@/modules/kyc/roster/repository";
import { RosterService } from "@/modules/kyc/roster/service";
import { InMemoryAuditSink } from "@/modules/rbac/audit";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";

const TENANT_ID = "00000000-0000-0000-0000-000000000001";
const USER_ID = "00000000-0000-0000-0000-000000000010";
const SUBMITTER_ID = "00000000-0000-0000-0000-000000000020";
const NIK = "3201010101010001";
const NAME = "Budi Santoso (SIMULATED)";

describe("modules/kyc roster service", () => {
  let repository: InMemoryKycRepository;
  let audit: InMemoryAuditSink;
  let service: RosterService;
  let now: Date;

  beforeEach(() => {
    repository = new InMemoryKycRepository();
    audit = new InMemoryAuditSink();
    now = new Date("2026-01-01T00:00:00.000Z");
    service = new RosterService({ repository, audit, clock: () => now });
  });

  describe("addToRoster", () => {
    it("creates a new entry with pending status", async () => {
      const entry = await service.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      expect(entry.status).toBe("pending");
      expect(entry.tenantId).toBe(TENANT_ID);
      expect(entry.userId).toBe(USER_ID);
      expect(entry.name).toBe(NAME);
      expect(entry.expiresAt).toBeNull();
    });

    it("stores a hash of the NIK, not the raw value", async () => {
      const entry = await service.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      expect(entry.nikHash).not.toBe(NIK);
      expect(entry.nikHash).toHaveLength(64); // SHA-256 hex
    });

    it("records an audit event for the addition", async () => {
      await service.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      const events = audit.byAction("kyc.roster.added");
      expect(events).toHaveLength(1);
      expect(events[0]?.metadata).toMatchObject({
        tenantId: TENANT_ID,
        userId: USER_ID,
        name: NAME,
      });
    });

    it("rejects a duplicate entry for the same user/tenant pair", async () => {
      await service.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      await expect(
        service.addToRoster({
          tenantId: TENANT_ID,
          userId: USER_ID,
          nik: NIK,
          name: "Another Name",
          submittedBy: SUBMITTER_ID,
        }),
      ).rejects.toThrow(ConflictError);
    });

    it("rejects an invalid NIK format", async () => {
      await expect(
        service.addToRoster({
          tenantId: TENANT_ID,
          userId: USER_ID,
          nik: "not-a-nik",
          name: NAME,
          submittedBy: SUBMITTER_ID,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("allows two different users in the same tenant", async () => {
      const user2 = "00000000-0000-0000-0000-000000000011";
      const entry1 = await service.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });
      const entry2 = await service.addToRoster({
        tenantId: TENANT_ID,
        userId: user2,
        nik: "3201010202020002",
        name: "Siti Aminah (SIMULATED)",
        submittedBy: SUBMITTER_ID,
      });

      expect(entry1.id).not.toBe(entry2.id);
    });
  });

  describe("getRosterEntry", () => {
    it("returns an existing entry scoped to the tenant", async () => {
      const added = await service.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      const retrieved = await service.getRosterEntry({
        tenantId: TENANT_ID,
        rosterId: added.id,
      });

      expect(retrieved.id).toBe(added.id);
    });

    it("throws NotFoundError for an unknown entry", async () => {
      await expect(
        service.getRosterEntry({
          tenantId: TENANT_ID,
          rosterId: "00000000-0000-0000-0000-000000000099",
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when the tenant does not match", async () => {
      const added = await service.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      await expect(
        service.getRosterEntry({
          tenantId: "00000000-0000-0000-0000-000000000099",
          rosterId: added.id,
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("listRoster", () => {
    it("returns an empty page when no entries exist", async () => {
      const page = await service.listRoster({
        tenantId: TENANT_ID,
        limit: 20,
        offset: 0,
      });

      expect(page.items).toHaveLength(0);
      expect(page.total).toBe(0);
    });

    it("returns all entries for the tenant", async () => {
      await service.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      const page = await service.listRoster({
        tenantId: TENANT_ID,
        limit: 20,
        offset: 0,
      });

      expect(page.items).toHaveLength(1);
      expect(page.total).toBe(1);
    });

    it("filters by status when provided", async () => {
      await service.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      const pendingPage = await service.listRoster({
        tenantId: TENANT_ID,
        status: "pending",
        limit: 20,
        offset: 0,
      });
      expect(pendingPage.items).toHaveLength(1);

      const verifiedPage = await service.listRoster({
        tenantId: TENANT_ID,
        status: "verified",
        limit: 20,
        offset: 0,
      });
      expect(verifiedPage.items).toHaveLength(0);
    });

    it("paginates results correctly", async () => {
      const user2 = "00000000-0000-0000-0000-000000000011";
      await service.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });
      await service.addToRoster({
        tenantId: TENANT_ID,
        userId: user2,
        nik: "3201010202020002",
        name: "Siti Aminah (SIMULATED)",
        submittedBy: SUBMITTER_ID,
      });

      const page1 = await service.listRoster({
        tenantId: TENANT_ID,
        limit: 1,
        offset: 0,
      });
      const page2 = await service.listRoster({
        tenantId: TENANT_ID,
        limit: 1,
        offset: 1,
      });

      expect(page1.items).toHaveLength(1);
      expect(page2.items).toHaveLength(1);
      expect(page1.items[0]?.id).not.toBe(page2.items[0]?.id);
    });
  });
});
