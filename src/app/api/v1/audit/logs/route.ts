import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireAsnAccessAdmin } from "@/modules/asn/access-api";
import { listAuditLogs } from "@/modules/audit";
import { auditApiError, parseListQuery } from "./_utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const authorization = await requireAsnAccessAdmin();
    if (!authorization.authorized) return authorization.response;

    const result = await listAuditLogs(db(), {
      ...parseListQuery(new URL(request.url).searchParams),
      tenantId: authorization.session.tenantId,
    });
    return NextResponse.json(result);
  } catch (error) {
    return auditApiError(error);
  }
}
