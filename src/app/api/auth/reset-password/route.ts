import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  resetPassword,
  resetPasswordSchema,
  resetPasswordTokenSchema,
} from "@/modules/identity/password-reset/service";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const bodyRecord =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>)
        : {};
    if (!resetPasswordTokenSchema.safeParse(bodyRecord.token).success) {
      return NextResponse.json(
        {
          error:
            "Link reset tidak valid atau token tidak ditemukan. Minta link reset baru.",
          code: "INVALID_RESET_TOKEN",
        },
        { status: 400 },
      );
    }

    const passwordError = parsed.error.issues.find(
      (issue) => issue.path[0] === "password",
    )?.message;
    return NextResponse.json(
      {
        error: passwordError ?? "Kata sandi belum memenuhi persyaratan.",
        code: "INVALID_PASSWORD",
      },
      { status: 400 },
    );
  }

  const { token, password } = parsed.data;
  try {
    await resetPassword(token, password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as { statusCode?: number }).statusCode ?? 400 });
    }
    logger.error("password_reset.reset_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: "Gagal memperbarui kata sandi. Token mungkin tidak valid atau telah kedaluwarsa.",
      },
      { status: 400 },
    );
  }
}
