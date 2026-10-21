import { NextResponse } from "next/server";
import { getDefaultDatabase } from "@/lib/db";
import { serverLogger } from "@/lib/logger";
import {
  invalidateAggregateCache,
  isAnalyticsRefreshSecretConfigured,
  isAuthorizedAnalyticsRefresh,
  refreshAnalyticsMaterializedView,
} from "@/modules/analytics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!isAnalyticsRefreshSecretConfigured(secret)) {
    return NextResponse.json(
      { error: "Analytics refresh is not configured" },
      { status: 503 },
    );
  }
  if (
    !isAuthorizedAnalyticsRefresh(request.headers.get("authorization"), secret)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await refreshAnalyticsMaterializedView(getDefaultDatabase());
    invalidateAggregateCache();
    return NextResponse.json({
      status: "refreshed",
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    serverLogger.error("Analytics materialized view refresh failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    await serverLogger.flush();
    return NextResponse.json(
      { error: "Analytics refresh failed" },
      { status: 500 },
    );
  }
}
