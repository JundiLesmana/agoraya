import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { db, selectPublicBpsStatistics } = vi.hoisted(() => ({
  db: vi.fn(() => ({})),
  selectPublicBpsStatistics: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/modules/integrations/bps/repository", () => ({
  selectPublicBpsStatistics,
}));

import { GET } from "@/app/api/analytics/statistics/route";

const rows = [
  {
    indicatorCode: "IND_KEMISKINAN",
    regionCode: "31",
    year: 2025,
    value: 8.7,
  },
  {
    indicatorCode: "IND_KEMISKINAN",
    regionCode: "32",
    year: 2024,
    value: 7.4,
  },
  {
    indicatorCode: "IND_KEMISKINAN",
    regionCode: "31",
    year: 2021,
    value: 11.04,
  },
];

describe("public statistics analytics route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.mockReturnValue({});
    selectPublicBpsStatistics.mockResolvedValue({
      rows,
      source: "SIMULATED",
    });
  });

  it("returns a Recharts-ready poverty series for the POV alias and region", async () => {
    selectPublicBpsStatistics.mockResolvedValueOnce({
      rows: rows.filter((row) => row.regionCode === "31"),
      source: "SIMULATED",
    });
    const response = await GET(
      new NextRequest(
        "http://localhost/api/analytics/statistics?indicator=POV&region=31",
      ),
    );

    expect(response.status).toBe(200);
    expect(selectPublicBpsStatistics).toHaveBeenCalledWith(
      {},
      {
        indicatorCode: "bps:0000:192:434:61",
        regionCode: "3100",
        simulatedIndicatorCode: "IND_KEMISKINAN",
        simulatedRegionCode: "31",
      },
    );
    await expect(response.json()).resolves.toMatchObject({
      source: "SIMULATED",
      indicator: "bps:0000:192:434:61",
      region: "31",
      count: 2,
      data: [
        { year: 2021, value: 11.04 },
        { year: 2025, value: 8.7 },
      ],
    });
  });

  it("serves real BPS province rows with GeoJSON-compatible province codes", async () => {
    selectPublicBpsStatistics.mockResolvedValueOnce({
      rows: [
        {
          indicatorCode: "bps:0000:192:434:61",
          regionCode: "3100",
          year: 2026,
          value: 8.11,
          unit: "Persen",
          indicatorName: "Persentase penduduk miskin",
          sourceLabel: "BPS_API",
          lastSyncedAt: new Date("2026-11-06T00:00:00.000Z"),
        },
      ],
      source: "BPS_API",
    });

    const response = await GET(
      new NextRequest(
        "http://localhost/api/analytics/statistics?indicator=IND_KEMISKINAN&region=31",
      ),
    );

    expect(selectPublicBpsStatistics).toHaveBeenCalledWith(
      {},
      {
        indicatorCode: "bps:0000:192:434:61",
        regionCode: "3100",
        simulatedIndicatorCode: "IND_KEMISKINAN",
        simulatedRegionCode: "31",
      },
    );
    await expect(response.json()).resolves.toMatchObject({
      source: "BPS_API",
      count: 1,
      data: [
        {
          regionCode: "31",
          indicatorCode: "bps:0000:192:434:61",
          indicatorName: "Persentase penduduk miskin",
          category: "Kesejahteraan",
          year: 2026,
          value: 8.11,
          unit: "Persen",
        },
      ],
    });
  });

  it("returns only each region's latest year when requested by the map", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/analytics/statistics?indicator=POV&latest=true",
      ),
    );

    await expect(response.json()).resolves.toMatchObject({
      count: 2,
      data: [
        { regionCode: "31", year: 2025, value: 8.7 },
        { regionCode: "32", year: 2024, value: 7.4 },
      ],
    });
  });

  it("rejects an invalid latest option", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/analytics/statistics?latest=recent",
      ),
    );

    expect(response.status).toBe(400);
    expect(selectPublicBpsStatistics).not.toHaveBeenCalled();
  });
});
