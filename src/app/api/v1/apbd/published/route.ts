import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getPublishedApbdEntries } from "@/modules/apbd-budget/service";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    return NextResponse.json(await getPublishedApbdEntries());
  } catch (error) {
    logger.error("apbd_budget.publication_read_failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Data anggaran terbit belum dapat dimuat." },
      { status: 500 },
    );
  }
}
