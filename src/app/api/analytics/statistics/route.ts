import { NextResponse } from "next/server";
import { selectPublicBpsStatistics } from "@/modules/integrations/bps/repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const { rows, source } = await selectPublicBpsStatistics();

  return NextResponse.json({
    source,
    count: rows.length,
    data: rows,
  });
}
