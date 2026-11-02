import { NextResponse } from "next/server";
import { z } from "zod";

const sharedSchema = z.strictObject({
  category: z.literal("education"),
  serviceType: z.enum([
    "BantuanBiaya",
    "AdministrasiSiswa",
    "KonsultasiPendidikan",
  ]),
  serviceId: z.string().min(1),
});

const bantuanSchema = sharedSchema.extend({
  serviceType: z.literal("BantuanBiaya"),
  serviceId: z.literal("bantuan-biaya"),
  data: z.strictObject({
    namaPemohon: z.string(),
    kontakNotifikasi: z.string(),
    kecamatan: z.string(),
    kelurahan: z.string(),
    judulPengajuan: z.string(),
    detailKebutuhan: z.string(),
    jenjang: z.string(),
    kelas: z.string(),
  }),
});

const administrasiSchema = sharedSchema.extend({
  serviceType: z.literal("AdministrasiSiswa"),
  serviceId: z.literal("administrasi-siswa"),
  data: z.strictObject({
    namaPemohon: z.string(),
    kontakNotifikasi: z.string(),
    kecamatan: z.string(),
    kelurahan: z.string(),
    judulPengajuan: z.string(),
    namaSiswa: z.string(),
    hubungan: z.string(),
    namaSekolah: z.string(),
    jenjangKelas: z.string(),
    detailKebutuhan: z.string(),
  }),
});

const konsultasiSchema = sharedSchema.extend({
  serviceType: z.literal("KonsultasiPendidikan"),
  serviceId: z.literal("konsultasi-pendidikan"),
  data: z.strictObject({
    namaPemohon: z.string(),
    kontakNotifikasi: z.string(),
    kecamatan: z.string(),
    kelurahan: z.string(),
    judulPengajuan: z.string(),
    namaSiswa: z.string(),
    hubungan: z.string(),
    namaSekolah: z.string(),
    jenjangKelas: z.string(),
    detailKebutuhan: z.string(),
  }),
});

const educationApplicationSchema = z.union([
  bantuanSchema,
  administrasiSchema,
  konsultasiSchema,
]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = educationApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload layanan pendidikan tidak valid." }, { status: 400 });
  }

  const routeKey = `education:${parsed.data.serviceId}`;
  return NextResponse.json({ valid: true, routeKey, received: parsed.data });
}

