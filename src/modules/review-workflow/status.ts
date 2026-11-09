import { isAllowedReportTransition } from "@/modules/reporting/state-machine";

export const reviewStatuses = [
  "submitted",
  "verified",
  "in_progress",
  "resolved",
  "rejected",
  "closed",
] as const;

export type ReviewStatus = (typeof reviewStatuses)[number];

export function isReviewStatus(value: string): value is ReviewStatus {
  return reviewStatuses.some((status) => status === value);
}

export function canChangeReviewStatus(
  itemType: "report" | "service_application",
  from: string,
  to: ReviewStatus,
): boolean {
  if (from === to) return true;
  if (!isReviewStatus(from)) return false;
  if (itemType === "report") return isAllowedReportTransition(from, to);
  switch (from) {
    case "submitted":
      return to === "verified";
    case "verified":
      return to === "in_progress";
    case "in_progress":
      return to === "resolved" || to === "rejected";
    case "resolved":
      return to === "closed";
    case "rejected":
    case "closed":
      return false;
  }
}

export function getNextReviewStatuses(
  itemType: "report" | "service_application",
  current: string,
): ReviewStatus[] {
  return reviewStatuses.filter(
    (status) =>
      status === current || canChangeReviewStatus(itemType, current, status),
  );
}

export function getReviewStatusLabel(status: string): string {
  switch (status) {
    case "submitted":
      return "Diterima";
    case "verified":
      return "Diverifikasi";
    case "in_progress":
      return "Diproses";
    case "resolved":
    case "closed":
      return "Selesai";
    case "rejected":
      return "Ditolak";
    default:
      return status;
  }
}
