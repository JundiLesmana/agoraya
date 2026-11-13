import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { authenticatePassword } from "@/modules/identity/password/service";
import {
  createSession,
  destroySession,
  validateSession,
} from "@/modules/identity/session/service";

import { cookies } from "next/headers";
import { getCurrentSession } from "@/lib/auth/session";
import { getDefaultDatabase } from "@/lib/db/client";
const SESSION_COOKIE = "agoraya_session";

function computeRedirect(
  roles: string[],
  applicationRoles: string[],
  apbdAssigned: boolean,
): string {
  const roleSet = new Set(roles);
  const appRoleSet = new Set(applicationRoles);

  if (roleSet.has("superadmin") || roleSet.has("admin")) {
    return "/admin";
  }

  if (appRoleSet.has("kyc_verifikator")) {
    if (roleSet.has("asn")) {
      return "/admin/kyc/asn";
    }
    return "/admin/kyc/citizen";
  }

  if (apbdAssigned) {
    return "/apbd";
  }

  if (roleSet.has("asn")) {
    return "/asn/dashboard";
  }

  if (roleSet.has("staff")) {
    return "/asn/dashboard";
  }

  if (roleSet.has("citizen")) {
    return "/citizen/service";
  }

  return "/";
}

export async function GET() {
  const session = await getCurrentSession();
  return NextResponse.json(
    { authenticated: Boolean(session), roles: session?.roles ?? [] },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await destroySession(token);
  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
  return response;
}
const IDENTIFIER_MAX_LENGTH = 255;
const PASSWORD_MAX_LENGTH = 256;

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    logger.error("auth.login_failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Periksa kembali NIK/email dan kata sandi Anda." },
      { status: 400 },
    );
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { error: "Periksa kembali NIK/email dan kata sandi Anda." },
      { status: 400 },
    );
  }

  const { identifier, password } = payload as Record<string, unknown>;
  if (
    typeof identifier !== "string" ||
    typeof password !== "string" ||
    identifier.trim().length === 0 ||
    identifier.length > IDENTIFIER_MAX_LENGTH ||
    password.length === 0 ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    return NextResponse.json(
      { error: "Periksa kembali NIK/email dan kata sandi Anda." },
      { status: 400 },
    );
  }

  try {
    const result = await authenticatePassword(identifier, password);
    if (!result.authenticated) {
      return NextResponse.json(
        {
          error: result.rateLimited
            ? "Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit."
            : "NIK/email atau kata sandi tidak sesuai.",
        },
        {
          status: result.rateLimited ? 429 : 401,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const session = await createSession(result.userId);
    const validation = await validateSession(session.token);
    if (!validation.valid) {
      await destroySession(session.token);
      return NextResponse.json(
        { error: "Akun belum memiliki akses aktif." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    const roles = validation.roles ?? [];
    const applicationRoles = validation.applicationRoles ?? [];

    let apbdAssigned = false;
    try {
      const database = getDefaultDatabase();
      const assignment = await database.queryOne<{ id: string }>(
        `SELECT id::text AS id FROM apbd_operator_assignments
         WHERE user_id = $1 AND tenant_id = $2 LIMIT 1`,
        [validation.userId, validation.tenantId],
      );
      apbdAssigned = Boolean(assignment);
    } catch {
      apbdAssigned = false;
    }

    const redirectTo = computeRedirect(
      roles,
      applicationRoles,
      apbdAssigned,
    );

    const response = NextResponse.json(
      {
        ok: true,
        roles,
        applicationRoles,
        redirectTo,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt,
    });
    return response;
  } catch {
    return NextResponse.json(
      {
        error:
          "Layanan masuk sedang tidak tersedia. Silakan coba beberapa saat lagi.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
