import { isAllowedReportTransition } from "@/modules/reporting/state-machine";

export const reviewStatuses = [
  "submitted",
  "verified",
  "in_progress",
  "waiting_for_citizen",
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
  if (itemType === "report") {
    if (from === "waiting_for_citizen" || to === "waiting_for_citizen") {
      return false;
    }
    return isAllowedReportTransition(from, to);
  }
  switch (from) {
    case "submitted":
      return (
        to === "verified" ||
        to === "in_progress" ||
        to === "waiting_for_citizen"
      );
    case "verified":
      return to === "in_progress" || to === "waiting_for_citizen";
    case "in_progress":
      return to === "rejected" || to === "waiting_for_citizen";
    case "waiting_for_citizen":
      return to === "in_progress" || to === "rejected";
    case "resolved":
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
    case "waiting_for_citizen":
      return "Menunggu Warga";
    case "resolved":
    case "closed":
      return "Selesai";
    case "rejected":
      return "Ditolak";
    default:
      return status;
  }
}
