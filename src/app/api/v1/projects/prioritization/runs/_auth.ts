import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { requireModuleAccess } from "@/lib/auth/require-module-access";
import type { Session } from "@/lib/auth/session";
import { mapServiceError } from "@/modules/decision-engine/service";

const ALLOWED_ROLES: readonly string[] = ["asn", "staff"];

export interface AuthorizedSession {
  readonly session: Session;
}

export async function authorizeSession(): Promise<AuthorizedSession | Response> {
  const authorization = await requireModuleAccess("pst");
  if (!authorization.authorized) return authorization.response;
  const session = authorization.session;
  if (
    !session ||
    !session.roles.some((role) => ALLOWED_ROLES.includes(role))
  ) {
    logger.warn("decision_engine.runs.role_denied", {
      actorId: session?.userId,
      tenantId: session?.tenantId,
    });
    return NextResponse.json(
      { error: "Role tidak diizinkan untuk mengakses prioritas proyek." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return { session };
}

export function noStoreHeaders(): Record<string, string> {
  return { "Cache-Control": "no-store" };
}

export function badRequestResponse(message: string): Response {
  return NextResponse.json(
    { error: message },
    { status: 400, headers: noStoreHeaders() },
  );
}

export function serviceErrorResponse(error: unknown): Response {
  const { statusCode, body } = mapServiceError(error);
  return NextResponse.json(body, { status: statusCode, headers: noStoreHeaders() });
}
