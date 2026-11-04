import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getEnv } from "@/lib/env";
import { BrevoEmailClient, renderNotificationTemplate } from "@/modules/notifications";
import { createPasswordResetToken, forgotPasswordSchema } from "@/modules/identity/password-reset/service";

const GENERIC_SUCCESS_MESSAGE =
  "Jika akun Anda terdaftar, link reset kata sandi telah dikirim ke email Anda.";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "NIK harus 16 digit atau alamat email yang valid." },
      { status: 400 },
    );
  }

  const { identifier } = parsed.data;
  let issued = false;
  let recipientEmail: string | undefined;
  let token: string | undefined;

  try {
    const result = await createPasswordResetToken(identifier);
    issued = result.issued;
    recipientEmail = result.recipientEmail;
    token = result.token;
  } catch (error) {
    if (error instanceof Error && "statusCode" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as { statusCode?: number }).statusCode ?? 400 });
    }
    logger.error("password_reset.request_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: "Layanan pemulihan akun sedang tidak tersedia. Silakan coba beberapa saat lagi.",
      },
      { status: 503 },
    );
  }

  if (issued && token && recipientEmail) {
    try {
      const env = getEnv();
      if (env.BREVO_API_KEY && env.BREVO_SENDER_EMAIL) {
        const brevo = new BrevoEmailClient({
          apiKey: env.BREVO_API_KEY,
          senderEmail: env.BREVO_SENDER_EMAIL,
          senderName: env.BREVO_SENDER_NAME,
        });
        const resetUrl = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
        const message = renderNotificationTemplate("password-reset", {
          recipient: { email: recipientEmail },
          variables: { resetUrl, expiresIn: "1 jam" },
        });
        await brevo.send(message);
        logger.info("password_reset.email_sent");
      } else {
        logger.warn("password_reset.brevo_not_configured");
      }
    } catch (error) {
      logger.error("password_reset.email_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return NextResponse.json({ message: GENERIC_SUCCESS_MESSAGE });
}
