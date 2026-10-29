import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/insight/anggaran/route";

describe("GET /api/insight/anggaran", () => {
  it("returns simulated Kota Bandung budget and realization data for 2020-2024", async () => {
    const response = GET(
      new Request("http://localhost/api/insight/anggaran?tahun=2020-2024"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      wilayah: "Kota Bandung",
      periode: "2020-2024",
      source: "SIMULATED",
      data: [
        { tahun: 2020, anggaran: 1.8, realisasi: 1.5 },
        { tahun: 2021, anggaran: 2, realisasi: 1.7 },
        { tahun: 2022, anggaran: 2.3, realisasi: 2 },
        { tahun: 2023, anggaran: 2.6, realisasi: 2.3 },
        { tahun: 2024, anggaran: 3, realisasi: 2.7 },
      ],
    });
  });

  it("rejects unsupported year ranges", () => {
    const response = GET(
      new Request("http://localhost/api/insight/anggaran?tahun=2021-2024"),
    );

    expect(response.status).toBe(400);
  });
});
