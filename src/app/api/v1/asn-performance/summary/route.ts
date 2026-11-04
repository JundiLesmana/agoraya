import { NextResponse } from "next/server";

import {
  accessApiError,
  requireAsnAccessAdmin,
} from "@/modules/asn/access-api";
import { parseAsnPerformanceRequest } from "@/modules/asn/performance-api";
import { getAsnPerformanceSummary } from "@/modules/asn/performance-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const authorization = await requireAsnAccessAdmin();
    if (!authorization.authorized) return authorization.response;

    const { filters } = parseAsnPerformanceRequest(new URL(request.url).searchParams);
    const data = await getAsnPerformanceSummary(
      authorization.session.tenantId,
      filters,
    );

    return NextResponse.json({ data });
  } catch (error) {
    return accessApiError(error);
  }
}
