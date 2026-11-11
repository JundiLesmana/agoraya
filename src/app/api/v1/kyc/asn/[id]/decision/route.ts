import { NextResponse } from "next/server";
import { z } from "zod";

import { invalidAccessRequest } from "@/modules/asn/access-api";
import { db } from "@/lib/db";
import { isAppError } from "@/lib/errors";
import { appendAuditEvent } from "@/modules/audit";
import { createDrizzleKycRepository, DualApprovalService } from "@/modules/kyc";
import { getKycReviewDetail } from "@/modules/kyc/review-detail-service";
import { createAuditEventSink } from "@/modules/rbac/audit";
import { kycReviewerApiError, requireKycReviewerApi } from "@/modules/kyc/reviewer-access";

export const dynamic = "force-dynamic";

const routeParamsSchema = z.object({
  id: z.string().uuid(),
});

const decisionRequestSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  reason: z.string().trim().max(500).optional(),
});

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

async function auditRejectedRequest(
  actorId: string,
  tenantId: string,
  targetId: string | null,
  reason: string,
): Promise<void> {
  await appendAuditEvent(db(), {
    actorId,
    action: "kyc.request.anomaly",
    targetTable: "kyc_roster",
    targetId,
    metadata: {
      tenantId,
      result: "rejected",
      reason,
    },
    occurredAt: new Date(),
  });
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  let auditContext:
    | { readonly actorId: string; readonly tenantId: string; readonly rosterId: string }
    | null = null;
  try {
    const authorization = await requireKycReviewerApi();
    if (!authorization.authorized) return authorization.response;

    const parsedParams = routeParamsSchema.safeParse(await context.params);
    if (!parsedParams.success) {
      await auditRejectedRequest(
        authorization.session.userId,
        authorization.session.tenantId,
        null,
        "invalid_roster_id",
      );
      return invalidAccessRequest("ID review KYC tidak valid.");
    }

    const payload = decisionRequestSchema.safeParse(await request.json());
    if (!payload.success) {
      await auditRejectedRequest(
        authorization.session.userId,
        authorization.session.tenantId,
        parsedParams.data.id,
        "invalid_decision_payload",
      );
      return invalidAccessRequest("Payload keputusan review KYC tidak valid.", {
        issues: payload.error.issues.map((issue) => issue.path.join(".")),
      });
    }

    auditContext = {
      actorId: authorization.session.userId,
      tenantId: authorization.session.tenantId,
      rosterId: parsedParams.data.id,
    };
    const repository = createDrizzleKycRepository(db());
    const service = new DualApprovalService({
      repository,
      audit: createAuditEventSink(db()),
    });

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
    if (
      auditContext &&
      isAppError(error) &&
      [400, 403, 409].includes(error.statusCode)
    ) {
      await appendAuditEvent(db(), {
        actorId: auditContext.actorId,
        action: "kyc.approval.anomaly",
        targetTable: "kyc_roster",
        targetId: auditContext.rosterId,
        metadata: {
          tenantId: auditContext.tenantId,
          result: "rejected",
          reason: error.message,
        },
        occurredAt: new Date(),
      });
    }
    return kycReviewerApiError(error);
  }
}
