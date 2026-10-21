import type { QcEvidence } from "../types";

export function hasQcEvidence(evidence: readonly QcEvidence[]): boolean {
  return evidence.length > 0;
}
