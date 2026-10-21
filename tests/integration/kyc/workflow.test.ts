import { describe, it, expect, beforeEach } from "vitest";

import { createKycModule } from "@/modules/kyc";
import { InMemoryKycRepository } from "@/modules/kyc/roster/repository";
import { InMemoryAuditSink } from "@/modules/rbac/audit";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";

const TENANT_ID = "00000000-0000-0000-0000-000000000001";
const USER_ID = "00000000-0000-0000-0000-000000000010";
const SUBMITTER_ID = "00000000-0000-0000-0000-000000000020";
const APPROVER_1 = "00000000-0000-0000-0000-000000000030";
const APPROVER_2 = "00000000-0000-0000-0000-000000000031";
const NIK = "3201010101010001";
const NAME = "Budi Santoso (SIMULATED)";

describe("modules/kyc full workflow (integration)", () => {
  let repository: InMemoryKycRepository;
  let audit: InMemoryAuditSink;
  let kyc: ReturnType<typeof createKycModule>;
  let now: Date;

  beforeEach(() => {
    repository = new InMemoryKycRepository();
    audit = new InMemoryAuditSink();
    now = new Date("2026-01-01T00:00:00.000Z");
    kyc = createKycModule({ repository, audit, clock: () => now });
  });

  describe("AC: given a citizen is added to roster, when created, then status is pending", () => {
    it("creates a roster entry with pending status", async () => {
      const entry = await kyc.roster.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      expect(entry.status).toBe("pending");
    });
  });

  describe("AC: given a citizen needs verification, when first approver approves, then status is partially_approved", () => {
    it("transitions to partially_approved after first approval", async () => {
      const entry = await kyc.roster.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      const outcome = await kyc.dualApproval.submitApproval({
        tenantId: TENANT_ID,
        rosterId: entry.id,
        approverId: APPROVER_1,
        decision: "approved",
      });

      expect(outcome.entry.status).toBe("partially_approved");
      expect(outcome.approval.approvalSlot).toBe(1);
      expect(outcome.approval.decision).toBe("approved");
    });
  });

  describe("AC: given a citizen is partially approved, when second approver approves, then status is verified", () => {
    it("transitions to verified after second approval", async () => {
      const entry = await kyc.roster.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      await kyc.dualApproval.submitApproval({
        tenantId: TENANT_ID,
        rosterId: entry.id,
        approverId: APPROVER_1,
        decision: "approved",
      });

      const outcome = await kyc.dualApproval.submitApproval({
        tenantId: TENANT_ID,
        rosterId: entry.id,
        approverId: APPROVER_2,
        decision: "approved",
      });

      expect(outcome.entry.status).toBe("verified");
      expect(outcome.approval.approvalSlot).toBe(2);
      expect(outcome.entry.expiresAt).not.toBeNull();
    });
  });

  describe("AC: given a citizen KYC expires, when checked, then status is expired", () => {
    it("expires a verified entry on demand", async () => {
      const entry = await kyc.roster.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      await kyc.dualApproval.submitApproval({
        tenantId: TENANT_ID,
        rosterId: entry.id,
        approverId: APPROVER_1,
        decision: "approved",
      });
      await kyc.dualApproval.submitApproval({
        tenantId: TENANT_ID,
        rosterId: entry.id,
        approverId: APPROVER_2,
        decision: "approved",
      });

      const expired = await kyc.lifecycle.expireKyc({
        tenantId: TENANT_ID,
        rosterId: entry.id,
        triggeredBy: "admin-1",
      });

      expect(expired.status).toBe("expired");
    });

    it("detects stale verified entries and marks them expired", async () => {
      // Create and fully verify an entry.
      const entry = await kyc.roster.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      await kyc.dualApproval.submitApproval({
        tenantId: TENANT_ID,
        rosterId: entry.id,
        approverId: APPROVER_1,
        decision: "approved",
      });
      await kyc.dualApproval.submitApproval({
        tenantId: TENANT_ID,
        rosterId: entry.id,
        approverId: APPROVER_2,
        decision: "approved",
      });

      // Advance the clock past the expiry.
      const future = new Date(now.getTime() + 400 * 24 * 60 * 60 * 1000);
      const futureKyc = createKycModule({
        repository,
        audit,
        clock: () => future,
      });

      const expired = await futureKyc.lifecycle.checkAndExpireStale(TENANT_ID);
      expect(expired).toHaveLength(1);
      expect(expired[0]?.status).toBe("expired");
    });
  });

  describe("AC: given dual-approval workflow, when same person tries to approve twice, then rejected", () => {
    it("throws ForbiddenError when the same approver submits twice", async () => {
      const entry = await kyc.roster.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      await kyc.dualApproval.submitApproval({
        tenantId: TENANT_ID,
        rosterId: entry.id,
        approverId: APPROVER_1,
        decision: "approved",
      });

      await expect(
        kyc.dualApproval.submitApproval({
          tenantId: TENANT_ID,
          rosterId: entry.id,
          approverId: APPROVER_1, // same approver
          decision: "approved",
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("records a rejected decision and transitions to rejected status", async () => {
      const entry = await kyc.roster.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      const outcome = await kyc.dualApproval.submitApproval({
        tenantId: TENANT_ID,
        rosterId: entry.id,
        approverId: APPROVER_1,
        decision: "rejected",
        reason: "Incomplete information",
      });

      expect(outcome.entry.status).toBe("rejected");
      expect(outcome.approval.decision).toBe("rejected");
      expect(outcome.approval.reason).toBe("Incomplete information");
    });
  });

  describe("AC: given lifecycle transition, when invalid transition attempted, then error is returned", () => {
    it("cannot expire a pending entry", async () => {
      const entry = await kyc.roster.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      await expect(
        kyc.lifecycle.expireKyc({
          tenantId: TENANT_ID,
          rosterId: entry.id,
          triggeredBy: "admin-1",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("cannot approve a rejected entry", async () => {
      const entry = await kyc.roster.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      await kyc.dualApproval.submitApproval({
        tenantId: TENANT_ID,
        rosterId: entry.id,
        approverId: APPROVER_1,
        decision: "rejected",
      });

      await expect(
        kyc.dualApproval.submitApproval({
          tenantId: TENANT_ID,
          rosterId: entry.id,
          approverId: APPROVER_2,
          decision: "approved",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("cannot approve a verified entry", async () => {
      const entry = await kyc.roster.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      await kyc.dualApproval.submitApproval({
        tenantId: TENANT_ID,
        rosterId: entry.id,
        approverId: APPROVER_1,
        decision: "approved",
      });
      await kyc.dualApproval.submitApproval({
        tenantId: TENANT_ID,
        rosterId: entry.id,
        approverId: APPROVER_2,
        decision: "approved",
      });

      const thirdApprover = "00000000-0000-0000-0000-000000000032";
      await expect(
        kyc.dualApproval.submitApproval({
          tenantId: TENANT_ID,
          rosterId: entry.id,
          approverId: thirdApprover,
          decision: "approved",
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("security: unauthorized access and cross-tenant isolation", () => {
    it("cannot retrieve a roster entry from another tenant", async () => {
      const entry = await kyc.roster.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      await expect(
        kyc.roster.getRosterEntry({
          tenantId: "00000000-0000-0000-0000-000000000099",
          rosterId: entry.id,
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("cannot submit an approval for an entry in another tenant", async () => {
      const entry = await kyc.roster.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      await expect(
        kyc.dualApproval.submitApproval({
          tenantId: "00000000-0000-0000-0000-000000000099",
          rosterId: entry.id,
          approverId: APPROVER_1,
          decision: "approved",
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("cannot expire an entry from another tenant", async () => {
      const entry = await kyc.roster.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      await kyc.dualApproval.submitApproval({
        tenantId: TENANT_ID,
        rosterId: entry.id,
        approverId: APPROVER_1,
        decision: "approved",
      });
      await kyc.dualApproval.submitApproval({
        tenantId: TENANT_ID,
        rosterId: entry.id,
        approverId: APPROVER_2,
        decision: "approved",
      });

      await expect(
        kyc.lifecycle.expireKyc({
          tenantId: "00000000-0000-0000-0000-000000000099",
          rosterId: entry.id,
          triggeredBy: "attacker",
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it("audit trail captures all kyc mutations", async () => {
      const entry = await kyc.roster.addToRoster({
        tenantId: TENANT_ID,
        userId: USER_ID,
        nik: NIK,
        name: NAME,
        submittedBy: SUBMITTER_ID,
      });

      await kyc.dualApproval.submitApproval({
        tenantId: TENANT_ID,
        rosterId: entry.id,
        approverId: APPROVER_1,
        decision: "approved",
      });
      await kyc.dualApproval.submitApproval({
        tenantId: TENANT_ID,
        rosterId: entry.id,
        approverId: APPROVER_2,
        decision: "approved",
      });
      await kyc.lifecycle.expireKyc({
        tenantId: TENANT_ID,
        rosterId: entry.id,
        triggeredBy: "admin-1",
      });

      expect(audit.byAction("kyc.roster.added")).toHaveLength(1);
      expect(audit.byAction("kyc.approval.submitted")).toHaveLength(2);
      expect(audit.byAction("kyc.lifecycle.expired")).toHaveLength(1);
    });
  });
});
