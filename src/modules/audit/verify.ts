import { createHmac } from "node:crypto";

import type { AuditEntry, AuditVerificationResult } from "./types";
import { AuditHashChain } from "./hash-chain";

export function verifyAuditTrail(
  entries: readonly AuditEntry[],
  secret: string,
): AuditVerificationResult {
  let previousHash: string | null = null;
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry.sequence !== index + 1)
      return {
        valid: false,
        tampered: true,
        entriesChecked: index + 1,
        reason: "sequence_mismatch",
      };
    if (entry.previousHash !== previousHash)
      return {
        valid: false,
        tampered: true,
        entriesChecked: index + 1,
        reason: "previous_hash_mismatch",
      };
    if (AuditHashChain.computeHash(entry) !== entry.hash)
      return {
        valid: false,
        tampered: true,
        entriesChecked: index + 1,
        reason: "hash_mismatch",
      };
    const signature = createHmac("sha256", secret)
      .update(entry.hash)
      .digest("hex");
    if (signature !== entry.signature)
      return {
        valid: false,
        tampered: true,
        entriesChecked: index + 1,
        reason: "signature_mismatch",
      };
    previousHash = entry.hash;
  }
  return { valid: true, tampered: false, entriesChecked: entries.length };
}
