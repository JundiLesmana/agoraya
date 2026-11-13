import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { saveAsnStep1 } from "@/modules/asn/service";
import { formatError, isAppError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const step1Schema = z
  .object({
    nik: z
      .string()
      .min(16, "NIK harus 16 digit")
      .max(16, "NIK harus 16 digit")
      .regex(/^\d{16}$/, "NIK harus 16 digit angka"),
    name: z.string().min(2, "Nama minimal 2 karakter").max(255),
    birthPlace: z.string().min(1, "Tempat lahir wajib diisi").max(255),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    email: z.string().email("Format email tidak valid").min(1).max(255),
    phone: z
      .string()
      .min(8, "Nomor telepon minimal 8 digit")
      .max(32, "Nomor telepon terlalu panjang")
      .regex(/^[\d+\s()-]+$/, "Nomor telepon tidak valid"),
    password: z
      .string()
      .min(12, "Kata sandi minimal 12 karakter")
      .max(128, "Kata sandi terlalu panjang"),
    confirmPassword: z.string().min(1),
    address: z.string().min(1, "Alamat lengkap wajib diisi").max(500).optional(),
    rtRw: z.string().regex(/^\d{3}\/\d{3}$/).optional(),
    village: z.string().min(1, "Kelurahan wajib diisi").max(255).optional(),
    district: z.string().min(1, "Kecamatan wajib diisi").max(255).optional(),
    regency: z.string().min(1, "Kabupaten/Kota wajib diisi").max(255).optional(),
    province: z.string().min(1, "Provinsi wajib diisi").max(255).optional(),
    postalCode: z.string().regex(/^\d{5}$/).optional(),
    domicileSameAsKtp: z.boolean().optional(),
    domicileAddress: z.string().min(1).max(500).optional(),
    domicileRt: z.string().regex(/^\d{3}$/).optional(),
    domicileRw: z.string().regex(/^\d{3}$/).optional(),
    domicilePostalCode: z.string().regex(/^\d{5}$/).optional(),
    domicileProvince: z.string().min(1).max(255).optional(),
    domicileRegency: z.string().min(1).max(255).optional(),
    domicileDistrict: z.string().min(1).max(255).optional(),
    domicileVillage: z.string().min(1).max(255).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Permintaan tidak valid" },
      { status: 400 },
    );
  }

  const parsed = step1Schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Data identitas tidak lengkap atau tidak valid",
        issues: parsed.error.issues.map((i) => i.path.join(".")),
      },
      { status: 400 },
    );
  }

  try {
    const result = await saveAsnStep1(parsed.data);
    return NextResponse.json(
      { ok: true, data: result },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logger.error("api.asn.register.step1_failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    if (isAppError(error)) {
      return NextResponse.json(
        formatError(error, { isDev: process.env.NODE_ENV === "development" }),
        { status: error.statusCode, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan data step 1" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
