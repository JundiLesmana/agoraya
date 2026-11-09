import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { datasets } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;
  const row = await db()
    .select({
      id: datasets.id,
      title: datasets.title,
      csvData: datasets.csvData,
    })
    .from(datasets)
    .where(and(eq(datasets.slug, slug), eq(datasets.isPublished, true)))
    .limit(1);

  const found = row[0];
  if (!found || !found.csvData) {
    return NextResponse.json(
      { error: "Berkas CSV tidak tersedia." },
      { status: 404 },
    );
  }

  const dataset = found;
  const csvData = found.csvData;
  const downloadableCsv = `\uFEFF${csvData}`;
  const downloadName = `${
    dataset.title
      .toLocaleLowerCase("id-ID")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "dataset"
  }.csv`;

  return new NextResponse(downloadableCsv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${downloadName}"`,
      "Content-Length": String(Buffer.byteLength(downloadableCsv, "utf-8")),
      "Cache-Control": "private, no-cache",
    },
  });
}
