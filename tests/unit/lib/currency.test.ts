// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { formatCurrency, formatPercent } from "@/lib/currency";

describe("formatCurrency", () => {
  it('mengformat nilai triliunan tanpa desimal, contoh "Rp80 T"', () => {
    expect(formatCurrency(80)).toBe("Rp80 T");
    expect(formatCurrency(60)).toBe("Rp60 T");
    expect(formatCurrency(20)).toBe("Rp20 T");
  });

  it('mengembalikan "-" untuk null', () => {
    expect(formatCurrency(null)).toBe("-");
  });

  it('mengembalikan "-" untuk undefined', () => {
    expect(formatCurrency(undefined)).toBe("-");
  });

  it('mengembalikan "-" untuk NaN dan Infinity', () => {
    expect(formatCurrency(NaN)).toBe("-");
    expect(formatCurrency(Infinity)).toBe("-");
    expect(formatCurrency(-Infinity)).toBe("-");
  });

  it("mengelola nilai negatif dengan tanda minus", () => {
    expect(formatCurrency(-5)).toBe("Rp−5 T");
  });

  it("mengsupport opsi desimal dan unit kustom", () => {
    expect(formatCurrency(80.5, { decimals: 1 })).toBe("Rp80.5 T");
    expect(formatCurrency(80, { unit: "M" })).toBe("Rp80 M");
  });
});

describe("formatPercent", () => {
  it('mengformat persen bulat, contoh "75%"', () => {
    expect(formatPercent(75)).toBe("75%");
  });

  it('mengembalikan "-" untuk null', () => {
    expect(formatPercent(null)).toBe("-");
  });

  it('mengembalikan "-" untuk undefined', () => {
    expect(formatPercent(undefined)).toBe("-");
  });

  it('mengembalikan "-" untuk NaN', () => {
    expect(formatPercent(NaN)).toBe("-");
  });

  it("mengsupport opsi desimal", () => {
    expect(formatPercent(75.5, { decimals: 1 })).toBe("75.5%");
  });
});
