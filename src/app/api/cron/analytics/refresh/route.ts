import { NextResponse } from "next/server";
import { getDefaultDatabase } from "@/lib/db/client";
import { serverLogger } from "@/lib/logger";
import { BpsHttpAdapter, syncBpsStatistics } from "@/modules/integrations/bps";
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

    // Sinkronisasi statistik BPS dengan degradasi tambahan:
    // jika BPS API mati, tidak melempar exception sehingga cron tetap
    // mengembalikan 200 dan data snapshot terakhir (termasuk SIMULATED)
    // tetap tersedia untuk publik.
    const adapter = new BpsHttpAdapter();
    const bps = await syncBpsStatistics(adapter);

    return NextResponse.json({
      status: "refreshed",
      bpsSynced: bps.synced,
      bpsCount: bps.count,
      ...(bps.error ? { bpsError: bps.error } : {}),
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    serverLogger.error("Analytics refresh failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    await serverLogger.flush();
    return NextResponse.json(
      { error: "Analytics refresh failed" },
      { status: 500 },
    );
  }
}
