import type { RiskLevel, RiskReview } from "../types";

export function riskLevelForScore(score: number): RiskLevel {
  return score >= 8 ? "high" : score >= 4 ? "medium" : "low";
}
export function approvalsRequired(level: RiskLevel): number {
  return level === "high" ? 2 : 1;
}
export function canPublishFromReviews(reviews: readonly RiskReview[]): boolean {
  if (
    reviews.length === 0 ||
    reviews.some((review) => review.decision === "rejected")
  )
    return false;
  const level = reviews.reduce<RiskLevel>(
    (highest, review) =>
      riskLevelForScore(review.score) === "high"
        ? "high"
        : highest === "high" || riskLevelForScore(review.score) === "medium"
          ? "medium"
          : "low",
    "low",
  );
  const approvers = new Set(
    reviews
      .filter((review) => review.decision === "approved")
      .map((review) => review.reviewerId),
  );
  return approvers.size >= approvalsRequired(level);
}
