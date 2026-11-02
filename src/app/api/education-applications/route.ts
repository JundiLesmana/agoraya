import { NextResponse } from "next/server";
import { z } from "zod";
import type {
  EducationApplicationPayload,
  EducationApplicationPayloadByServiceType,
} from "@/lib/education-applications/types";

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

const payloadValidators: {
  [K in EducationApplicationPayload["serviceType"]]: z.ZodType<EducationApplicationPayloadByServiceType<K>>;
} = {
  BantuanBiaya: bantuanSchema,
  AdministrasiSiswa: administrasiSchema,
  KonsultasiPendidikan: konsultasiSchema,
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = educationApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload layanan pendidikan tidak valid." }, { status: 400 });
  }

  const serviceValidator = payloadValidators[parsed.data.serviceType];
  const serviceParsed = serviceValidator.safeParse(parsed.data);
  if (!serviceParsed.success) {
    return NextResponse.json({ error: "Payload layanan pendidikan tidak valid." }, { status: 400 });
  }

  const routeKey = `education:${serviceParsed.data.serviceId}`;
  return NextResponse.json({ valid: true, routeKey, received: serviceParsed.data });
}
