import { describe, expect, it } from "vitest";
import { AuditHashChain, verifyAuditTrail } from "@/modules/audit";

const makeEntry = (action: string, minute: number) => ({
  action,
  actorId: "admin-1",
  targetTable: "users",
  targetId: "asn-1",
  metadata: { modules: ["kyc"] },
  occurredAt: new Date(`2026-01-01T00:${String(minute).padStart(2, "0")}:00Z`),
});

describe("audit hash-chain", () => {
  it("creates verifiable chained entries for access changes", () => {
    const chain = new AuditHashChain({ secret: "test-secret" });
    const first = chain.append(makeEntry("asn.access.updated", 0));
    const second = chain.append(makeEntry("asn.access.updated", 1));

    expect(first.previousHash).toBeNull();
    expect(second.previousHash).toBe(first.hash);
    expect(second.sequence).toBe(2);
    expect(verifyAuditTrail(chain.getEntries(), "test-secret").valid).toBe(
      true,
    );
  });

  it("continues a persisted chain from its previous hash and sequence", () => {
    const chain = new AuditHashChain({
      secret: "test-secret",
      initialPreviousHash: "previous-hash",
      initialSequence: 6,
    });

    const entry = chain.append(makeEntry("asn.access.updated", 2));
    expect(entry.previousHash).toBe("previous-hash");
    expect(entry.sequence).toBe(7);
  });
});
