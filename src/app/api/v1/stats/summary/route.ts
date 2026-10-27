import { NextResponse } from "next/server";
import { getPublicStatistics } from "@/modules/analytics/public-statistics";
import { publicStatisticsQuerySchema } from "@/modules/analytics/public-statistics-contract";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = publicStatisticsQuerySchema.safeParse(query);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parameter statistik tidak valid." },
      { status: 400 },
    );
  }

  return NextResponse.json(getPublicStatistics(parsed.data));
}
