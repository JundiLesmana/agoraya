import { NextResponse } from "next/server";
import { z } from "zod";

import {
  authorizeSession,
  badRequestResponse,
  noStoreHeaders,
  serviceErrorResponse,
} from "../../_auth";
import { getPrioritizationRun } from "@/modules/decision-engine/service";
import {
  criterionFactorInputSchema,
  explainProjectPriority,
} from "@/modules/ai/project-priority-explanation";
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

    const criteriaKeys = new Set<CriterionFactorInput["criterion"]>();
    const items = detail.items.map((item) => {
      const parsedBreakdown = z
        .array(criterionFactorInputSchema)
        .safeParse(item.scoreBreakdown);
      if (!parsedBreakdown.success) {
        throw new Error("Snapshot kriteria prioritisasi tidak valid.");
      }
      for (const breakdown of parsedBreakdown.data) {
        criteriaKeys.add(breakdown.criterion);
      }
      return { breakdown: parsedBreakdown.data };
    });
    const criteria = Array.from(criteriaKeys);

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
