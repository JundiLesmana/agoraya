import { NextResponse } from "next/server";

import { formatError, isAppError } from "@/lib/errors";
import { getCurrentSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

const KYC_REVIEWER_ROLES = ["admin", "superadmin", "kyc_verifikator"] as const;

export function isKycReviewer(roles: readonly string[]): boolean {
  return roles.some((role) => KYC_REVIEWER_ROLES.includes(role as (typeof KYC_REVIEWER_ROLES)[number]));
}

export async function requireKycReviewerApi() {
  const session = await getCurrentSession();
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    } as const;
  }

  if (!isKycReviewer(session.roles)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "KYC reviewer access required" }, { status: 403 }),
    } as const;
  }

  return { authorized: true, session } as const;
}

export function kycReviewerApiError(error: unknown): Response {
  const formatted = formatError(error);
  if (!isAppError(error) || formatted.statusCode >= 500) {
    logger.error("kyc.reviewer.request_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  }

  return NextResponse.json(formatted, { status: formatted.statusCode });
}
