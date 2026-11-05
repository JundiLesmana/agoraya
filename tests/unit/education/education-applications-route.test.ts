import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/education-applications/route";
import { persistServiceApplication } from "@/lib/service-applications/persistence";

vi.mock("@/lib/service-applications/persistence", () => ({
  persistServiceApplication: vi.fn(),
}));

describe("education applications API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(persistServiceApplication).mockImplementation(async (payload) => ({
      ok: true,
      trackingNumber: "EDU-261105-00001",
      submittedAt: "2026-11-05T10:00:00.000Z",
      routeKey: `${payload.category}:${payload.serviceId}`,
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function createPayload(
    serviceType: "BantuanBiaya" | "AdministrasiSiswa" | "KonsultasiPendidikan",
  ) {
    if (serviceType === "BantuanBiaya") {
      return {
        category: "education",
        serviceType,
        serviceId: "bantuan-biaya",
        data: {
          namaPemohon: "Andi",
          kontakNotifikasi: "andi@example.test",
          kecamatan: "Kecamatan Melati",
          kelurahan: "Kelurahan Melati",
          judulPengajuan: "Usulan bantuan perlengkapan sekolah",
          detailKebutuhan: "Butuh seragam sekolah.",
          jenjang: "SD / MI",
          kelas: "Kelas IV",
        },
      } as const;
    }

    if (serviceType === "AdministrasiSiswa") {
      return {
        category: "education",
        serviceType,
        serviceId: "administrasi-siswa",
        data: {
          namaPemohon: "Siti",
          kontakNotifikasi: "siti@example.test",
          kecamatan: "Kecamatan Melati",
          kelurahan: "Kelurahan Melati",
          judulPengajuan: "Permohonan Surat Keterangan Pindah / Mutasi Siswa",
          namaSiswa: "Rina",
          hubungan: "Orang tua / wali",
          namaSekolah: "SMP Negeri 1 Melati",
          jenjangKelas: "SMP / Kelas VIII",
          detailKebutuhan: "Meminta surat mutasi ke sekolah tujuan.",
        },
      } as const;
    }

    return {
      category: "education",
      serviceType,
      serviceId: "konsultasi-pendidikan",
      data: {
        namaPemohon: "Budi",
        kontakNotifikasi: "budi@example.test",
        kecamatan: "Kecamatan Melati",
        kelurahan: "Kelurahan Melati",
        judulPengajuan: "Konsultasi Pilihan Belajar & Dokumen Masuk SMP",
        namaSiswa: "Andi Pratama",
        hubungan: "Orang tua / wali",
        namaSekolah: "SMP Negeri 1 Melati",
        jenjangKelas: "SMP / Kelas VII",
        detailKebutuhan: "Meminta arahan jalur masuk dan penyesuaian belajar.",
      },
    } as const;
  }

  it("accepts bantuan biaya payloads with the isolated route key", async () => {
    const response = await POST(new Request("http://localhost/api/education-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload("BantuanBiaya")),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      valid: true,
      routeKey: "education:bantuan-biaya",
      trackingNumber: "EDU-261105-00001",
    });
    expect(persistServiceApplication).toHaveBeenCalledWith(
      expect.objectContaining({ category: "education", serviceType: "BantuanBiaya" }),
    );
  });

  it("accepts administrasi siswa payloads independently from bantuan biaya", async () => {
    const response = await POST(new Request("http://localhost/api/education-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload("AdministrasiSiswa")),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      valid: true,
      routeKey: "education:administrasi-siswa",
      trackingNumber: "EDU-261105-00001",
      received: {
        serviceType: "AdministrasiSiswa",
        serviceId: "administrasi-siswa",
      },
    });
  });

  it("rejects payloads whose service type and payload shape are mismatched", async () => {
    const payload = createPayload("BantuanBiaya");
    const response = await POST(new Request("http://localhost/api/education-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, serviceType: "AdministrasiSiswa" }),
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Payload layanan pendidikan tidak valid.",
    });
  });

  it("accepts consultation payloads with consultation-only route isolation", async () => {
    const response = await POST(new Request("http://localhost/api/education-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload("KonsultasiPendidikan")),
    }));

    const mixedPayload = createPayload("KonsultasiPendidikan");
    const mixedResponse = await POST(new Request("http://localhost/api/education-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...mixedPayload,
        data: {
          ...mixedPayload.data,
          detailKebutuhan: 123 as unknown as string,
        },
      }),
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      valid: true,
      routeKey: "education:konsultasi-pendidikan",
      trackingNumber: "EDU-261105-00001",
      received: {
        serviceType: "KonsultasiPendidikan",
        serviceId: "konsultasi-pendidikan",
      },
    });

    expect(mixedResponse.status).toBe(400);
    await expect(mixedResponse.json()).resolves.toMatchObject({
      error: "Payload layanan pendidikan tidak valid.",
    });
  });
});
