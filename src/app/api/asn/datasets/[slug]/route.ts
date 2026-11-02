import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { toSchemaOrgDataset } from "@/modules/dataset-catalog/contract";
import { createDatasetCatalogRepository } from "@/modules/dataset-catalog/repository";

const slugSchema = z
  .string()
  .min(1)
  .max(160)
  .refine((value) =>
    value.split("-").every((part) => /^[a-z0-9]+$/.test(part)),
  );

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const parsedSlug = slugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    return NextResponse.json(
      { error: "Identitas dataset tidak valid." },
      { status: 400 },
    );
  }

  try {
    const datasetRecord =
      await createDatasetCatalogRepository().getBySlug(slug);
    if (!datasetRecord) {
      return NextResponse.json(
        { error: "Dataset tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      toSchemaOrgDataset(datasetRecord, new URL(request.url).origin),
    );
  } catch (error) {
    logger.error("dataset_catalog.detail_failed", {
      error: error instanceof Error ? error.message : "Unknown database error",
    });
    return NextResponse.json(
      { error: "Metadata dataset tidak dapat dimuat saat ini." },
      { status: 500 },
    );
  }
}
