import { describe, expect, it } from "vitest";
import { statisticInputPayloadSchema } from "@/modules/statistics-input";
import {
  detectStatisticAnomalies,
  formatStatisticValue,
} from "@/modules/statistics-input";

describe("statistical indicator input", () => {
  it("warns for a change greater than 50% without an explanation", () => {
    expect(
      detectStatisticAnomalies("quarterly", [
        { periodValue: "Q1", value: 100, explanation: "" },
        { periodValue: "Q2", value: 151, explanation: "" },
      ]),
    ).toEqual([
      {
        periodValue: "Q2",
        previousValue: 100,
        currentValue: 151,
        changePercent: 51,
      },
    ]);
  });

  it("does not warn when the change is explained", () => {
    expect(
      detectStatisticAnomalies("quarterly", [
        { periodValue: "Q1", value: 100, explanation: "" },
        {
          periodValue: "Q2",
          value: 160,
          explanation: "Perluasan cakupan pengukuran.",
        },
      ]),
    ).toEqual([]);
  });

  it("formats values using Indonesian decimal and thousands separators", () => {
    expect(formatStatisticValue(1234.5, 2)).toBe("1.234,5");
  });

  it("rejects a publication without a data source", () => {
    const result = statisticInputPayloadSchema.safeParse({
      referenceYear: 2026,
      regionId: "kota-a",
      sectorId: "economy",
      indicatorId: "tpt",
      periodType: "quarterly",
      status: "published",
      sourceName: "",
      methodology: "Survei rumah tangga.",
      values: [{ periodValue: "Q1", value: 5.2, explanation: "" }],
    });
    expect(result.success).toBe(false);
  });
});
