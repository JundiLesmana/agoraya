import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/permit-applications/route";

function createPayload(
  serviceType: "NibUsahaMikro" | "IzinKegiatan" | "PerizinanLainnya",
) {
  const commonData = {
    namaPemohon: "Ayu",
    kontakNotifikasi: "ayu@example.test",
    kecamatan: "Kecamatan Melati",
    kelurahan: "Kelurahan Melati",
    judulPermohonan: "Permohonan layanan",
    uraian: "Informasi kebutuhan izin.",
  };

  if (serviceType === "NibUsahaMikro") {
    return {
      category: "permit",
      serviceType,
      serviceId: "nib-usaha-mikro",
      data: {
        ...commonData,
        namaUsaha: "Dapur Melati",
        bidangUsaha: "Makanan dan minuman",
        alamatUsaha: "Jl. Melati No. 12",
        statusKepemilikanTempat: "Milik sendiri",
      },
    } as const;
  }

  if (serviceType === "IzinKegiatan") {
    return {
      category: "permit",
      serviceType,
      serviceId: "izin-kegiatan",
      data: {
        ...commonData,
        namaKegiatan: "Pasar warga",
        jenisKegiatan: "Kegiatan warga",
        tanggalKegiatan: "2026-11-10",
        lokasiKegiatan: "Balai warga Melati",
      },
    } as const;
  }

  return {
    category: "permit",
    serviceType,
    serviceId: "perizinan-lainnya",
    data: {
      ...commonData,
      jenisIzin: "Izin operasional",
      namaUsaha: "Toko Melati",
      alamatUsaha: "Jl. Mawar No. 2",
      tujuanIzin: "Mengurus izin operasional.",
    },
  } as const;
}

async function postPayload(payload: unknown) {
  return POST(
    new Request("http://localhost/api/permit-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

describe("permit applications API", () => {
  it.each([
    ["NibUsahaMikro", "permit:nib-usaha-mikro"],
    ["IzinKegiatan", "permit:izin-kegiatan"],
    ["PerizinanLainnya", "permit:perizinan-lainnya"],
  ] as const)(
    "isolates %s under its own route key",
    async (serviceType, routeKey) => {
      const response = await postPayload(createPayload(serviceType));

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        valid: true,
        routeKey,
      });
    },
  );

  it("rejects service IDs and fields that do not match the selected service", async () => {
    const payload = createPayload("NibUsahaMikro");
    const response = await postPayload({
      ...payload,
      serviceType: "IzinKegiatan",
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Payload layanan perizinan tidak valid.",
    });
  });
});
