import { NextResponse } from "next/server";
import { requireModuleAccess } from "@/lib/auth/require-module-access";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { appendAuditEvent } from "@/modules/audit";
import { uuidOrNull } from "@/modules/rbac/audit";
import { statisticEntryQuerySchema } from "@/modules/statistics-input";
import {
  getStatisticsWorkspace,
  saveStatisticsInput,
  StatisticsInputError,
} from "@/modules/statistics-input/service";

export const dynamic = "force-dynamic";

function isStatisticsOperator(roles: readonly string[]): boolean {
  return roles.some(
    (role) => role === "asn" || role === "staff" || role === "superadmin",
  );
}

function errorResponse(error: unknown): Response {
  if (error instanceof StatisticsInputError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  logger.error("statistics_input.request_failed", {
    errorType: error instanceof Error ? error.name : "UnknownError",
  });
  return NextResponse.json(
    { error: "Data statistik tidak dapat diproses. Silakan coba kembali." },
    { status: 500 },
  );
}

export async function GET(request: Request): Promise<Response> {
  const moduleAuthorization = await requireModuleAccess("insight");
  if (!moduleAuthorization.authorized) return moduleAuthorization.response;
  const session = moduleAuthorization.session;
  if (!session || !isStatisticsOperator(session.roles)) {
    return NextResponse.json(
      { error: "Sesi tidak valid atau Anda tidak memiliki akses." },
      { status: 401 },
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const hasContext = [
    "referenceYear",
    "regionId",
    "sectorId",
    "indicatorId",
  ].some((key) => searchParams.has(key));
  if (!hasContext) {
    try {
      return NextResponse.json(await getStatisticsWorkspace(session));
    } catch (error) {
      return errorResponse(error);
    }
  }

  const parsed = statisticEntryQuerySchema.safeParse(
    Object.fromEntries(searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Konteks statistik tidak valid." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(
      await getStatisticsWorkspace(session, {
        ...parsed.data,
        sectorId: parsed.data.sectorId,
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  const moduleAuthorization = await requireModuleAccess("insight");
  if (!moduleAuthorization.authorized) return moduleAuthorization.response;
  const session = moduleAuthorization.session;
  if (!session || !isStatisticsOperator(session.roles)) {
    return NextResponse.json(
      { error: "Sesi tidak valid atau Anda tidak memiliki akses." },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Format permintaan statistik tidak valid." },
      { status: 400 },
    );
  }
  const payloadText = formData.get("payload");
  if (typeof payloadText !== "string") {
    return NextResponse.json(
      { error: "Data konteks statistik wajib disertakan." },
      { status: 400 },
    );
  }
  let payload: unknown;
  try {
    payload = JSON.parse(payloadText);
  } catch {
    return NextResponse.json(
      { error: "Format data statistik tidak valid." },
      { status: 400 },
    );
  }
  const files = formData
    .getAll("documents")
    .filter((item): item is File => item instanceof File);

  try {
    const saved = await saveStatisticsInput(session, payload, files);
    try {
      await appendAuditEvent(db(), {
        actorId: uuidOrNull(session.userId),
        action: "asn.statistics.saved",
        targetTable: "statistic_entries",
        targetId: uuidOrNull(saved.id),
        metadata: {
          tenantId: session.tenantId,
          actorRole: session.roles.join(","),
          result: "success",
          status: saved.status,
        },
        occurredAt: new Date(),
      });
      return NextResponse.json(saved);
    } catch (auditError) {
      logger.error("asn.statistics.audit_failed_after_save", {
        actorId: session.userId,
        tenantId: session.tenantId,
        entryId: saved.id,
        errorName:
          auditError instanceof Error ? auditError.name : "UnknownError",
      });
      return NextResponse.json({
        ...saved,
        auditWarning:
          "Data tersimpan, tetapi riwayat audit gagal dicatat. Jangan kirim ulang; hubungi administrator.",
      });
    }
  } catch (error) {
    return errorResponse(error);
  }
}
