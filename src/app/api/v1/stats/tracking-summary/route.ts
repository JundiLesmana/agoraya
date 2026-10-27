import { NextResponse } from "next/server";
import { getAnalyticsSnapshot } from "@/modules/analytics/tracking-public-statistics";
import {
  trackingStatisticsDashboardSchema,
  trackingStatisticsQuerySchema,
} from "@/modules/analytics/tracking-statistics-contract";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = Object.fromEntries(new URL(request.url).searchParams);
  const parsedQuery = trackingStatisticsQuerySchema.safeParse(query);

  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: parsedQuery.error.issues[0]?.message ?? "Filter tidak valid." },
      { status: 400 },
    );
  }

  const payload = trackingStatisticsDashboardSchema.parse(
    getAnalyticsSnapshot(parsedQuery.data),
  );
  return NextResponse.json(payload);
}
