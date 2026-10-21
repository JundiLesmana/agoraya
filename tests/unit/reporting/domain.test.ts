import { describe, expect, it } from "vitest";
import {
  assertReportTransition,
  findDuplicate,
  isAllowedReportTransition,
  similarity,
} from "@/modules/reporting";
import { InvalidReportTransitionError } from "@/modules/reporting";

describe("reporting domain rules", () => {
  it("accepts only sequential workflow transitions", () => {
    expect(isAllowedReportTransition("submitted", "verified")).toBe(true);
    expect(isAllowedReportTransition("submitted", "resolved")).toBe(false);
    expect(() => assertReportTransition("closed", "submitted")).toThrow(
      InvalidReportTransitionError,
    );
  });
  it("uses token similarity without cross-category matches", () => {
    expect(similarity("Jalan rusak berat", "jalan rusak berat")).toBe(1);
    expect(
      findDuplicate(
        {
          category: "road",
          title: "Jalan rusak berat",
          description: "di pusat kota",
          location: null,
        },
        [
          {
            id: "a",
            category: "drainage",
            title: "Jalan rusak berat",
            description: "di pusat kota",
            location: null,
          },
        ],
      ),
    ).toBeNull();
  });
});
