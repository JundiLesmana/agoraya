import { randomUUID } from "node:crypto";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { serviceApplications } from "@/lib/db/schema";

export type ServiceApplicationCategory =
  | "permit"
  | "education"
  | "social"
  | "health";

type CatalogEntry = {
  serviceName: string;
  agency: string;
  prefix: "IZN" | "EDU" | "SCL" | "KSE";
};

const CATALOG: Record<ServiceApplicationCategory, Record<string, CatalogEntry>> = {
  permit: {
    "nib-usaha-mikro": {
      serviceName: "NIB / usaha mikro",
      agency: "Dinas Penanaman Modal dan PTSP",
      prefix: "IZN",
    },
    "izin-kegiatan": {
      serviceName: "Izin kegiatan",
      agency: "Dinas Penanaman Modal dan PTSP",
      prefix: "IZN",
    },
    "perizinan-lainnya": {
      serviceName: "Perizinan lainnya",
      agency: "Dinas Penanaman Modal dan PTSP",
      prefix: "IZN",
    },
  },
  education: {
    "bantuan-biaya": {
      serviceName: "Bantuan biaya",
      agency: "Dinas Pendidikan",
      prefix: "EDU",
    },
    "administrasi-siswa": {
      serviceName: "Administrasi siswa",
      agency: "Dinas Pendidikan",
      prefix: "EDU",
    },
    "konsultasi-pendidikan": {
      serviceName: "Konsultasi pendidikan",
      agency: "Dinas Pendidikan",
      prefix: "EDU",
    },
  },
  social: {
    "kebutuhan-dasar": {
      serviceName: "Kebutuhan dasar",
      agency: "Dinas Sosial",
      prefix: "SCL",
    },
    "dukungan-keluarga": {
      serviceName: "Dukungan keluarga",
      agency: "Dinas Sosial",
      prefix: "SCL",
    },
    "bantuan-darurat": {
      serviceName: "Bantuan darurat",
      agency: "Dinas Sosial",
      prefix: "SCL",
    },
  },
  health: {
    "konsultasi-informasi": {
      serviceName: "Konsultasi & informasi layanan",
      agency: "Dinas Kesehatan",
      prefix: "KSE",
    },
    "permohonan-layanan-puskesmas": {
      serviceName: "Permohonan layanan Puskesmas",
      agency: "Dinas Kesehatan",
      prefix: "KSE",
    },
    "aduan-fasilitas-kesehatan": {
      serviceName: "Aduan fasilitas kesehatan",
      agency: "Dinas Kesehatan",
      prefix: "KSE",
    },
  },
};

function getCatalogEntry(
  category: ServiceApplicationCategory,
  serviceId: string,
): CatalogEntry {
  const entry = CATALOG[category][serviceId];
  if (!entry) {
    throw new Error(
      `Unknown service application type: ${category}:${serviceId}`,
    );
  }
  return entry;
}

function createTrackingNumber(prefix: CatalogEntry["prefix"], now: Date): string {
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

  if (!session.tenantId) {
    return {
      ok: false,
      status: 503,
      error:
        "Tenant tujuan pengajuan layanan belum dikonfigurasi. Pengajuan tidak dapat disimpan.",
    };
  }

  const entry = getCatalogEntry(payload.category, payload.serviceId);
  const routeKey = `${payload.category}:${payload.serviceId}`;
  const database = db();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const now = new Date();
    const trackingNumber = createTrackingNumber(entry.prefix, now);
    try {
      await database.insert(serviceApplications).values({
        id: randomUUID(),
        tenantId: session.tenantId,
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
  return CATALOG;
}
