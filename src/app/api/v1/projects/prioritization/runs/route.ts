import { NextResponse } from "next/server";
import { z } from "zod";

import {
  authorizeSession,
  badRequestResponse,
  noStoreHeaders,
  serviceErrorResponse,
} from "./_auth";
import { decodeCursor } from "@/modules/decision-engine/repository";
import {
  createPrioritizationRun,
  listPrioritizationRuns,
} from "@/modules/decision-engine/service";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const createBodySchema = z.strictObject({
  fiscalYear: z.number().int().min(2020).max(2100),
  projectIds: z.array(z.string().uuid()).max(100).optional(),
});

const listQuerySchema = z.object({
  fiscalYear: z.coerce.number().int().min(2020).max(2100).optional(),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
  cursor: z.string().optional(),
});

export async function POST(request: Request): Promise<Response> {
  const correlationId = crypto.randomUUID();
  const authorization = await authorizeSession();
  if (authorization instanceof Response) return authorization;
  const { session } = authorization;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequestResponse("Body permintaan tidak valid.");
  }

  const parsed = createBodySchema.safeParse(body);
  if (!parsed.success) {
    logger.warn("decision_engine.runs.create.validation_failed", {
      correlationId,
      tenantId: session.tenantId,
    });
    return badRequestResponse("Parameter prioritisasi tidak valid.");
  }

  const { fiscalYear, projectIds } = parsed.data;
  try {
    const result = await createPrioritizationRun(session, {
      fiscalYear,
      projectIds,
    });
    logger.info("decision_engine.runs.created", {
      correlationId,
      runId: result.runId,
      fiscalYear: result.fiscalYear,
      projectCount: result.results.length,
    });
    return NextResponse.json(result, {
      status: 201,
      headers: noStoreHeaders(),
    });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}

export async function GET(request: Request): Promise<Response> {
  const correlationId = crypto.randomUUID();
  const authorization = await authorizeSession();
  if (authorization instanceof Response) return authorization;
  const { session } = authorization;

  const { searchParams } = new URL(request.url);
  const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return badRequestResponse("Parameter daftar run tidak valid.");
  }

  let cursor: string | undefined;
  if (parsed.data.cursor) {
    try {
      decodeCursor(parsed.data.cursor);
    } catch {
      return badRequestResponse("Cursor tidak valid.");
    }
    cursor = parsed.data.cursor;
  }

  try {
    const result = await listPrioritizationRuns(session, {
      fiscalYear: parsed.data.fiscalYear,
      limit: parsed.data.limit,
      cursor,
    });
    logger.info("decision_engine.runs.list", {
      correlationId,
      fiscalYear: parsed.data.fiscalYear ?? null,
      runCount: result.runs.length,
    });
    return NextResponse.json(result, { headers: noStoreHeaders() });
  } catch (error) {
    return serviceErrorResponse(error);
  }
}
