import { describe, expect, it } from "vitest";
import {
  formatPersentase,
  formatRupiah,
  formatRupiahForScreenReader,
} from "@/lib/public-data-format";

describe("public data formatters", () => {
  it("formats large Rupiah values in a compact form", () => {
    expect(formatRupiah(80_000_000_000_000)).toBe("Rp80T");
    expect(formatRupiah(60_000_000_000_000)).toBe("Rp60T");
    expect(formatRupiah(1_500_000_000)).toBe("Rp1,5M");
  });

  it("formats ratios as whole percentages", () => {
    expect(formatPersentase(0.75)).toBe("75%");
    expect(formatPersentase(156 / 240)).toBe("65%");
  });

  it("describes full Rupiah units for assistive technology", () => {
    expect(formatRupiahForScreenReader(80_000_000_000_000)).toBe(
      "80 triliun rupiah",
    );
  });

  it("rejects non-finite values", () => {
    expect(() => formatRupiah(Number.NaN)).toThrow(RangeError);
    expect(() => formatPersentase(Number.POSITIVE_INFINITY)).toThrow(
      RangeError,
    );
  });
});
