import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/insight/layanan/route";

describe("GET /api/insight/layanan", () => {
  it("returns the five requested city values", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/insight/layanan?kota=Bandung,Bogor,Depok,Bekasi,Cimahi",
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      period: 2024,
      cities: [
        { city: "Bandung", percentage: 88 },
        { city: "Bogor", percentage: 84 },
        { city: "Depok", percentage: 81 },
        { city: "Bekasi", percentage: 78 },
        { city: "Cimahi", percentage: 75 },
      ],
    });
  });

  it("rejects missing, unknown, or duplicated city values", async () => {
    for (const query of [
      "",
      "?kota=Bandung,Bogor,Depok,Bekasi",
      "?kota=Bandung,Bogor,Depok,Bekasi,Jakarta",
      "?kota=Bandung,Bogor,Depok,Bekasi,Bekasi",
    ]) {
      const response = await GET(
        new Request(`http://localhost/api/insight/layanan${query}`),
      );
      expect(response.status).toBe(400);
    }
  });
});
