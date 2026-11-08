import { NextResponse } from "next/server";
import { requireModuleAccess } from "@/lib/auth/require-module-access";
import { logger } from "@/lib/logger";
import { getEnv } from "@/lib/env";
import { isAppError } from "@/lib/errors";
import { BpsHttpAdapter, syncBpsStatistics } from "@/modules/integrations/bps";

export const dynamic = "force-dynamic";

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
 * dan catalog metadata yang ditandai menunggu tinjauan sebelum publikasi.
 */
export async function POST(): Promise<Response> {
  const authorization = await authorizeOperator();
  if (!authorization.authorized) return authorization.response;

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

    return NextResponse.json({
      imported: result.synced,
      count: result.count,
      error: result.error ?? null,
      message: result.synced
        ? "Data BPS berhasil disimpan pada kategori Statistik dan menunggu tinjauan sebelum dipublikasikan."
        : "Sinkronisasi BPS gagal. Data snapshot terakhir tetap tersedia untuk publik.",
    });
  } catch (error) {
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
