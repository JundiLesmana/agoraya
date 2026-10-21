import type { Report } from "../types";

export const DEFAULT_RESPONSE_SLA_MS = 24 * 60 * 60 * 1000;

export function responseDueAt(
  submittedAt: Date,
  responseSlaMs = DEFAULT_RESPONSE_SLA_MS,
): Date {
  return new Date(submittedAt.getTime() + responseSlaMs);
}

/** A closed report has no active SLA; client clocks never affect this calculation. */
export function isSlaBreached(report: Report, now: Date): boolean {
  return (
    report.closedAt === null &&
    report.firstRespondedAt === null &&
    report.responseDueAt <= now
  );
}
