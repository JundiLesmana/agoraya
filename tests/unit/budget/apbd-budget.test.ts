import { describe, expect, it } from "vitest";
import {
  apbdCsvTemplate,
  calculateApbdTotals,
  parseApbdCsv,
  parseRupiahInteger,
  validateApbdItems,
} from "@/modules/apbd-budget/domain";
import { APBD_PERIODS } from "@/modules/apbd-budget/contract";

describe("APBD amount input", () => {
  it("parses Indonesian and international thousands separators without using floats", () => {
    expect(parseRupiahInteger("1.000.000")).toBe("1000000");
    expect(parseRupiahInteger("1,000,000")).toBe("1000000");
    expect(parseRupiahInteger("1000000")).toBe("1000000");
    expect(parseRupiahInteger("")).toBeNull();
  });

  it("rejects decimals, malformed separators, and values beyond NUMERIC(20,0)", () => {
    expect(() => parseRupiahInteger("1.000,00")).toThrow();
    expect(() => parseRupiahInteger("1,00,000")).toThrow();
    expect(() => parseRupiahInteger("100000000000000000000")).toThrow();
  });

  it("calculates exact sums, completeness, absorption, and zero-Pagu safely", () => {
    const emptyResult = calculateApbdTotals([]);
    expect(emptyResult.pagu).toBe(0n);
    expect(emptyResult.realisasi).toBe(0n);
    expect(emptyResult.absorption).toBe("0,00%");
    expect(emptyResult.completeness).toBe(0);

    const result = calculateApbdTotals([
      {
        periods: [
          { pagu: "100", realisasi: "80" },
          { pagu: "200", realisasi: "210" },
          { pagu: null, realisasi: null },
          { pagu: "0", realisasi: "0" },
        ],
      },
    ]);
    expect(result.pagu).toBe(300n);
    expect(result.realisasi).toBe(290n);
    expect(result.completeness).toBe(75);
    expect(result.absorption).toBe("96,66%");
    expect(result.warningCount).toBe(1);
  });
});

describe("APBD CSV contract", () => {
  it("imports a template-compatible CSV with quoted commas and a UTF-8 BOM", () => {
    const headers = apbdCsvTemplate();
    const row = [
      "SM-01",
      '"Program, Pendidikan"',
      '"Buku ""Berkualitas"""',
      "1.000.000",
      "500000",
      ...Array.from({ length: 6 }, () => ""),
    ].join(",");
    const result = parseApbdCsv(`\uFEFF${headers}\r\n${row}`);

    expect(result.rowErrors).toEqual([]);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      code: "SM-01",
      programName: "Program, Pendidikan",
      subactivityName: 'Buku "Berkualitas"',
      periods: [
        { periodValue: "Q1", pagu: "1000000", realisasi: "500000" },
        { periodValue: "Q2", pagu: null, realisasi: null },
        { periodValue: "Q3", pagu: null, realisasi: null },
        { periodValue: "Q4", pagu: null, realisasi: null },
      ],
    });
  });

  it("reports malformed rows and invalid integer amounts by row number", () => {
    const headings = apbdCsvTemplate();
    const validLength = APBD_PERIODS.length * 2 + 3;
    const shortRow = ["SM-01", "Program", "Sub-kegiatan"].join(",");
    const badAmountRow = [
      "SM-02",
      "Program",
      "Sub-kegiatan",
      "1.000,00",
      ...Array.from({ length: validLength - 4 }, () => ""),
    ].join(",");
    const result = parseApbdCsv(
      `${headings}\r\n${shortRow}\r\n${badAmountRow}`,
    );

    expect(result.items).toHaveLength(0);
    expect(result.rowErrors).toHaveLength(2);
    expect(result.rowErrors[0]?.row).toBe(2);
    expect(result.rowErrors[1]?.row).toBe(3);
  });

  it("flags duplicate or incomplete bulk-upsert rows with input row indexes", () => {
    const completePeriods = APBD_PERIODS.map(({ value }) => ({
      periodType: "quarterly" as const,
      periodValue: value,
      pagu: "100",
      realisasi: "80",
    }));
    const result = validateApbdItems([
      {
        code: "SM-01",
        programName: "Program",
        subactivityName: "Sub-kegiatan",
        periods: completePeriods,
      },
      {
        code: "sm-01",
        programName: "Program",
        subactivityName: "Sub-kegiatan",
        periods: completePeriods,
      },
      { code: "", programName: "", subactivityName: "", periods: [] },
    ]);

    expect(result.items).toHaveLength(1);
    expect(result.errors.map((error) => error.row)).toEqual([2, 3]);
  });
});
