import { describe, expect, it } from "vitest";
import {
  calculateTrendPercent,
  formatCompactNumber,
} from "@/lib/statistics-format";

describe("statistics formatters", () => {
  it("formats million-scale values compactly", () => {
    expect(formatCompactNumber(1_200_000)).toBe("1,2 Jt");
  });

  it("calculates percentage change against the previous period", () => {
    expect(calculateTrendPercent(120, 100)).toBe(20);
    expect(calculateTrendPercent(80, 100)).toBe(-20);
    expect(calculateTrendPercent(0, 0)).toBe(0);
    expect(calculateTrendPercent(1, 0)).toBeNull();
  });

  it("rejects invalid trend counts", () => {
    expect(() => calculateTrendPercent(Number.NaN, 2)).toThrow(RangeError);
    expect(() => calculateTrendPercent(2, -1)).toThrow(RangeError);
  });
});
