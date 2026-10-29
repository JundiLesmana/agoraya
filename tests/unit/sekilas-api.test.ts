import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/insight/sekilas/route";

describe("GET /api/insight/sekilas", () => {
  it("mengembalikan 3 kartu sekilas dengan status 200", async () => {
    const response = await GET(
      new Request("http://localhost/api/insight/sekilas"),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveLength(3);
  });

  it("setiap item memiliki struktur lengkap { label, sublabel, value, interpretation, delta, context }", async () => {
    const response = await GET(
      new Request("http://localhost/api/insight/sekilas"),
    );
    const body = await response.json();

    expect(Array.isArray(body)).toBe(true);
    body.forEach((item: unknown) => {
      expect(item).toEqual(
        expect.objectContaining({
          label: expect.any(String),
          sublabel: expect.any(String),
          value: expect.any(String),
          interpretation: expect.any(String),
          delta: expect.any(String),
          context: expect.any(String),
        }),
      );
      expect((item as { context: string }).context).toContain("Data contoh");
    });
  });

  it("mengembalikan data sesuai acceptance criteria", async () => {
    const response = await GET(
      new Request("http://localhost/api/insight/sekilas"),
    );
    const [layanan, realisasi, miskin] = await response.json();

    expect(layanan.label).toBe("Layanan");
    expect(layanan.sublabel).toBe("Tepat waktu");
    expect(layanan.value).toBe("88%");
    expect(layanan.delta).toBe("Unggul 13 poin persentase");
    expect(layanan.context).toBe("Kota Bandung · 2024 · Data contoh");

    expect(realisasi.label).toBe("Realisasi");
    expect(realisasi.sublabel).toBe("Anggaran");
    expect(realisasi.value).toBe("+50%");
    expect(realisasi.delta).toBe("90% anggaran terealisasi pada 2024");
    expect(realisasi.context).toBe("Kota Bandung · 2020-2024 · Data contoh");

    expect(miskin.label).toBe("Penduduk miskin");
    expect(miskin.sublabel).toBe("(%)");
    expect(miskin.value).toBe("3,8%");
    expect(miskin.delta).toBe("Lebih rendah = lebih baik");
    expect(miskin.context).toBe("Kota Bandung · 2024 · Data contoh");
  });

  it("terima parameter filter wilayah, fokus, dan periode", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/insight/sekilas?wilayah=Provinsi+Jawa+Barat&fokus=Kota+Bandung&periode=2024",
      ),
    );

    expect(response.status).toBe(200);
  });
});
