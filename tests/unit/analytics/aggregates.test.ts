import { describe, expect, it } from "vitest";
import {
  aggregateNumbers,
  average,
  count,
  maximum,
  minimum,
  sum,
} from "@/modules/analytics/aggregates";

describe("analytics numeric aggregates", () => {
  it("computes count, sum, average, minimum, and maximum consistently", () => {
    const values = [2, null, 4, 8];
    expect(aggregateNumbers(values)).toEqual({
      count: 3,
      sum: 14,
      average: 14 / 3,
      minimum: 2,
      maximum: 8,
    });
    expect(count(values)).toBe(3);
    expect(sum(values)).toBe(14);
    expect(average(values)).toBeCloseTo(14 / 3, 14);
    expect(minimum(values)).toBe(2);
    expect(maximum(values)).toBe(8);
  });

  it("returns zero sum and null statistics for empty inputs", () => {
    expect(aggregateNumbers([null, undefined])).toEqual({
      count: 0,
      sum: 0,
      average: null,
      minimum: null,
      maximum: null,
    });
    expect(average([])).toBeNull();
    expect(minimum([])).toBeNull();
    expect(maximum([])).toBeNull();
  });

  it("rejects non-finite inputs and overflow instead of returning misleading values", () => {
    expect(() => sum([Number.NaN])).toThrow(RangeError);
    expect(() => sum([Number.MAX_VALUE, Number.MAX_VALUE])).toThrow(RangeError);
    expect(minimum([Number.MAX_VALUE, Number.MAX_VALUE])).toBe(
      Number.MAX_VALUE,
    );
    expect(average([Number.MAX_VALUE, Number.MAX_VALUE])).toBe(
      Number.MAX_VALUE,
    );
  });
});
