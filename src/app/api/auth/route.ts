import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { roles, userRoles, users } from "@/modules/identity/db";
import { createSession, destroySession } from "@/modules/identity/session";
import { generateOtp, verifyOtp } from "@/modules/identity/otp";
import { BrevoEmailClient } from "@/modules/notifications/brevo";
import { renderNotificationTemplate } from "@/modules/notifications/templates";

const authActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("request-otp"),
    identifier: z.string().email().max(255),
  }),
  z.object({
    action: z.literal("verify-otp"),
    identifier: z.string().email().max(255),
    code: z
      .string()
      .length(6)
      .regex(/^\d{6}$/),
  }),
]);

async function findActiveAsnUser(identifier: string) {
  const database = db();
  const [user] = await database
    .select({
      id: users.id,
      tenantId: users.tenantId,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(
      and(
        sql`lower(${users.email}) = ${identifier.toLowerCase()}`,
        eq(users.status, "active"),
      ),
    )
    .limit(1);

  if (!user) return null;

  const activeRoles = await database
    .select({ key: roles.key })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(
      and(
        eq(userRoles.userId, user.id),
        eq(roles.tenantId, user.tenantId),
        isNull(userRoles.revokedAt),
        or(isNull(userRoles.expiresAt), gt(userRoles.expiresAt, new Date())),
      ),
    );
  const roleKeys = activeRoles.map(({ key }) => key);
  if (!roleKeys.some((key) => key === "asn" || key === "staff")) return null;

  return { ...user, roles: roleKeys };
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Permintaan tidak valid." },
      { status: 400 },
    );
  }

  const parsed = authActionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data login tidak valid." },
      { status: 400 },
    );
  }

  const identifier = parsed.data.identifier.trim().toLowerCase();
  if (parsed.data.action === "request-otp") {
    const user = await findActiveAsnUser(identifier);
    if (!user) {
      return NextResponse.json({
        message:
          "Jika akun terdaftar, kode verifikasi akan dikirim ke email tersebut.",
      });
    }

    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    if (!apiKey || !senderEmail) {
      return NextResponse.json(
        { error: "Layanan email belum dikonfigurasi. Hubungi administrator." },
        { status: 503 },
      );
    }

    const mailer = new BrevoEmailClient({
      apiKey,
      senderEmail,
      senderName: process.env.BREVO_SENDER_NAME,
    });
    try {
      await generateOtp(identifier, async (code) => {
        const message = renderNotificationTemplate("otp", {
          recipient: { email: user.email, name: user.name },
          variables: { code, expiresIn: "5 menit" },
        });
        await mailer.send(message);
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith("Too many OTP requests.")
      ) {
        return NextResponse.json(
          { error: "Terlalu banyak permintaan kode. Coba lagi beberapa saat." },
          { status: 429 },
        );
      }
      logger.error("auth.otp_delivery_failed", {
        errorType: error instanceof Error ? error.name : "UnknownError",
      });
      return NextResponse.json(
        { error: "Kode verifikasi tidak dapat dikirim. Coba lagi nanti." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      message:
        "Jika akun terdaftar, kode verifikasi akan dikirim ke email tersebut.",
    });
  }

  const verification = await verifyOtp(identifier, parsed.data.code);
  if (!verification.valid) {
    return NextResponse.json(
      { error: "Kode verifikasi tidak valid atau sudah kedaluwarsa." },
      { status: 401 },
    );
  }

  const user = await findActiveAsnUser(identifier);
  if (!user) {
    return NextResponse.json(
      { error: "Akun tidak memiliki akses ASN." },
      { status: 403 },
    );
  }

  const session = await createSession(user.id);
  const response = NextResponse.json({
    message: "Login berhasil.",
    roles: user.roles,
  });
  response.cookies.set(SESSION_COOKIE_NAME, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });
  return response;
}

export async function DELETE(): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) await destroySession(token);

  const response = NextResponse.json({ message: "Logout berhasil." });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
