import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { submitAsnRegistration } from "@/modules/asn/service";
import { formatError, isAppError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const step5Schema = z.object({
  userId: z.string().uuid().optional(),
  draftId: z.string().uuid().optional(),
  agreed: z.literal(true),
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

  const parsed = step5Schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Anda harus menyetujui pernyataan sebelum mengirim pengajuan." },
      { status: 400 },
    );
  }

  try {
    const result = await submitAsnRegistration(parsed.data as any);
    return NextResponse.json(
      { success: true, ...result },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logger.error("api.asn.register.step5_failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    if (isAppError(error)) {
      return NextResponse.json(
        formatError(error, { isDev: process.env.NODE_ENV === "development" }),
        { status: error.statusCode, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengirim pengajuan" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
