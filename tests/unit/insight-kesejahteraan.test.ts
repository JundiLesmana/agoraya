import { describe, expect, it } from "vitest";
import {
  determineColor,
  formatDelta,
  getWellbeingInsights,
} from "@/lib/insight-kesejahteraan";

describe("formatDelta", () => {
  it("formats Indonesian decimal separators and retains the delta sign", () => {
    expect(formatDelta(-0.2, "poin persentase")).toBe("-0,2 poin persentase");
    expect(formatDelta(0.3, "tahun")).toBe("+0,3 tahun");
  });
});

describe("determineColor", () => {
  it("uses indicator direction rather than numeric sign alone", () => {
    expect(determineColor({ direction: "lower-is-better" }, -0.2)).toBe(
      "green",
    );
    expect(determineColor({ direction: "lower-is-better" }, 0.2)).toBe("red");
    expect(determineColor({ direction: "higher-is-better" }, 0.2)).toBe(
      "green",
    );
    expect(determineColor({ direction: "higher-is-better" }, -0.2)).toBe("red");
  });
});

describe("getWellbeingInsights", () => {
  it("returns the four simulated indicators and their required deltas", () => {
    const result = getWellbeingInsights();

    expect(result.data).toHaveLength(4);
    expect(result.data.map(({ delta }) => delta)).toEqual([
      -0.2, -0.3, 0.2, 0.3,
    ]);
    expect(result).toMatchObject({
      wilayah: "Kota Bandung",
      periode: "2023-2024",
      source: "SIMULATED",
    });
  });
});
