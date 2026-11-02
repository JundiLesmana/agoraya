import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/social-applications/route";

function createPayload(serviceType: "KebutuhanDasar" | "DukunganKeluarga" | "BantuanDarurat") {
  if (serviceType === "KebutuhanDasar") {
    return {
      category: "social",
      serviceType,
      serviceId: "kebutuhan-dasar",
      data: {
        namaPemohon: "Andi",
        kontakNotifikasi: "andi@example.test",
        nik: "1234567890123456",
        kecamatan: "Kecamatan Melati",
        kelurahan: "Kelurahan Melati",
        judulPengajuan: "Kebutuhan dasar keluarga",
        detailKebutuhan: "Butuh bantuan pangan dan kebutuhan dasar.",
        jenisKebutuhan: "Pangan",
        jumlahAnggotaKeluarga: "4",
      },
    } as const;
  }

  if (serviceType === "DukunganKeluarga") {
    return {
      category: "social",
      serviceType,
      serviceId: "dukungan-keluarga",
      data: {
        namaPemohon: "Siti",
        kontakNotifikasi: "siti@example.test",
        nik: "1234567890123456",
        kecamatan: "Kecamatan Melati",
        kelurahan: "Kelurahan Melati",
        judulPengajuan: "Dukungan keluarga",
        detailKebutuhan: "Butuh pendampingan keluarga.",
        jenisDukungan: "Pendampingan keluarga",
        hubunganPemohon: "Orang tua / wali",
      },
    } as const;
  }

  return {
    category: "social",
    serviceType,
    serviceId: "bantuan-darurat",
    data: {
      namaPemohon: "Budi",
      kontakNotifikasi: "budi@example.test",
      nik: "1234567890123456",
      kecamatan: "Kecamatan Melati",
      kelurahan: "Kelurahan Melati",
      judulPengajuan: "Bantuan darurat akibat kebakaran",
      detailKebutuhan: "Rumah terbakar dan butuh bantuan cepat.",
      jenisDarurat: "Kebakaran",
      lokasiKejadian: "Jl. Mawar No. 10",
      tanggalKejadian: "2026-11-01",
    },
  } as const;
}

describe("social applications API", () => {
  it("accepts kebutuhan dasar payloads with isolated route key", async () => {
    const response = await POST(
      new Request("http://localhost/api/social-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload("KebutuhanDasar")),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      valid: true,
      routeKey: "social:kebutuhan-dasar",
    });
  });

  it("accepts each social service independently from the others", async () => {
    const familyResponse = await POST(
      new Request("http://localhost/api/social-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload("DukunganKeluarga")),
      }),
    );

    const emergencyResponse = await POST(
      new Request("http://localhost/api/social-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload("BantuanDarurat")),
      }),
    );

    expect(familyResponse.status).toBe(200);
    await expect(familyResponse.json()).resolves.toMatchObject({
      valid: true,
      routeKey: "social:dukungan-keluarga",
    });

    expect(emergencyResponse.status).toBe(200);
    await expect(emergencyResponse.json()).resolves.toMatchObject({
      valid: true,
      routeKey: "social:bantuan-darurat",
    });
  });

  it("rejects mismatched service type and payload shape", async () => {
    const payload = createPayload("KebutuhanDasar");
    const response = await POST(
      new Request("http://localhost/api/social-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, serviceType: "DukunganKeluarga" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Payload layanan sosial tidak valid.",
    });
  });
});
