import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import {
  apbdContextQuerySchema,
} from "@/modules/apbd-budget/contract";
import {
  ApbdBudgetError,
  getApbdWorkspace,
  saveApbdWorkspace,
} from "@/modules/apbd-budget/service";

export const dynamic = "force-dynamic";

const MAX_APBD_REQUEST_BYTES = 3_000_000;

class ApbdRequestTooLargeError extends Error {}
class ApbdInvalidRequestError extends Error {}

async function readBoundedRequestBody(request: Request): Promise<Uint8Array> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) {
      throw new ApbdInvalidRequestError();
    }
    if (BigInt(contentLength) > BigInt(MAX_APBD_REQUEST_BYTES)) {
      throw new ApbdRequestTooLargeError();
    }
  }

  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_APBD_REQUEST_BYTES) {
        await reader.cancel();
        throw new ApbdRequestTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function isApbdOperator(roles: readonly string[]): boolean {
  return roles.some(
    (role) => role === "asn" || role === "staff" || role === "superadmin",
  );
}

function errorResponse(error: unknown): Response {
  if (error instanceof ApbdBudgetError) {
    return NextResponse.json(
      { error: error.message, rowErrors: error.rowErrors },
      { status: error.status },
    );
  }
  logger.error("apbd_budget.request_failed", {
    errorType: error instanceof Error ? error.name : "UnknownError",
  });
  return NextResponse.json(
    { error: "Data APBD tidak dapat diproses. Silakan coba kembali." },
    { status: 500 },
  );
}

async function authorizedSession() {
  const session = await getCurrentSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    } as const;
  }
  if (!isApbdOperator(session.roles)) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Anda tidak memiliki akses sebagai operator APBD." },
        { status: 403 },
      ),
    } as const;
  }
  return { session, response: null } as const;
}

export async function GET(request: Request): Promise<Response> {
  const authorization = await authorizedSession();
  if (!authorization.session) return authorization.response;

  const params = new URL(request.url).searchParams;
  const hasContext = ["referenceYear", "agencyId", "regionId", "sectorId"].some(
    (key) => params.has(key),
  );
  if (!hasContext) {
    try {
      return NextResponse.json(await getApbdWorkspace(authorization.session));
    } catch (error) {
      return errorResponse(error);
    }
  }

  const parsed = apbdContextQuerySchema.safeParse(Object.fromEntries(params));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Konteks APBD tidak valid." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(
      await getApbdWorkspace(authorization.session, parsed.data),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  const authorization = await authorizedSession();
  if (!authorization.session) return authorization.response;

  let body: Uint8Array;
  try {
    body = await readBoundedRequestBody(request);
  } catch (error) {
    if (error instanceof ApbdRequestTooLargeError) {
      return NextResponse.json(
        { error: "Permintaan APBD melebihi batas ukuran." },
        { status: 413 },
      );
    }
    if (error instanceof ApbdInvalidRequestError) {
      return NextResponse.json(
        { error: "Format permintaan APBD tidak valid." },
        { status: 400 },
      );
    }
    return errorResponse(error);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  } catch {
    return NextResponse.json(
      { error: "Format permintaan APBD tidak valid." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(
      await saveApbdWorkspace(authorization.session, payload),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
