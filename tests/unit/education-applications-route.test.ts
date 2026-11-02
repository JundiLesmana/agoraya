import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/education-applications/route";

describe("education applications API", () => {
  it("accepts bantuan biaya payloads with the isolated route key", async () => {
    const response = await POST(
      new Request("http://localhost/api/education-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "education",
          serviceType: "BantuanBiaya",
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
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      valid: true,
      routeKey: "education:bantuan-biaya",
    });
  });

  it("accepts administrasi siswa payloads independently from bantuan biaya", async () => {
    const response = await POST(
      new Request("http://localhost/api/education-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "education",
          serviceType: "AdministrasiSiswa",
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
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      valid: true,
      routeKey: "education:administrasi-siswa",
      received: {
        serviceType: "AdministrasiSiswa",
        serviceId: "administrasi-siswa",
      },
    });
  });

  it("rejects payloads whose service type and payload shape are mismatched", async () => {
    const response = await POST(
      new Request("http://localhost/api/education-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "education",
          serviceType: "AdministrasiSiswa",
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
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Payload layanan pendidikan tidak valid.",
    });
  });
});
