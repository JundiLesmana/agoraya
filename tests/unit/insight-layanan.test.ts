import { describe, expect, it } from "vitest";
import {
  formatPercentagePoints,
  transformTimelyServiceResponse,
  type TimelyServiceResponse,
} from "@/lib/insight-layanan";

const response: TimelyServiceResponse = {
  period: 2024,
  cities: [
    { city: "Bandung", percentage: 88 },
    { city: "Bogor", percentage: 84 },
    { city: "Depok", percentage: 81 },
    { city: "Bekasi", percentage: 78 },
    { city: "Cimahi", percentage: 75 },
  ],
};

describe("transformTimelyServiceResponse", () => {
  it("maps API values into chart rows and calculates the precise average", () => {
    const result = transformTimelyServiceResponse(response);

    expect(
      result.rows.map(({ city, percentage }) => [city, percentage]),
    ).toEqual([
      ["Bandung", 88],
      ["Bogor", 84],
      ["Depok", 81],
      ["Bekasi", 78],
      ["Cimahi", 75],
    ]);
    expect(result.average).toBe(81.2);
    expect(result.roundedAverage).toBe(81);
  });

  it("calculates Bandung delta from the precise average and rounds it for display", () => {
    const result = transformTimelyServiceResponse(response);

    expect(result.rows[0]?.deltaFromAverage).toBeCloseTo(6.8);
    expect(formatPercentagePoints(result.rows[0]?.deltaFromAverage ?? 0)).toBe(
      "+7 poin persentase",
    );
  });
});
