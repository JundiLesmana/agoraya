import { describe, expect, it } from "vitest";
import {
  approvalsRequired,
  canPublishFromReviews,
  isAllowedContentTransition,
  riskLevelForScore,
} from "@/modules/cms";
import type { RiskReview } from "@/modules/cms";

const review = (score: number, reviewerId = "reviewer"): RiskReview => ({
  id: reviewerId,
  contentId: "content",
  tenantId: "tenant",
  reviewerId,
  score,
  level: riskLevelForScore(score),
  decision: "approved",
  rationale: "checked",
  createdAt: new Date(),
});
describe("CMS state machine and risk policy", () => {
  it("allows only defined workflow transitions", () => {
    expect(isAllowedContentTransition("draft", "in_review")).toBe(true);
    expect(isAllowedContentTransition("published", "draft")).toBe(false);
    expect(isAllowedContentTransition("archived", "published")).toBe(false);
  });
  it("maps scores to deterministic risk levels and approval counts", () => {
    expect(riskLevelForScore(3)).toBe("low");
    expect(riskLevelForScore(4)).toBe("medium");
    expect(riskLevelForScore(8)).toBe("high");
    expect(approvalsRequired("high")).toBe(2);
  });
  it("does not permit high-risk publishing until two distinct reviewers approve", () => {
    expect(canPublishFromReviews([review(9)])).toBe(false);
    expect(canPublishFromReviews([review(9, "one"), review(9, "two")])).toBe(
      true,
    );
  });
});
