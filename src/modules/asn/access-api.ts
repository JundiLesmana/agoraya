import { NextResponse } from "next/server";

import { formatError, isAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getCurrentSession } from "@/lib/auth/session";
import { isAsnAccessAdmin } from "./access-policy";

export async function requireAsnAccessAdmin() {
  const session = await getCurrentSession();
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    } as const;
  }
  if (!isAsnAccessAdmin(session.roles)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Superadmin access required" },
        { status: 403 },
      ),
    } as const;
  }
  return { authorized: true, session } as const;
}

export function accessApiError(error: unknown): Response {
  const formatted = formatError(error);
  if (!isAppError(error) || error.statusCode >= 500) {
    logger.error("asn.access.request_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  }
  return NextResponse.json(formatted, { status: formatted.statusCode });
}

export function invalidAccessRequest(
  message: string,
  details?: Readonly<Record<string, unknown>>,
): Response {
  return NextResponse.json(
    {
      code: "VALIDATION_ERROR",
      statusCode: 400,
      message,
      ...(details ? { details } : {}),
    },
    { status: 400 },
  );
}
