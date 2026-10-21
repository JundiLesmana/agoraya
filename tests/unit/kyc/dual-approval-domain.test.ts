import { describe, it, expect } from "vitest";

import {
  canReceiveApproval,
  nextApprovalSlot,
  assertNoSelfApproval,
  validateAndGetSlot,
  summariseApprovals,
  SelfApprovalError,
  ApprovalNotAllowedError,
  ApprovalSlotConflictError,
} from "@/modules/kyc/dual-approval/domain";
import type { KycApproval } from "@/modules/kyc/types";

const BASE_APPROVAL: KycApproval = {
  id: "approval-1",
  rosterId: "roster-1",
  tenantId: "tenant-1",
  approverId: "approver-1",
  approvalSlot: 1,
  decision: "approved",
  reason: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

describe("modules/kyc dual-approval domain", () => {
  describe("canReceiveApproval", () => {
    it("allows pending and partially_approved entries", () => {
      expect(canReceiveApproval("pending")).toBe(true);
      expect(canReceiveApproval("partially_approved")).toBe(true);
    });

    it("rejects terminal statuses", () => {
      expect(canReceiveApproval("verified")).toBe(false);
      expect(canReceiveApproval("rejected")).toBe(false);
      expect(canReceiveApproval("expired")).toBe(false);
    });
  });

  describe("nextApprovalSlot", () => {
    it("returns slot 1 when no approvals exist", () => {
      expect(nextApprovalSlot([])).toBe(1);
    });

    it("returns slot 2 after an approved slot 1", () => {
      const slot1Approved: KycApproval = { ...BASE_APPROVAL, approvalSlot: 1, decision: "approved" };
      expect(nextApprovalSlot([slot1Approved])).toBe(2);
    });

    it("returns null when slot 1 is rejected (workflow over)", () => {
      const slot1Rejected: KycApproval = { ...BASE_APPROVAL, approvalSlot: 1, decision: "rejected" };
      expect(nextApprovalSlot([slot1Rejected])).toBeNull();
    });

    it("returns null when both slots are filled", () => {
      const slot1: KycApproval = { ...BASE_APPROVAL, id: "a1", approvalSlot: 1, decision: "approved" };
      const slot2: KycApproval = { ...BASE_APPROVAL, id: "a2", approverId: "approver-2", approvalSlot: 2, decision: "approved" };
      expect(nextApprovalSlot([slot1, slot2])).toBeNull();
    });
  });

  describe("assertNoSelfApproval", () => {
    it("does not throw when the approver is new", () => {
      const slot1: KycApproval = { ...BASE_APPROVAL, approverId: "approver-1" };
      expect(() => assertNoSelfApproval([slot1], "approver-2")).not.toThrow();
    });

    it("throws SelfApprovalError when the same approver tries to vote again", () => {
      const slot1: KycApproval = { ...BASE_APPROVAL, approverId: "approver-1" };
      expect(() => assertNoSelfApproval([slot1], "approver-1")).toThrow(
        SelfApprovalError,
      );
    });

    it("includes the approver id in the error", () => {
      const slot1: KycApproval = { ...BASE_APPROVAL, approverId: "approver-1" };
      let caught: unknown;
      try {
        assertNoSelfApproval([slot1], "approver-1");
      } catch (e) {
        caught = e;
      }
      expect((caught as SelfApprovalError).approverId).toBe("approver-1");
    });
  });

  describe("validateAndGetSlot", () => {
    it("returns slot 1 for the first approver on a pending entry", () => {
      expect(validateAndGetSlot("pending", [], "approver-1")).toBe(1);
    });

    it("returns slot 2 for the second approver on a partially_approved entry", () => {
      const slot1: KycApproval = { ...BASE_APPROVAL, approverId: "approver-1", approvalSlot: 1 };
      expect(
        validateAndGetSlot("partially_approved", [slot1], "approver-2"),
      ).toBe(2);
    });

    it("throws ApprovalNotAllowedError for a terminal status", () => {
      expect(() => validateAndGetSlot("verified", [], "approver-1")).toThrow(
        ApprovalNotAllowedError,
      );
      expect(() => validateAndGetSlot("rejected", [], "approver-1")).toThrow(
        ApprovalNotAllowedError,
      );
      expect(() => validateAndGetSlot("expired", [], "approver-1")).toThrow(
        ApprovalNotAllowedError,
      );
    });

    it("throws SelfApprovalError when the same person tries to approve twice", () => {
      const slot1: KycApproval = { ...BASE_APPROVAL, approverId: "approver-1", approvalSlot: 1 };
      expect(() =>
        validateAndGetSlot("partially_approved", [slot1], "approver-1"),
      ).toThrow(SelfApprovalError);
    });

    it("throws ApprovalSlotConflictError when all slots are occupied", () => {
      const slot1: KycApproval = { ...BASE_APPROVAL, id: "a1", approverId: "approver-1", approvalSlot: 1 };
      const slot2: KycApproval = { ...BASE_APPROVAL, id: "a2", approverId: "approver-2", approvalSlot: 2 };
      // The status `verified` would be caught by ApprovalNotAllowedError first,
      // so we test slot conflict on `partially_approved` with both slots filled
      // (which would happen in a race condition scenario).
      expect(() =>
        validateAndGetSlot("partially_approved", [slot1, slot2], "approver-3"),
      ).toThrow(ApprovalSlotConflictError);
    });
  });

  describe("summariseApprovals", () => {
    it("returns zeros for empty approvals", () => {
      const result = summariseApprovals([]);
      expect(result.approvalCount).toBe(0);
      expect(result.allApproved).toBe(false);
      expect(result.anyRejected).toBe(false);
    });

    it("reflects a single approved vote", () => {
      const result = summariseApprovals([BASE_APPROVAL]);
      expect(result.approvalCount).toBe(1);
      expect(result.allApproved).toBe(true);
      expect(result.anyRejected).toBe(false);
    });

    it("reflects any rejection", () => {
      const rejected: KycApproval = { ...BASE_APPROVAL, decision: "rejected" };
      const result = summariseApprovals([rejected]);
      expect(result.anyRejected).toBe(true);
      expect(result.allApproved).toBe(false);
    });

    it("is not allApproved when one approval and one rejection are mixed", () => {
      const slot1: KycApproval = { ...BASE_APPROVAL, id: "a1", approvalSlot: 1, decision: "approved" };
      const slot2: KycApproval = { ...BASE_APPROVAL, id: "a2", approvalSlot: 2, decision: "rejected" };
      const result = summariseApprovals([slot1, slot2]);
      expect(result.allApproved).toBe(false);
      expect(result.anyRejected).toBe(true);
      expect(result.approvalCount).toBe(2);
    });

    it("is allApproved when both slots are approved", () => {
      const slot1: KycApproval = { ...BASE_APPROVAL, id: "a1", approvalSlot: 1, decision: "approved" };
      const slot2: KycApproval = { ...BASE_APPROVAL, id: "a2", approverId: "approver-2", approvalSlot: 2, decision: "approved" };
      const result = summariseApprovals([slot1, slot2]);
      expect(result.allApproved).toBe(true);
      expect(result.anyRejected).toBe(false);
      expect(result.approvalCount).toBe(2);
    });
  });
});
