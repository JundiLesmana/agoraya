import { NextResponse } from "next/server";
import { z } from "zod";
import { requireModuleAccess } from "@/lib/auth/require-module-access";
import { logger } from "@/lib/logger";
import {
  AsnDatasetError,
  getAsnDatasetWorkspace,
  saveAsnDatasetSubmission,
} from "@/modules/asn-datasets/service";

export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 6 * 1024 * 1024;
const saveRequestSchema = z.strictObject({
  payload: z.unknown(),
  csvText: z.string().min(1).max(5 * 1024 * 1024),
});

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
        { error: "Anda tidak memiliki akses untuk mengelola dataset." },
        { status: 403 },
      ),
    };
  }
  return authorization;
}

async function readBoundedBody(request: Request): Promise<Uint8Array> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && /^\d+$/.test(contentLength)) {
    if (Number(contentLength) > MAX_REQUEST_BYTES) {
      throw new RangeError("Ukuran permintaan melebihi batas.");
    }
  } else if (contentLength !== null) {
    throw new TypeError("Header ukuran permintaan tidak valid.");
  }

  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new RangeError("Ukuran permintaan melebihi batas.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function datasetErrorResponse(error: unknown): Response {
  if (error instanceof AsnDatasetError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  logger.error("asn_dataset.workspace_failed", {
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
  return NextResponse.json(
    { error: "Ruang kerja dataset tidak dapat diproses saat ini." },
    { status: 500 },
  );
}

export async function GET(request: Request): Promise<Response> {
  const authorization = await authorizeOperator();
  if (!authorization.authorized) return authorization.response;

  const submissionId = new URL(request.url).searchParams.get("submissionId");
  const parsedId =
    submissionId === null
      ? undefined
      : z.string().uuid().safeParse(submissionId);
  if (parsedId && !parsedId.success) {
    return NextResponse.json(
      { error: "Identitas draf dataset tidak valid." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await getAsnDatasetWorkspace(
        authorization.session,
        parsedId?.success ? parsedId.data : undefined,
      ),
    );
  } catch (error) {
    return datasetErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  const authorization = await authorizeOperator();
  if (!authorization.authorized) return authorization.response;

  let bytes: Uint8Array;
  try {
    bytes = await readBoundedBody(request);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof RangeError
            ? "Permintaan dataset melebihi batas ukuran."
            : "Format permintaan dataset tidak valid.",
      },
      { status: error instanceof RangeError ? 413 : 400 },
    );
  }

  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return NextResponse.json(
      { error: "Format permintaan dataset tidak valid." },
      { status: 400 },
    );
  }

  const parsed = saveRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data dataset atau berkas CSV tidak valid." },
      { status: 400 },
    );
  }

  try {
    const saved = await saveAsnDatasetSubmission(
      authorization.session,
      parsed.data.payload,
      parsed.data.csvText,
    );
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    return datasetErrorResponse(error);
  }
}
