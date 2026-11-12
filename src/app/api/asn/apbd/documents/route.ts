import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import {
  ApbdBudgetError,
  uploadApbdEvidence,
} from "@/modules/apbd-budget/service";

export const dynamic = "force-dynamic";

function isApbdOperator(roles: readonly string[]): boolean {
  return roles.some((role) =>
    ["asn", "staff", "admin", "superadmin"].includes(role),
  );
}

export async function POST(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }
  if (!isApbdOperator(session.roles)) {
    return NextResponse.json(
      { error: "Anda tidak memiliki akses APBD." },
      { status: 403 },
    );
  }
  const contentLength = request.headers.get("content-length");
  if (
    contentLength &&
    /^\d+$/.test(contentLength) &&
    Number(contentLength) > 11_000_000
  ) {
    return NextResponse.json(
      { error: "Ukuran bukti APBD melebihi 10 MB." },
      { status: 413 },
    );
  }
  try {
    const formData = await request.formData();
    const entryId = formData.get("entryId");
    const file = formData.get("file");
    if (
      typeof entryId !== "string" ||
      !z.string().uuid().safeParse(entryId).success ||
      !(file instanceof File)
    ) {
      return NextResponse.json(
        { error: "Berkas atau konteks draf APBD tidak valid." },
        { status: 400 },
      );
    }
    return NextResponse.json(await uploadApbdEvidence(session, entryId, file), {
      status: 201,
    });
  } catch (error) {
    if (error instanceof ApbdBudgetError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.error("asn.apbd.evidence_upload_failed", {
      actorId: session.userId,
      tenantId: session.tenantId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Bukti APBD tidak dapat diunggah. Silakan coba kembali." },
      { status: 500 },
    );
  }
}