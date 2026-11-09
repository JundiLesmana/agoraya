import { describe, expect, it } from "vitest";
import {
  canChangeReviewStatus,
  getNextReviewStatuses,
  getReviewStatusLabel,
} from "@/modules/review-workflow/status";

describe("review workflow status", () => {
  it("uses the report lifecycle and does not allow skipping steps", () => {
    expect(canChangeReviewStatus("report", "submitted", "verified")).toBe(true);
    expect(canChangeReviewStatus("report", "submitted", "in_progress")).toBe(
      false,
    );
    expect(getNextReviewStatuses("report", "verified")).toEqual([
      "verified",
      "in_progress",
    ]);
  });

  it("allows an update without changing status and labels it for citizens", () => {
    expect(
      canChangeReviewStatus(
        "service_application",
        "in_progress",
        "in_progress",
      ),
    ).toBe(true);
    expect(getReviewStatusLabel("in_progress")).toBe("Diproses");
  });

  it("rejects terminal and unknown transitions", () => {
    expect(
      canChangeReviewStatus("service_application", "closed", "in_progress"),
    ).toBe(false);
    expect(
      canChangeReviewStatus("service_application", "legacy", "verified"),
    ).toBe(false);
  });
});
