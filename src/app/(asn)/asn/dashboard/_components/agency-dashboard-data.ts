import { z } from "zod";

export const agencyDashboardResponseSchema = z.object({
  reports: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      category: z.string(),
      status: z.string(),
      submittedAt: z.string().nullable(),
      responseDueAt: z.string().nullable(),
      reportNumber: z.string(),
      subcategory: z.string(),
      province: z.string(),
      city: z.string(),
      address: z.string(),
      reporterName: z.string().nullable(),
      reporterEmail: z.string(),
      reporterPhone: z.string(),
      isPublic: z.boolean(),
      showIdentity: z.boolean(),
      attachments: z.array(z.string()),
    }),
  ),
});

export const serviceApplicationsResponseSchema = z.object({
  applications: z.array(
    z.object({
      id: z.string(),
      trackingNumber: z.string(),
      category: z.string(),
      serviceType: z.string(),
      serviceId: z.string(),
      routeKey: z.string(),
      serviceName: z.string(),
      agency: z.string(),
      status: z.string(),
      applicantName: z.string(),
      contactEmail: z.string(),
      payload: z.record(z.string(), z.unknown()),
      submittedAt: z.string().nullable(),
    }),
  ),
});

export type AgencyApplicationStatus =
  "Diterima" | "Diproses" | "Perlu Dokumen" | "Selesai";

export type AgencySubmissionKind = "report" | "service_application";

export interface AgencyApplication {
  id: string;
  trackingNumber: string;
  serviceName: string;
  description: string;
  category: string;
  subcategory: string;
  applicantName: string;
  email: string;
  phone: string;
  address: string;
  submittedAt: string;
  targetAt: string;
  status: AgencyApplicationStatus;
  isPublic: boolean;
  showIdentity: boolean;
  documents: { name: string; uploadedAt: string }[];
  kind: AgencySubmissionKind;
  routeKey?: string;
  rawPayload?: Record<string, unknown>;
}

export function toAgencyApplication(
  report: z.infer<typeof agencyDashboardResponseSchema>["reports"][number],
): AgencyApplication {
  const submittedAt = report.submittedAt ?? new Date(0).toISOString();
  return {
    id: report.id,
    trackingNumber: report.reportNumber,
    serviceName: report.title,
    description: report.description,
    category: report.category,
    subcategory: report.subcategory,
    applicantName:
      report.showIdentity && report.reporterName
        ? report.reporterName
        : "Pelapor anonim",
    email: report.reporterEmail,
    phone: report.reporterPhone,
    address: [report.address, report.city, report.province].join(", "),
    submittedAt,
    targetAt: report.responseDueAt ?? submittedAt,
    status: getAgencyStatus(report.status),
    isPublic: report.isPublic,
    showIdentity: report.showIdentity,
    documents: report.attachments.map((name) => ({
      name,
      uploadedAt: submittedAt,
    })),
    kind: "report",
  };
}

function categoryLabel(category: string): string {
  if (category === "permit") return "Perizinan";
  if (category === "education") return "Pendidikan";
  if (category === "social") return "Sosial";
  if (category === "health") return "Kesehatan";
  return category;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function extractDescription(payload: Record<string, unknown>): string {
  const data = payload.data;
  if (!data || typeof data !== "object") return "-";
  const record = data as Record<string, unknown>;
  return (
    asString(record.detailKebutuhan) ??
    asString(record.uraian) ??
    asString(record.tujuanIzin) ??
    "-"
  );
}

function extractAddress(payload: Record<string, unknown>): string {
  const data = payload.data;
  if (!data || typeof data !== "object") return "-";
  const record = data as Record<string, unknown>;
  const parts = [
    asString(record.lokasiKejadian),
    asString(record.alamatUsaha),
    asString(record.lokasiKegiatan),
    asString(record.lokasiFasilitas),
    asString(record.kelurahan),
    asString(record.kecamatan),
  ].filter((part): part is string => Boolean(part));
  return parts.length ? [...new Set(parts)].join(", ") : "-";
}

export function toAgencyApplicationFromService(
  application: z.infer<
    typeof serviceApplicationsResponseSchema
  >["applications"][number],
): AgencyApplication {
  const submittedAt = application.submittedAt ?? new Date(0).toISOString();
  return {
    id: application.id,
    trackingNumber: application.trackingNumber,
    serviceName: application.serviceName,
    description: extractDescription(application.payload),
    category: categoryLabel(application.category),
    subcategory: application.serviceType,
    applicantName: application.applicantName,
    email: application.contactEmail,
    phone: "-",
    address: extractAddress(application.payload),
    submittedAt,
    targetAt: submittedAt,
    status: getAgencyStatus(application.status),
    isPublic: false,
    showIdentity: true,
    documents: [],
    kind: "service_application",
    routeKey: application.routeKey,
    rawPayload: application.payload,
  };
}

function getAgencyStatus(status: string): AgencyApplicationStatus {
  if (status === "in_progress" || status === "verified") return "Diproses";
  if (status === "resolved" || status === "closed") return "Selesai";
  if (status === "rejected") return "Perlu Dokumen";
  return "Diterima";
}

export function maskPhone(phone: string): string {
  if (phone === "-" || phone.trim() === "") return "-";
  if (phone.length <= 4) return "•".repeat(phone.length);
  return `${"•".repeat(phone.length - 4)}${phone.slice(-4)}`;
}

export function maskApplicantName(name: string): string {
  if (name === "Pelapor anonim") return name;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Tidak dicantumkan";
  if (parts.length === 1) return `${parts[0].slice(0, 1)}***`;
  return [
    parts[0],
    ...parts.slice(1).map((part) => `${part.slice(0, 1)}***`),
  ].join(" ");
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "••••";
  return `${name.slice(0, 1)}***@${domain}`;
}
