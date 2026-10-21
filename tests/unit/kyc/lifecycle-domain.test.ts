import { describe, it, expect } from "vitest";

import {
  isAllowedTransition,
  assertTransitionAllowed,
  InvalidKycTransitionError,
  deriveStatusFromApprovals,
  isExpired,
} from "@/modules/kyc/lifecycle/domain";
import type { KycStatus } from "@/modules/kyc/types";

describe("modules/kyc lifecycle domain", () => {
  describe("isAllowedTransition", () => {
    it.each([
      ["pending", "partially_approved"],
      ["pending", "rejected"],
      ["partially_approved", "verified"],
      ["partially_approved", "rejected"],
      ["verified", "expired"],
    ] as [KycStatus, KycStatus][])(
      "allows %s → %s",
      (from, to) => {
        expect(isAllowedTransition(from, to)).toBe(true);
      },
    );

    it.each([
      ["pending", "verified"],
      ["pending", "expired"],
      ["pending", "pending"],
      ["partially_approved", "pending"],
      ["partially_approved", "expired"],
      ["verified", "pending"],
      ["verified", "partially_approved"],
      ["verified", "rejected"],
      ["rejected", "pending"],
      ["rejected", "verified"],
      ["expired", "verified"],
      ["expired", "pending"],
    ] as [KycStatus, KycStatus][])(
      "rejects %s → %s",
      (from, to) => {
        expect(isAllowedTransition(from, to)).toBe(false);
      },
    );
  });

  describe("assertTransitionAllowed", () => {
    it("does not throw for a valid transition", () => {
      expect(() =>
        assertTransitionAllowed("pending", "partially_approved"),
      ).not.toThrow();
    });

    it("throws InvalidKycTransitionError for an invalid transition", () => {
      expect(() =>
        assertTransitionAllowed("rejected", "verified"),
      ).toThrow(InvalidKycTransitionError);
    });

    it("includes the from/to states in the error", () => {
      let caught: unknown;
      try {
        assertTransitionAllowed("expired", "pending");
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(InvalidKycTransitionError);
      expect((caught as InvalidKycTransitionError).from).toBe("expired");
      expect((caught as InvalidKycTransitionError).to).toBe("pending");
    });
  });

  describe("deriveStatusFromApprovals", () => {
    it("returns null when no approvals exist", () => {
      expect(
        deriveStatusFromApprovals("pending", 0, false, false),
      ).toBeNull();
    });

    it("returns partially_approved after one approved vote on a pending entry", () => {
      expect(
        deriveStatusFromApprovals("pending", 1, true, false),
      ).toBe("partially_approved");
    });

    it("returns rejected when any vote is rejected on a pending entry", () => {
      expect(
        deriveStatusFromApprovals("pending", 1, false, true),
      ).toBe("rejected");
    });

    it("returns verified after two approved votes on a partially_approved entry", () => {
      expect(
        deriveStatusFromApprovals("partially_approved", 2, true, false),
      ).toBe("verified");
    });

    it("returns rejected when any vote is rejected on a partially_approved entry", () => {
      expect(
        deriveStatusFromApprovals("partially_approved", 2, false, true),
      ).toBe("rejected");
    });

    it("returns null when transition is not allowed for the current status", () => {
      // A rejected entry cannot move to any other state.
      expect(
        deriveStatusFromApprovals("rejected", 1, true, false),
      ).toBeNull();
    });
  });

  describe("isExpired", () => {
    const now = new Date("2026-06-01T00:00:00.000Z");

    it("returns false for a non-verified entry", () => {
      expect(
        isExpired({ status: "pending", expiresAt: null }, now),
      ).toBe(false);
    });

    it("returns false for a verified entry with no expiresAt", () => {
      expect(
        isExpired({ status: "verified", expiresAt: null }, now),
      ).toBe(false);
    });

    it("returns false when the expiresAt is in the future", () => {
      expect(
        isExpired(
          {
            status: "verified",
            expiresAt: new Date("2027-01-01T00:00:00.000Z"),
          },
          now,
        ),
      ).toBe(false);
    });

    it("returns true when the expiresAt is in the past", () => {
      expect(
        isExpired(
          {
            status: "verified",
            expiresAt: new Date("2025-01-01T00:00:00.000Z"),
          },
          now,
        ),
      ).toBe(true);
    });

    it("returns true when the expiresAt equals now (boundary)", () => {
      expect(
        isExpired({ status: "verified", expiresAt: now }, now),
      ).toBe(true);
    });
  });
});
