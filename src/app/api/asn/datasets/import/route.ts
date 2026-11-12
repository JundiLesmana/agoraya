import { NextResponse } from "next/server";
import { z } from "zod";
import { requireModuleAccess } from "@/lib/auth/require-module-access";
import { logger } from "@/lib/logger";
import { getEnv } from "@/lib/env";
import { isAppError } from "@/lib/errors";
import { db } from "@/lib/db";
import { appendAuditEvent } from "@/modules/audit/service";
import { uuidOrNull } from "@/modules/rbac/audit";
import { BpsHttpAdapter, syncBpsStatistics } from "@/modules/integrations/bps";
import {
  AsnDatasetError,
  importAssignedBpsDataset,
} from "@/modules/asn-datasets/service";

export const dynamic = "force-dynamic";
const bpsImportScopeSchema = z.strictObject({
  agencyId: z.string().trim().min(1).max(120),
  regionId: z.string().trim().min(1).max(120),
  sectorId: z.string().trim().min(1).max(100),
});

function getErrorProperty(
  error: unknown,
  property: "code" | "statusCode",
): string | number | undefined {
  if (typeof error !== "object" || error === null || !(property in error)) {
    return undefined;
  }
  const value: unknown = Reflect.get(error, property);
  return typeof value === "string" || typeof value === "number"
    ? value
    : undefined;
}

function isDatasetOperator(roles: readonly string[]): boolean {
  return roles.some(
    (role) =>
      role === "asn" ||
      role === "staff" ||
      role === "admin" ||
      role === "superadmin",
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
        { error: "Anda tidak memiliki akses untuk mengimpor data BPS." },
        { status: 403 },
      ),
    };
  }
  return authorization;
}

/**
 * Impor data BPS yang tersedia saat ini. ASN hanya menyinkronkan data
 * agregat yang tersedia dari BPS API pada waktu impor; data mentah BPS
 * tidak disimpan, hanya agregat statistik yang dimasukkan ke database
 * yang langsung diperbarui pada katalog publik dan CSV terolah.
 */
export async function POST(request: Request): Promise<Response> {
  const authorization = await authorizeOperator();
  if (!authorization.authorized) return authorization.response;

  let scope: z.infer<typeof bpsImportScopeSchema> | undefined;
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && /^\d+$/.test(contentLength)) {
    if (Number(contentLength) > 2048) {
      return NextResponse.json(
        { error: "Permintaan impor BPS melebihi batas ukuran." },
        { status: 413 },
      );
    }
  }
  const requestText = await request.text();
  if (requestText.length > 2048) {
    return NextResponse.json(
      { error: "Permintaan impor BPS melebihi batas ukuran." },
      { status: 413 },
    );
  }
  if (requestText.trim()) {
    let payload: unknown;
    try {
      payload = JSON.parse(requestText);
    } catch {
      return NextResponse.json(
        { error: "Format permintaan impor BPS tidak valid." },
        { status: 400 },
      );
    }
    const parsedScope = bpsImportScopeSchema.safeParse(payload);
    if (!parsedScope.success) {
      return NextResponse.json(
        { error: "Penugasan statistik untuk impor BPS tidak valid." },
        { status: 400 },
      );
    }
    scope = parsedScope.data;
  }

  try {
    const adapter = new BpsHttpAdapter();
    const result = await syncBpsStatistics(
      adapter,
      getEnv().BPS_STATISTICS_INDICATORS ?? undefined,
    );

    logger.info("asn_dataset.import", {
      synced: result.synced,
      count: result.count,
      error: result.error,
      operator: authorization.session?.userId,
    });

    if (result.synced) {
      await appendAuditEvent(db(), {
        actorId: uuidOrNull(authorization.session.userId),
        action: "asn.dataset.bps_synced",
        targetTable: "bps_statistics",
        targetId: null,
        metadata: {
          tenantId: authorization.session.tenantId,
          actorRole: authorization.session.roles.join(","),
          recordCount: result.count,
          sourceLabel: "BPS_API",
          result: "success",
        },
        occurredAt: new Date(),
      });
    }

    if (result.synced && scope) {
      const submission = await importAssignedBpsDataset(
        authorization.session,
        scope,
      );
      return NextResponse.json({
        imported: true,
        count: result.count,
        submission,
        message:
          "Statistik BPS terpublikasi dan snapshot untuk penugasan yang dipilih berhasil dikirim untuk ditinjau ASN.",
      });
    }

    return NextResponse.json({
      imported: result.synced,
      count: result.count,
      error: result.error ?? null,
      message: result.synced
        ? "Data BPS berhasil diolah, diperbarui pada CSV kategori Statistik, dan tersedia pada grafik publik."
        : "Sinkronisasi BPS gagal. Data snapshot terakhir tetap tersedia untuk publik.",
    });
  } catch (error) {
    if (error instanceof AsnDatasetError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const cause = error instanceof Error ? error.cause : undefined;
    const missingEnvVars = isAppError(error)
      ? error.context?.missingEnvVars
      : undefined;
    logger.error("asn_dataset.import_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode: getErrorProperty(error, "code"),
      errorStatusCode: getErrorProperty(error, "statusCode"),
      ...(typeof missingEnvVars === "string" ? { missingEnvVars } : {}),
      causeName: cause instanceof Error ? cause.name : undefined,
      causeCode: getErrorProperty(cause, "code"),
    });
    return NextResponse.json(
      { error: "Gagal mengimpor data dari BPS API." },
      { status: 500 },
    );
  }
}
