import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireAsnAccessAdmin } from "@/modules/asn/access-api";
import { getAuditLogByEventId } from "@/modules/audit";

import { auditApiError } from "../_utils";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ event_id: string }>;
}

export async function GET(_request: Request, context: Context): Promise<Response> {
  try {
    const authorization = await requireAsnAccessAdmin();
    if (!authorization.authorized) return authorization.response;

    const { event_id: eventId } = await context.params;
    const result = await getAuditLogByEventId(
      db(),
      eventId,
      authorization.session.tenantId,
    );
    return NextResponse.json(result);
  } catch (error) {
    return auditApiError(error);
  }
}
