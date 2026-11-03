import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { saveAsnStep3 } from "@/modules/asn/service";
import { formatError, isAppError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const step3Schema = z.object({
  userId: z.string().uuid().optional(),
  draftId: z.string().uuid().optional(),
  ktpAddress: z.string().min(10).max(500),
  ktpRt: z.string().regex(/^\d{3}$/),
  ktpRw: z.string().regex(/^\d{3}$/),
  ktpPostalCode: z.string().regex(/^\d{5}$/),
  ktpProvince: z.string().min(1),
  ktpRegency: z.string().min(1),
  ktpDistrict: z.string().min(1),
  ktpVillage: z.string().min(1),
  sameAsKtp: z.boolean(),
  domAddress: z.string().min(10).max(500),
  domRt: z.string().regex(/^\d{3}$/),
  domRw: z.string().regex(/^\d{3}$/),
  domPostalCode: z.string().regex(/^\d{5}$/),
  domProvince: z.string().min(1),
  domRegency: z.string().min(1),
  domDistrict: z.string().min(1),
  domVillage: z.string().min(1),
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

  const parsed = step3Schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data alamat tidak lengkap atau tidak valid", issues: parsed.error.issues.map((i) => i.path.join(".")) },
      { status: 400 },
    );
  }

  try {
    const result = await saveAsnStep3(parsed.data);
    return NextResponse.json(
      { ok: true, data: result },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logger.error("api.asn.register.step3_failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    if (isAppError(error)) {
      return NextResponse.json(
        formatError(error, { isDev: process.env.NODE_ENV === "development" }),
        { status: error.statusCode, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan data alamat" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
