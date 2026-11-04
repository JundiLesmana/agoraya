import { NextResponse } from "next/server";
import { z } from "zod";

import { invalidAccessRequest } from "@/modules/asn/access-api";
import { kycReviewerApiError, requireKycReviewerApi } from "@/modules/kyc/reviewer-access";
import { getKycReviewDetail } from "@/modules/kyc/review-detail-service";

export const dynamic = "force-dynamic";

const rosterIdSchema = z.string().min(1).max(64);

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const authorization = await requireKycReviewerApi();
    if (!authorization.authorized) return authorization.response;

    const { id } = await context.params;
    const parsedId = rosterIdSchema.safeParse(id);
    if (!parsedId.success) {
      return invalidAccessRequest("ID review KYC tidak valid.");
    }

    const data = await getKycReviewDetail(
      parsedId.data,
      authorization.session.tenantId,
      authorization.session.userId,
    );

    return NextResponse.json({ data });
  } catch (error) {
    return kycReviewerApiError(error);
  }
}
