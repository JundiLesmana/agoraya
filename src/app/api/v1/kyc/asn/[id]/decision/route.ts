import { NextResponse } from "next/server";
import { z } from "zod";

import { invalidAccessRequest } from "@/modules/asn/access-api";
import { db } from "@/lib/db";
import { createDrizzleKycRepository, DualApprovalService } from "@/modules/kyc";
import { getKycReviewDetail } from "@/modules/kyc/review-detail-service";
import { kycReviewerApiError, requireKycReviewerApi } from "@/modules/kyc/reviewer-access";

export const dynamic = "force-dynamic";

const routeParamsSchema = z.object({
  id: z.string().min(1).max(64),
});

const decisionRequestSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  reason: z.string().trim().max(500).optional(),
});

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  try {
    const authorization = await requireKycReviewerApi();
    if (!authorization.authorized) return authorization.response;

    const parsedParams = routeParamsSchema.safeParse(await context.params);
    if (!parsedParams.success) {
      return invalidAccessRequest("ID review KYC tidak valid.");
    }

    const payload = decisionRequestSchema.safeParse(await request.json());
    if (!payload.success) {
      return invalidAccessRequest("Payload keputusan review KYC tidak valid.", {
        issues: payload.error.issues.map((issue) => issue.path.join(".")),
      });
    }

    const repository = createDrizzleKycRepository(db());
    const service = new DualApprovalService({ repository });

    await service.submitApproval({
      tenantId: authorization.session.tenantId,
      rosterId: parsedParams.data.id,
      approverId: authorization.session.userId,
      decision: payload.data.decision,
      reason: payload.data.reason,
    });

    const data = await getKycReviewDetail(
      parsedParams.data.id,
      authorization.session.tenantId,
      authorization.session.userId,
    );

    return NextResponse.json({ data });
  } catch (error) {
    return kycReviewerApiError(error);
  }
}
