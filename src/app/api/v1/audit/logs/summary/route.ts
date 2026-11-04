import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireAsnAccessAdmin } from "@/modules/asn/access-api";
import { summarizeAuditLogs } from "@/modules/audit";

import { auditApiError, parseListQuery } from "../_utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const authorization = await requireAsnAccessAdmin();
    if (!authorization.authorized) return authorization.response;

    const filters = parseListQuery(new URL(request.url).searchParams);
    const result = await summarizeAuditLogs(db(), filters);
    return NextResponse.json(result);
  } catch (error) {
    return auditApiError(error);
  }
}
