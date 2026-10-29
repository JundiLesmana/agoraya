import { NextResponse } from "next/server";
import {
  budgetTrendQuerySchema,
  getBudgetTrend,
} from "@/lib/insight-anggaran";

export function GET(request: Request) {
  const url = new URL(request.url);
  const query = budgetTrendQuerySchema.safeParse({
    tahun: url.searchParams.get("tahun"),
  });

  if (!query.success) {
    return NextResponse.json(
      { error: "Parameter tahun harus bernilai 2020-2024." },
      { status: 400 },
    );
  }

  return NextResponse.json(getBudgetTrend());
}
