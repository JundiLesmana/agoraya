import { NextResponse } from "next/server";

import {
  accessApiError,
  requireAsnAccessAdmin,
} from "@/modules/asn/access-api";
import { getAsnAccessSummary } from "@/modules/asn/access-service";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const authorization = await requireAsnAccessAdmin();
    if (!authorization.authorized) return authorization.response;

    const data = await getAsnAccessSummary(authorization.session.tenantId);
    return NextResponse.json({ data });
  } catch (error) {
    return accessApiError(error);
  }
}
