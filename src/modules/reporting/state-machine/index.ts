import type { ReportStatus } from "../types";

const transitions: Readonly<Record<ReportStatus, readonly ReportStatus[]>> = {
  submitted: ["verified"],
  verified: ["in_progress"],
  in_progress: ["resolved"],
  resolved: ["closed"],
  closed: [],
};

export class InvalidReportTransitionError extends Error {
  constructor(
    readonly from: ReportStatus,
    readonly to: ReportStatus,
  ) {
    super(`Report cannot transition from ${from} to ${to}`);
    this.name = "InvalidReportTransitionError";
  }
}

export function isAllowedReportTransition(
  from: ReportStatus,
  to: ReportStatus,
): boolean {
  return transitions[from].includes(to);
}

export function assertReportTransition(
  from: ReportStatus,
  to: ReportStatus,
): void {
  if (!isAllowedReportTransition(from, to))
    throw new InvalidReportTransitionError(from, to);
}
