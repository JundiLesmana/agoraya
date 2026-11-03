import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { saveAsnStep4 } from "@/modules/asn/service";
import { formatError, isAppError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const step4Schema = z.object({
  userId: z.string().uuid().optional(),
  draftId: z.string().uuid().optional(),
  ktpFileName: z.string().min(1),
  ktpFileSize: z.number().max(5 * 1024 * 1024),
  ktpMimeType: z.enum(["image/jpeg", "image/png", "application/pdf"]),
  skFileName: z.string().min(1),
  skFileSize: z.number().max(5 * 1024 * 1024),
  skMimeType: z.enum(["image/jpeg", "image/png", "application/pdf"]),
  selfieFileName: z.string().optional(),
  selfieFileSize: z.number().max(5 * 1024 * 1024).optional(),
  selfieMimeType: z.enum(["image/jpeg", "image/png"]).optional(),
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

  const parsed = step4Schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dokumen tidak valid atau tidak lengkap", issues: parsed.error.issues.map((i) => i.path.join(".")) },
      { status: 400 },
    );
  }

  try {
    const result = await saveAsnStep4(parsed.data);
    return NextResponse.json(
      { ok: true, data: result },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logger.error("api.asn.register.step4_failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    if (isAppError(error)) {
      return NextResponse.json(
        formatError(error, { isDev: process.env.NODE_ENV === "development" }),
        { status: error.statusCode, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan dokumen" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
