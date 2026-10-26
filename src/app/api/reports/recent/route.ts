import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getRecentReportsPage,
  recentReportsPageSchema,
} from "@/modules/reporting/public-reports";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(5),
  offset: z.coerce.number().int().min(0).max(1000).default(0),
});

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parameter daftar laporan tidak valid." },
      { status: 400 },
    );
  }

  const page = getRecentReportsPage(parsed.data.limit, parsed.data.offset);
  return NextResponse.json(recentReportsPageSchema.parse(page));
}
