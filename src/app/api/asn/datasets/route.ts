import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { datasets, datasetResources } from "@/lib/db/schema";
import { requireModuleAccess } from "@/lib/auth/require-module-access";
import { datasetCatalogQuerySchema } from "@/modules/dataset-catalog/contract";
import { createDatasetCatalogRepository } from "@/modules/dataset-catalog/repository";

const MAX_CSV_SIZE_BYTES = 5 * 1024 * 1024;

const createDatasetSchema = z.strictObject({
  category: z.enum(["Anggaran", "Proyek", "Statistik"]),
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(500),
  description: z.string().min(1).max(2000),
});

function slugify(value: string): string {
  return value
    .toLocaleLowerCase("id-ID")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160);
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let index = 0;
  while (index < line.length) {
    if (line[index] === '"') {
      index += 1;
      let value = "";
      while (index < line.length) {
        if (line[index] === '"') {
          if (index + 1 < line.length && line[index + 1] === '"') {
            value += '"';
            index += 2;
            continue;
          }
          index += 1;
          break;
        }
        value += line[index];
        index += 1;
      }
      while (index < line.length && line[index] !== ",") index += 1;
      if (index < line.length) index += 1;
      fields.push(value);
    } else {
      const end = line.indexOf(",", index);
      if (end === -1) {
        fields.push(line.slice(index));
        index = line.length;
      } else {
        fields.push(line.slice(index, end));
        index = end + 1;
      }
    }
  }
  if (line.endsWith(",")) fields.push("");
  return fields;
}

function parseCsv(text: string): {
  columns: string[];
  rows: Record<string, string>[];
} {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { columns: [], rows: [] };
  }
  const columns = parseCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = parseCsvLine(lines[lineIndex]);
    const row: Record<string, string> = {};
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      row[columns[columnIndex]] = values[columnIndex] ?? "";
    }
    rows.push(row);
  }
  return { columns, rows };
}

function inferColumnType(values: readonly string[]): "integer" | "decimal" | "date" | "text" {
  const samples = values.filter((value) => value.trim().length > 0).slice(0, 50);
  if (samples.length === 0) return "text";
  const integer = samples.every((value) => /^-?\d+$/.test(value.trim()));
  if (integer) return "integer";
  const decimal = samples.every((value) => /^-?\d+(?:[.,]\d+)?$/.test(value.trim()));
  if (decimal) return "decimal";
  const date = samples.every((value) => {
    const parsed = Date.parse(value.trim());
    return Number.isFinite(parsed) && /\d{4}-\d{2}-\d{2}/.test(value.trim());
  });
  if (date) return "date";
  return "text";
}

function isDatasetOperator(roles: readonly string[]): boolean {
  return roles.some(
    (role) => role === "asn" || role === "staff" || role === "superadmin",
  );
}

async function authorizeOperator() {
  const authorization = await requireModuleAccess("insight");
  if (!authorization.authorized) return authorization;
  if (
    !authorization.session ||
    !isDatasetOperator(authorization.session.roles)
  ) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "Anda tidak memiliki akses untuk menambahkan dataset." },
        { status: 403 },
      ),
    };
  }
  return authorization;
}

async function resolveUniqueSlug(
  title: string,
  database: ReturnType<typeof db>,
): Promise<string> {
  let slug = slugify(title) || "dataset";
  let attempt = 1;
  while (true) {
    const existing = await database
      .select({ slug: datasets.slug })
      .from(datasets)
      .where(eq(datasets.slug, slug))
      .limit(1);
    if (existing.length === 0) return slug;
    slug = `${slugify(title) || "dataset"}-${attempt += 1}`;
  }
}

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

export async function POST(request: Request): Promise<Response> {
  const authorization = await authorizeOperator();
  if (!authorization.authorized) return authorization.response;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Format permintaan unggah dataset tidak valid." },
      { status: 400 },
    );
  }

  const parsed = createDatasetSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Form tambah dataset tidak valid." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Berkas CSV wajib diunggah." },
      { status: 400 },
    );
  }
  if (file.size > MAX_CSV_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Berkas CSV melebihi batas 5 MB." },
      { status: 400 },
    );
  }
  if (
    file.type !== "text/csv" &&
    !file.name.toLocaleLowerCase("id-ID").endsWith(".csv")
  ) {
    return NextResponse.json(
      { error: "Hanya berkas CSV yang diperbolehkan." },
      { status: 400 },
    );
  }

  let csvText: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    csvText = buffer.toString("utf-8").replace(/^\uFEFF/, "");
  } catch {
    return NextResponse.json(
      { error: "Berkas CSV tidak dapat dibaca sebagai teks UTF-8." },
      { status: 400 },
    );
  }

  const { columns, rows } = parseCsv(csvText);
  if (columns.length === 0 || rows.length === 0) {
    return NextResponse.json(
      { error: "Berkas CSV tidak mengandung baris data yang valid." },
      { status: 400 },
    );
  }

  const dataDictionary = columns.map((name) => ({
    name,
    type: inferColumnType(rows.map((row) => row[name] ?? "")),
    description: `Kolom ${name} diekstrak dari berkas CSV ${file.name}.`,
  }));

  try {
    const dataset = await db().transaction(async (database) => {
      const slug = await resolveUniqueSlug(parsed.data.title, database);
      const localResourceUrl = `/api/asn/datasets/${slug}/download`;
      const [created] = await database
        .insert(datasets)
        .values({
          slug,
          title: parsed.data.title,
          summary: parsed.data.summary,
          description: parsed.data.description,
          category: parsed.data.category,
          sourceOrganization: "Pemerintah Daerah (input ASN)",
          sourceUrl: null,
          sourceLabel: "CITIZEN_UNVERIFIED",
          licenseName: "Data terbuka pemerintah daerah",
          licenseUrl: null,
          tags: [
            parsed.data.category.toLocaleLowerCase("id-ID"),
            "asn",
            "csv",
          ],
          dataDictionary,
          csvData: csvText,
          lastUpdatedAt: new Date(),
          isPublished: true,
        })
        .returning();
      if (!created) {
        throw new Error("Dataset tidak dapat disimpan ke database.");
      }

      await database.insert(datasetResources).values({
        datasetId: created.id,
        title: `${parsed.data.title} (${file.name})`,
        format: "CSV",
        url: localResourceUrl,
      });

      return {
        id: created.id,
        slug: created.slug,
        title: created.title,
        category: created.category,
        sourceLabel: created.sourceLabel,
        resourceUrl: localResourceUrl,
        columns: dataDictionary.length,
        rows: rows.length,
      };
    });

    logger.info("asn_dataset.create", {
      datasetId: dataset.id,
      slug: dataset.slug,
      category: dataset.category,
      rows: dataset.rows,
    });

    return NextResponse.json(
      {
        message: "Dataset berhasil ditambahkan dan tersimpan ke database.",
        dataset,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("asn_dataset.create_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Dataset gagal disimpan ke database." },
      { status: 500 },
    );
  }
}
