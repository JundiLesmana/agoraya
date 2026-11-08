import { NextResponse } from "next/server";
import { z } from "zod";

import {
  authorizeSession,
  badRequestResponse,
  noStoreHeaders,
  serviceErrorResponse,
} from "../_auth";
import { getPrioritizationRun } from "@/modules/decision-engine/service";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface RouteContext {
  readonly params: Promise<{ readonly runId: string }>;
}

const runIdSchema = z.string().uuid();

export async function GET(
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
      logger.warn("decision_engine.runs.detail.not_found", {
        correlationId,
        runId,
        actorId: session.userId,
      });
      return NextResponse.json(
        { error: "Run tidak ditemukan atau tidak dapat diakses." },
        { status: 404, headers: noStoreHeaders() },
      );
    }
    return NextResponse.json(detail, { headers: noStoreHeaders() });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
