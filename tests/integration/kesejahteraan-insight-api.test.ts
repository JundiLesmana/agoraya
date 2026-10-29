import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/insight/kesejahteraan/route";

describe("GET /api/insight/kesejahteraan", () => {
  it("returns the requested simulated indicators with the correct values", async () => {
    const response = GET(
      new Request(
        "http://localhost/api/insight/kesejahteraan?indikator=kemiskinan,pengangguran,sekolah,harapan_hidup",
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      wilayah: "Kota Bandung",
      periode: "2023-2024",
      source: "SIMULATED",
      data: [
        { id: "kemiskinan", value2023: 4, value2024: 3.8, delta: -0.2 },
        { id: "pengangguran", value2023: 7.1, value2024: 6.8, delta: -0.3 },
        { id: "sekolah", value2023: 10.5, value2024: 10.7, delta: 0.2 },
        {
          id: "harapan_hidup",
          value2023: 73.7,
          value2024: 74,
          delta: 0.3,
        },
      ],
    });
  });

  it("rejects missing, unsupported, or duplicate indicators", () => {
    const missing = GET(
      new Request("http://localhost/api/insight/kesejahteraan"),
    );
    const unsupported = GET(
      new Request(
        "http://localhost/api/insight/kesejahteraan?indikator=kemiskinan,invalid",
      ),
    );
    const duplicate = GET(
      new Request(
        "http://localhost/api/insight/kesejahteraan?indikator=kemiskinan,kemiskinan",
      ),
    );

    expect(missing.status).toBe(400);
    expect(unsupported.status).toBe(400);
    expect(duplicate.status).toBe(400);
  });
});
