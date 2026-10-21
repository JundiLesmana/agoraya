import { describe, expect, it } from "vitest";
import { suppressSmallCells } from "@/modules/analytics/suppression";

describe("small-cell suppression", () => {
  it("omits cells below k without returning identifying group labels", () => {
    const result = suppressSmallCells(
      [
        { category: "common", count: 7 },
        { category: "rare", count: 1 },
        { category: "small", count: 4 },
      ],
      (cell) => cell.count,
    );
    expect(result).toEqual([{ category: "common", count: 7 }]);
    expect(result.some((cell) => cell.category === "rare")).toBe(false);
  });

  it("supports an explicit policy threshold", () => {
    expect(
      suppressSmallCells([{ count: 8 }, { count: 9 }], (cell) => cell.count, {
        minimumCellSize: 10,
      }),
    ).toEqual([]);
  });

  it("rejects invalid thresholds and counts", () => {
    expect(() =>
      suppressSmallCells([{ count: 3 }], (cell) => cell.count, {
        minimumCellSize: 1,
      }),
    ).toThrow(RangeError);
    expect(() =>
      suppressSmallCells([{ count: -1 }], (cell) => cell.count),
    ).toThrow(RangeError);
  });
});
