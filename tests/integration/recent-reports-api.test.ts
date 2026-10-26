import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/reports/recent/route";

describe("GET /api/reports/recent", () => {
  it("returns at most five latest public fields by default", async () => {
    const response = await GET(
      new Request("http://localhost/api/reports/recent"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reports).toHaveLength(5);
    expect(body.reports[0]).toMatchObject({
      reportNumber: "LP-2026-007064-01",
      title: "Jalan berlubang di Jl. Melati",
      status: "in_progress",
      submittedAt: "2026-10-12T00:00:00.000Z",
    });
    expect(body.reports[1].status).toBe("verified");
    expect(body.reports[2].status).toBe("resolved");
    expect(
      body.reports.every((report: object) => !("reporterName" in report)),
    ).toBe(true);
    expect(body.hasMore).toBe(true);
  });

  it("supports a bounded paginated request", async () => {
    const response = await GET(
      new Request("http://localhost/api/reports/recent?limit=2&offset=4"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reports).toHaveLength(2);
    expect(body.offset).toBe(4);
    expect(body.hasMore).toBe(false);
  });

  it("rejects invalid or unbounded query parameters", async () => {
    const response = await GET(
      new Request("http://localhost/api/reports/recent?limit=500"),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Parameter daftar laporan tidak valid.",
    });
  });
});
