import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/health-applications/route";

function createPayload(
  serviceType:
    | "KonsultasiInformasi"
    | "PermohonanLayananPuskesmas"
    | "AduanFasilitasKesehatan",
) {
  const commonData = {
    namaPemohon: "Ayu",
    kontakNotifikasi: "ayu@example.test",
    kecamatan: "Kecamatan Melati",
    kelurahan: "Kelurahan Melati",
    judulPengajuan: "Permohonan layanan kesehatan",
    uraian: "Mohon informasi alur layanan.",
  };

  if (serviceType === "KonsultasiInformasi") {
    return {
      category: "health",
      serviceType,
      serviceId: "konsultasi-informasi",
      data: {
        ...commonData,
        topikKonsultasi: "Alur administrasi",
        puskesmasTujuan: "Puskesmas Melati",
      },
    } as const;
  }

  if (serviceType === "PermohonanLayananPuskesmas") {
    return {
      category: "health",
      serviceType,
      serviceId: "permohonan-layanan-puskesmas",
      data: {
        ...commonData,
        jenisLayanan: "Pendaftaran / jadwal layanan",
        namaPasien: "Ayu",
        tanggalPilihan: "2026-11-10",
        puskesmasTujuan: "Puskesmas Melati",
      },
    } as const;
  }

  return {
    category: "health",
    serviceType,
    serviceId: "aduan-fasilitas-kesehatan",
    data: {
      ...commonData,
      namaFasilitas: "Puskesmas Melati",
      lokasiFasilitas: "Jl. Melati No. 1",
      kategoriAduan: "Sarana dan prasarana",
    },
  } as const;
}

async function postPayload(payload: unknown) {
  return POST(
    new Request("http://localhost/api/health-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
}

describe("health applications API", () => {
  it.each([
    ["KonsultasiInformasi", "health:konsultasi-informasi"],
    ["PermohonanLayananPuskesmas", "health:permohonan-layanan-puskesmas"],
    ["AduanFasilitasKesehatan", "health:aduan-fasilitas-kesehatan"],
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

  it("rejects fields that do not belong to the selected health service", async () => {
    const payload = createPayload("KonsultasiInformasi");
    const response = await postPayload({
      ...payload,
      serviceType: "PermohonanLayananPuskesmas",
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Payload layanan kesehatan tidak valid.",
    });
  });
});
