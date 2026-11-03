import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { formatError, isAppError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { requireAsnAccessAdmin } from "@/modules/asn/access-api";
import { listAuditLogs } from "@/modules/audit";

export const dynamic = "force-dynamic";

function parseListQuery(searchParams: URLSearchParams) {
  const limit = searchParams.get("limit");
  const offset = searchParams.get("offset");

  return {
    startDate: searchParams.get("start_date") ?? undefined,
    endDate: searchParams.get("end_date") ?? undefined,
    actorId: searchParams.get("actor_id") ?? undefined,
    module: searchParams.get("module") ?? undefined,
    action: searchParams.get("action") ?? undefined,
    result: searchParams.get("result") ?? undefined,
    objectType: searchParams.get("object_type") ?? undefined,
    searchQuery: searchParams.get("search_query") ?? undefined,
    ...(limit === null ? {} : { limit: Number(limit) }),
    ...(offset === null ? {} : { offset: Number(offset) }),
  };
}

function auditApiError(error: unknown): Response {
  const formatted = formatError(error);
  if (!isAppError(error) || formatted.statusCode >= 500) {
    logger.error("audit.logs.request_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  }

  return NextResponse.json(formatted, { status: formatted.statusCode });
}

export async function GET(request: Request): Promise<Response> {
  try {
    const authorization = await requireAsnAccessAdmin();
    if (!authorization.authorized) return authorization.response;

    const result = await listAuditLogs(db(), parseListQuery(new URL(request.url).searchParams));
    return NextResponse.json(result);
  } catch (error) {
    return auditApiError(error);
  }
}

export { auditApiError, parseListQuery };
