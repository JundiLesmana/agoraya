import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/v1/stats/tracking-summary/route";

describe("public tracking statistics API", () => {
  it("returns an anonymous aggregated dashboard payload by default", async () => {
    const response = await GET(
      new Request("http://localhost/api/v1/stats/tracking-summary"),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.periodLabel).toBe("Tahun ini");
    expect(payload.regionLabel).toBe("Seluruh wilayah");
    expect(payload.kpis.totalReports.value).toBe(383400);
    expect(payload.kpis.totalReports.changePercent).toBeTypeOf("number");
    expect(payload.kpis.totalComplaints).toHaveProperty("changePercent");
    expect(payload.kpis.averageResolutionDays).toHaveProperty("changePercent");
    expect(payload.kpis.satisfactionRate).toHaveProperty("changePercent");
    expect(payload.serviceDistribution.length).toBeGreaterThan(1);
    expect(payload.topRegions).toHaveLength(5);
    expect(payload.longResolutionServices).toHaveLength(5);
    expect(Object.keys(payload)).not.toContain("reports");
    expect(JSON.stringify(payload)).not.toMatch(
      /citizenId|nik|description|trackingNumber/i,
    );
  });

  it("returns only year-to-date months through the current calendar month", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/v1/stats/tracking-summary?period=this-year",
      ),
    );
    const payload = await response.json();
    const calendarMonths = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];

    expect(response.status).toBe(200);
    expect(
      payload.trend.map((month: { label: string }) => month.label),
    ).toEqual(calendarMonths.slice(0, new Date().getMonth() + 1));
  });

  it("selects aggregate data for a requested period and region", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/v1/stats/tracking-summary?period=this-month&region=jabar",
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.periodLabel).toBe("Bulan ini");
    expect(payload.regionLabel).toBe("Jawa Barat");
    expect(payload.kpis.totalReports.value).toBe(7017);
    expect(payload.topRegions).toHaveLength(5);
  });

  it.each([
    "period=custom&startDate=2026-10-28&endDate=2026-10-01",
    "period=custom&startDate=2025-01-01&endDate=2026-01-02",
    "period=custom&startDate=2026-02-30&endDate=2026-03-01",
    "period=this-year&region=unknown",
  ])("returns 400 for invalid filter query %s", async (query) => {
    const response = await GET(
      new Request(`http://localhost/api/v1/stats/tracking-summary?${query}`),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty("error");
  });
});
