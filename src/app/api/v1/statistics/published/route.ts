import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { publishedStatisticInputsSchema } from "@/modules/statistics-input";
import { getPublishedStatisticInputs } from "@/modules/statistics-input/service";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const data = await getPublishedStatisticInputs();
    return NextResponse.json(publishedStatisticInputsSchema.parse(data));
  } catch (error) {
    logger.error("statistics_input.public_read_failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Data statistik terpublikasi belum dapat dimuat." },
      { status: 500 },
    );
  }
}
