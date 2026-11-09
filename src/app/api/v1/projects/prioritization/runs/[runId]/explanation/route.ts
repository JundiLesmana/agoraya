import { NextResponse } from "next/server";
import { z } from "zod";

import {
  authorizeSession,
  badRequestResponse,
  noStoreHeaders,
  serviceErrorResponse,
} from "../../_auth";
import { getPrioritizationRun } from "@/modules/decision-engine/service";
import { explainProjectPriority } from "@/modules/ai/project-priority-explanation";
import type { CriterionFactorInput } from "@/modules/ai/project-priority-explanation";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface RouteContext {
  readonly params: Promise<{ readonly runId: string }>;
}

const runIdSchema = z.string().uuid();

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const correlationId = crypto.randomUUID();
  const authorization = await authorizeSession();
  if (authorization instanceof Response) return authorization;
  const { session } = authorization;

  const { runId } = await context.params;
  const parsedId = runIdSchema.safeParse(runId);
  if (!parsedId.success) {
    return badRequestResponse("ID run tidak valid.");
  }

  try {
    const detail = await getPrioritizationRun(session, runId);
    if (!detail) {
      logger.warn("decision_engine.runs.explanation.not_found", {
        correlationId,
        runId,
        actorId: session.userId,
      });
      return NextResponse.json(
        { error: "Run tidak ditemukan atau tidak dapat diakses." },
        { status: 404, headers: noStoreHeaders() },
      );
    }

    const criteriaKeys = new Set<string>();
    for (const item of detail.items) {
      for (const breakdown of item.scoreBreakdown as readonly { readonly criterion: string }[]) {
        criteriaKeys.add(breakdown.criterion);
      }
    }
    const criteria = Array.from(criteriaKeys).map((key) => ({ key }));

    const items = detail.items.map((item) => ({
      breakdown: (item.scoreBreakdown as readonly CriterionFactorInput[]),
    }));

    const explanation = await explainProjectPriority({
      criteriaVersion: detail.run.criteriaVersion,
      algorithmVersion: detail.run.algorithmVersion,
      fiscalYear: detail.run.fiscalYear,
      criteria,
      items,
    });

    logger.info("decision_engine.runs.explanation.completed", {
      correlationId,
      runId,
      actorId: session.userId,
    });
    return NextResponse.json(explanation, { headers: noStoreHeaders() });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
