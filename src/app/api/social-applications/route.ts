import { NextResponse } from "next/server";
import { z } from "zod";
import type {
  SocialApplicationPayload,
  SocialApplicationPayloadByServiceType,
} from "@/lib/social-applications/types";
import { persistServiceApplication } from "@/lib/service-applications/persistence";
import { logger } from "@/lib/logger";

const commonDataSchema = {
  namaPemohon: z.string().trim().min(1).max(200),
  kontakNotifikasi: z.email(),
  nik: z.string().regex(/^\d{16}$/),
  kecamatan: z.string().trim().min(1).max(200),
  kelurahan: z.string().trim().min(1).max(200),
  judulPengajuan: z.string().trim().min(1).max(200),
  detailKebutuhan: z.string().trim().min(1).max(5_000),
};

const kebutuhanDasarSchema = z.strictObject({
  category: z.literal("social"),
  serviceType: z.literal("KebutuhanDasar"),
  serviceId: z.literal("kebutuhan-dasar"),
  data: z.strictObject({
    ...commonDataSchema,
    jenisKebutuhan: z.string().trim().min(1).max(200),
    jumlahAnggotaKeluarga: z.string().trim().min(1).max(20),
  }),
});

const dukunganKeluargaSchema = z.strictObject({
  category: z.literal("social"),
  serviceType: z.literal("DukunganKeluarga"),
  serviceId: z.literal("dukungan-keluarga"),
  data: z.strictObject({
    ...commonDataSchema,
    jenisDukungan: z.string().trim().min(1).max(200),
    hubunganPemohon: z.string().trim().min(1).max(100),
  }),
});

const bantuanDaruratSchema = z.strictObject({
  category: z.literal("social"),
  serviceType: z.literal("BantuanDarurat"),
  serviceId: z.literal("bantuan-darurat"),
  data: z.strictObject({
    ...commonDataSchema,
    jenisDarurat: z.string().trim().min(1).max(200),
    lokasiKejadian: z.string().trim().min(1).max(500),
    tanggalKejadian: z.iso.date(),
  }),
});

const socialApplicationSchema = z.union([
  kebutuhanDasarSchema,
  dukunganKeluargaSchema,
  bantuanDaruratSchema,
]);

const payloadValidators: {
  [K in SocialApplicationPayload["serviceType"]]: z.ZodType<
    SocialApplicationPayloadByServiceType<K>
  >;
} = {
  KebutuhanDasar: kebutuhanDasarSchema,
  DukunganKeluarga: dukunganKeluargaSchema,
  BantuanDarurat: bantuanDaruratSchema,
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format permintaan layanan sosial tidak valid." },
      { status: 400 },
    );
  }

  const parsed = socialApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload layanan sosial tidak valid." },
      { status: 400 },
    );
  }

  const serviceValidator = payloadValidators[parsed.data.serviceType];
  const serviceParsed = serviceValidator.safeParse(parsed.data);
  if (!serviceParsed.success) {
    return NextResponse.json(
      { error: "Payload layanan sosial tidak valid." },
      { status: 400 },
    );
  }

  const routeKey = `social:${serviceParsed.data.serviceId}`;
  try {
    const persisted = await persistServiceApplication(serviceParsed.data);
    if (!persisted.ok) {
      return NextResponse.json(
        { error: persisted.error },
        { status: persisted.status },
      );
    }
    return NextResponse.json({
      valid: true,
      routeKey,
      trackingNumber: persisted.trackingNumber,
      submittedAt: persisted.submittedAt,
      received: serviceParsed.data,
    });
  } catch (error) {
    logger.error("social_applications.persist_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
      routeKey,
    });
    return NextResponse.json(
      { error: "Pengajuan layanan sosial gagal disimpan. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
