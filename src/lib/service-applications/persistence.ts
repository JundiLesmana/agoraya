import { randomUUID } from "node:crypto";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { serviceApplications } from "@/lib/db/schema";
import { resolveReportingTenantId } from "@/lib/tenancy/reporting";
import { appendAuditEvent } from "@/modules/audit";
import {
  SERVICE_APPLICATION_CATALOG,
  type ServiceApplicationCategory,
} from "@/modules/service-applications/catalog";

type CatalogEntry = {
  serviceName: string;
  agency: string;
  prefix: "IZN" | "EDU" | "SCL" | "KSE";
};

export { type ServiceApplicationCategory } from "@/modules/service-applications/catalog";

function getCatalogEntry(
  category: ServiceApplicationCategory,
  serviceId: string,
): CatalogEntry {
  const catalog = SERVICE_APPLICATION_CATALOG[category];
  const serviceName = Object.entries(catalog.services).find(
    ([id]) => id === serviceId,
  )?.[1];
  if (!serviceName) {
    throw new Error(
      `Unknown service application type: ${category}:${serviceId}`,
    );
  }
  return {
    serviceName,
    agency: catalog.agency,
    prefix: catalog.prefix,
  };
}

function createTrackingNumber(
  prefix: CatalogEntry["prefix"],
  now: Date,
): string {
  const date = [now.getFullYear() % 100, now.getMonth() + 1, now.getDate()]
    .map((part) => String(part).padStart(2, "0"))
    .join("");
  const suffix = String(Math.floor(Math.random() * 100_000)).padStart(5, "0");
  return `${prefix}-${date}-${suffix}`;
}

export type PersistableServiceApplication = {
  category: ServiceApplicationCategory;
  serviceType: string;
  serviceId: string;
  data: {
    namaPemohon: string;
    kontakNotifikasi: string;
    [key: string]: unknown;
  };
};

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  const cause = (error as { cause?: { code?: string } }).cause;
  return code === "23505" || cause?.code === "23505";
}

export async function persistServiceApplication(
  payload: PersistableServiceApplication,
): Promise<
  | { ok: true; trackingNumber: string; submittedAt: string; routeKey: string }
  | { ok: false; status: 401; error: string }
  | { ok: false; status: 503; error: string }
> {
  const session = await getCurrentSession();
  if (!session) {
    return {
      ok: false,
      status: 401,
      error: "Silakan masuk sebelum mengirim pengajuan layanan.",
    };
  }

  const tenantId = await resolveReportingTenantId();
  if (!tenantId) {
    return {
      ok: false,
      status: 503,
      error:
        "Tenant penerima pengajuan layanan belum dikonfigurasi atau tidak aktif. Pengajuan tidak dapat disimpan.",
    };
  }

  const entry = getCatalogEntry(payload.category, payload.serviceId);
  const routeKey = `${payload.category}:${payload.serviceId}`;
  const database = db();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const now = new Date();
    const trackingNumber = createTrackingNumber(entry.prefix, now);
    const applicationId = randomUUID();
    try {
      await database.transaction(async (transaction) => {
        await transaction.insert(serviceApplications).values({
          id: applicationId,
          tenantId,
          applicantUserId: session.userId,
          trackingNumber,
          category: payload.category,
          serviceType: payload.serviceType,
          serviceId: payload.serviceId,
          routeKey,
          serviceName: entry.serviceName,
          agency: entry.agency,
          status: "submitted",
          applicantName: payload.data.namaPemohon,
          contactEmail: payload.data.kontakNotifikasi,
          payload: payload as unknown as Record<string, unknown>,
          submittedAt: now,
          createdAt: now,
          updatedAt: now,
        });
        await appendAuditEvent(transaction, {
          actorId: session.userId,
          action: "service_application.submitted",
          targetTable: "service_applications",
          targetId: applicationId,
          metadata: {
            tenantId,
            category: payload.category,
            serviceId: payload.serviceId,
            routeKey,
            result: "success",
          },
          occurredAt: now,
        });
      });
      return {
        ok: true,
        trackingNumber,
        submittedAt: now.toISOString(),
        routeKey,
      };
    } catch (error) {
      if (isUniqueViolation(error) && attempt < 4) continue;
      throw error;
    }
  }

  return {
    ok: false,
    status: 503,
    error: "Nomor pelacakan pengajuan tidak dapat dibuat. Silakan coba lagi.",
  };
}

export function getServiceApplicationCatalog() {
  return SERVICE_APPLICATION_CATALOG;
}
