import { NextResponse } from "next/server";
import { z } from "zod";
import { requireModuleAccess } from "@/lib/auth/require-module-access";
import { logger } from "@/lib/logger";
import { datasetCatalogQuerySchema } from "@/modules/dataset-catalog/contract";
import { createDatasetCatalogRepository } from "@/modules/dataset-catalog/repository";
import {
  AsnDatasetError,
  saveAsnDatasetSubmission,
} from "@/modules/asn-datasets/service";

const MAX_CSV_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_PAYLOAD_LENGTH = 16_384;

function isDatasetOperator(roles: readonly string[]): boolean {
  return roles.some((role) =>
    ["asn", "staff", "admin", "superadmin"].includes(role),
  );
}

async function authorizeOperator() {
  const authorization = await requireModuleAccess("insight");
  if (!authorization.authorized) return authorization;
  if (!authorization.session || !isDatasetOperator(authorization.session.roles)) {
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

function datasetErrorResponse(error: unknown): Response {
  if (error instanceof AsnDatasetError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  logger.error("asn_dataset.create_failed", {
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
  return NextResponse.json(
    { error: "Dataset gagal disimpan." },
    { status: 500 },
  );
}

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
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
    return NextResponse.json(
      await createDatasetCatalogRepository().list(query.data),
    );
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

  const payloadText = formData.get("payload");
  if (typeof payloadText !== "string" || payloadText.length > MAX_PAYLOAD_LENGTH) {
    return NextResponse.json(
      { error: "Metadata dan penugasan dataset wajib disertakan." },
      { status: 400 },
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(payloadText);
  } catch {
    return NextResponse.json(
      { error: "Format metadata dataset tidak valid." },
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
      { status: 413 },
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

  const utf8TextSchema = z.string().refine(
    (value) => !value.includes("\0"),
    "CSV mengandung karakter yang tidak valid.",
  );
  let csvText: string;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    csvText = new TextDecoder("utf-8", { fatal: true })
      .decode(bytes)
      .replace(/^\uFEFF/, "");
    utf8TextSchema.parse(csvText);
  } catch {
    return NextResponse.json(
      { error: "Berkas CSV tidak dapat dibaca sebagai UTF-8 yang valid." },
      { status: 400 },
    );
  }

  try {
    const saved = await saveAsnDatasetSubmission(
      authorization.session,
      payload,
      csvText,
    );
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    return datasetErrorResponse(error);
  }
}
