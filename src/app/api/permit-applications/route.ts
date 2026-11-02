import { NextResponse } from "next/server";
import { z } from "zod";
import type {
  PermitApplicationPayload,
  PermitApplicationPayloadByServiceType,
} from "@/lib/permit-applications/types";

const commonDataSchema = {
  namaPemohon: z.string().trim().min(1).max(200),
  kontakNotifikasi: z.email(),
  kecamatan: z.string().trim().min(1).max(200),
  kelurahan: z.string().trim().min(1).max(200),
  judulPermohonan: z.string().trim().min(1).max(200),
  uraian: z.string().trim().min(1).max(5_000),
};

const nibUsahaMikroSchema = z.strictObject({
  category: z.literal("permit"),
  serviceType: z.literal("NibUsahaMikro"),
  serviceId: z.literal("nib-usaha-mikro"),
  data: z.strictObject({
    ...commonDataSchema,
    namaUsaha: z.string().trim().min(1).max(200),
    bidangUsaha: z.string().trim().min(1).max(200),
    alamatUsaha: z.string().trim().min(1).max(500),
    statusKepemilikanTempat: z.string().trim().min(1).max(100),
  }),
});

const izinKegiatanSchema = z.strictObject({
  category: z.literal("permit"),
  serviceType: z.literal("IzinKegiatan"),
  serviceId: z.literal("izin-kegiatan"),
  data: z.strictObject({
    ...commonDataSchema,
    namaKegiatan: z.string().trim().min(1).max(200),
    jenisKegiatan: z.string().trim().min(1).max(200),
    tanggalKegiatan: z.iso.date(),
    lokasiKegiatan: z.string().trim().min(1).max(500),
  }),
});

const perizinanLainnyaSchema = z.strictObject({
  category: z.literal("permit"),
  serviceType: z.literal("PerizinanLainnya"),
  serviceId: z.literal("perizinan-lainnya"),
  data: z.strictObject({
    ...commonDataSchema,
    jenisIzin: z.string().trim().min(1).max(200),
    namaUsaha: z.string().trim().min(1).max(200),
    alamatUsaha: z.string().trim().min(1).max(500),
    tujuanIzin: z.string().trim().min(1).max(1_000),
  }),
});

const permitApplicationSchema = z.union([
  nibUsahaMikroSchema,
  izinKegiatanSchema,
  perizinanLainnyaSchema,
]);

const payloadValidators: {
  [K in PermitApplicationPayload["serviceType"]]: z.ZodType<
    PermitApplicationPayloadByServiceType<K>
  >;
} = {
  NibUsahaMikro: nibUsahaMikroSchema,
  IzinKegiatan: izinKegiatanSchema,
  PerizinanLainnya: perizinanLainnyaSchema,
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format permintaan layanan perizinan tidak valid." },
      { status: 400 },
    );
  }

  const parsed = permitApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload layanan perizinan tidak valid." },
      { status: 400 },
    );
  }

  const serviceValidator = payloadValidators[parsed.data.serviceType];
  const serviceParsed = serviceValidator.safeParse(parsed.data);
  if (!serviceParsed.success) {
    return NextResponse.json(
      { error: "Payload layanan perizinan tidak valid." },
      { status: 400 },
    );
  }

  const routeKey = `permit:${serviceParsed.data.serviceId}`;
  return NextResponse.json({
    valid: true,
    routeKey,
    received: serviceParsed.data,
  });
}
