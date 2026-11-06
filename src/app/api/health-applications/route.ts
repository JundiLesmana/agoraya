import { NextResponse } from "next/server";
import { z } from "zod";
import type {
  HealthApplicationPayload,
  HealthApplicationPayloadByServiceType,
} from "@/lib/health-applications/types";
import { persistServiceApplication } from "@/lib/service-applications/persistence";
import { logger } from "@/lib/logger";

const commonDataSchema = {
  namaPemohon: z.string().trim().min(1).max(200),
  kontakNotifikasi: z.email(),
  kecamatan: z.string().trim().min(1).max(200),
  kelurahan: z.string().trim().min(1).max(200),
  judulPengajuan: z.string().trim().min(1).max(200),
  uraian: z.string().trim().min(1).max(5_000),
};

const consultationSchema = z.strictObject({
  category: z.literal("health"),
  serviceType: z.literal("KonsultasiInformasi"),
  serviceId: z.literal("konsultasi-informasi"),
  data: z.strictObject({
    ...commonDataSchema,
    topikKonsultasi: z.string().trim().min(1).max(200),
    puskesmasTujuan: z.string().trim().min(1).max(200),
  }),
});

const puskesmasRequestSchema = z.strictObject({
  category: z.literal("health"),
  serviceType: z.literal("PermohonanLayananPuskesmas"),
  serviceId: z.literal("permohonan-layanan-puskesmas"),
  data: z.strictObject({
    ...commonDataSchema,
    jenisLayanan: z.string().trim().min(1).max(200),
    namaPasien: z.string().trim().min(1).max(200),
    tanggalPilihan: z.iso.date(),
    puskesmasTujuan: z.string().trim().min(1).max(200),
  }),
});

const facilityComplaintSchema = z.strictObject({
  category: z.literal("health"),
  serviceType: z.literal("AduanFasilitasKesehatan"),
  serviceId: z.literal("aduan-fasilitas-kesehatan"),
  data: z.strictObject({
    ...commonDataSchema,
    namaFasilitas: z.string().trim().min(1).max(200),
    lokasiFasilitas: z.string().trim().min(1).max(500),
    kategoriAduan: z.string().trim().min(1).max(200),
  }),
});

const healthApplicationSchema = z.union([
  consultationSchema,
  puskesmasRequestSchema,
  facilityComplaintSchema,
]);

const payloadValidators: {
  [K in HealthApplicationPayload["serviceType"]]: z.ZodType<
    HealthApplicationPayloadByServiceType<K>
  >;
} = {
  KonsultasiInformasi: consultationSchema,
  PermohonanLayananPuskesmas: puskesmasRequestSchema,
  AduanFasilitasKesehatan: facilityComplaintSchema,
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format permintaan layanan kesehatan tidak valid." },
      { status: 400 },
    );
  }

  const parsed = healthApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload layanan kesehatan tidak valid." },
      { status: 400 },
    );
  }

  const serviceValidator = payloadValidators[parsed.data.serviceType];
  const serviceParsed = serviceValidator.safeParse(parsed.data);
  if (!serviceParsed.success) {
    return NextResponse.json(
      { error: "Payload layanan kesehatan tidak valid." },
      { status: 400 },
    );
  }

  const routeKey = `health:${serviceParsed.data.serviceId}`;
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
    logger.error("health_applications.persist_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
      routeKey,
    });
    return NextResponse.json(
      {
        error:
          "Pengajuan layanan kesehatan gagal disimpan. Silakan coba kembali.",
      },
      { status: 500 },
    );
  }
}
