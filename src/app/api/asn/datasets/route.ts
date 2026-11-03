import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { datasetCatalogQuerySchema } from "@/modules/dataset-catalog/contract";
import { createDatasetCatalogRepository } from "@/modules/dataset-catalog/repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const query = datasetCatalogQuerySchema.safeParse(
    Object.fromEntries(searchParams),
  );
  if (!query.success) {
    return NextResponse.json(
      { error: "Parameter katalog dataset tidak valid." },
      { status: 400 },
    );
  }

  try {
    const result = await createDatasetCatalogRepository().list(query.data);
    return NextResponse.json(result);
  } catch (error) {
    logger.error("dataset_catalog.list_failed", {
      error: error instanceof Error ? error.message : "Unknown database error",
    });
    return NextResponse.json(
      { error: "Katalog dataset tidak dapat dimuat saat ini." },
      { status: 500 },
    );
  }
}
