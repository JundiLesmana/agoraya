import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { registerCitizen } from "@/modules/citizen/service";
import { registerCitizenSchema } from "@/modules/citizen/schema";
import { formatError, isAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Permintaan tidak valid. Periksa kembali data yang Anda kirim." },
      { status: 400 },
    );
  }

  const parsed = registerCitizenSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Data pendaftaran tidak lengkap atau tidak valid.",
        issues: parsed.error.issues.map((issue) => issue.path.join(".")),
      },
      { status: 400 },
    );
  }

  try {
    const result = await registerCitizen(parsed.data);
    return NextResponse.json(
      {
        ok: true,
        message: "Pendaftaran warga berhasil. Akun Anda sedang diproses verifikasi.",
        data: {
          nik: result.nik,
          email: result.email,
          status: result.status,
        },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logger.error("api.citizen.register_failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    if (isAppError(error)) {
      return NextResponse.json(
        formatError(error, { isDev: process.env.NODE_ENV === "development" }),
        { status: error.statusCode, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat mendaftar. Silakan coba kembali nanti.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
