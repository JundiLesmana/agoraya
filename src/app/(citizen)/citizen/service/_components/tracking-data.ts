export type TrackingStatus =
  | "Sedang diproses"
  | "Perlu dokumen"
  | "Diverifikasi"
  | "Diterima"
  | "Selesai"
  | "Ditolak"
  | "Status lain";

export type TrackingCategory =
  | "Pengaduan"
  | "Perizinan"
  | "Sosial"
  | "Pendidikan"
  | "Kesehatan"
  | "Layanan lainnya";

export interface TrackingTimelineItem {
  title: string;
  description: string;
  occurredAt: string;
  completed: boolean;
}

export interface TrackingApplication {
  id: string;
  trackingNumber: string;
  serviceName: string;
  category: TrackingCategory;
  status: TrackingStatus;
  submittedAt: string;
  updatedAt: string;
  targetAt: string | null;
  deadlineAt?: string;
  currentStep: number;
  progressLabel: string;
  progressDescription: string;
  agency: string;
  team: string;
  responseEstimate: string;
  timeline: TrackingTimelineItem[];
  applicantName: string;
  contactEmail: string;
}

export interface StoredServiceApplication {
  id: string;
  trackingNumber: string;
  category: string;
  serviceType: string;
  serviceId: string;
  routeKey: string;
  serviceName: string;
  agency: string;
  status: string;
  applicantName: string;
  contactEmail: string;
  payload: Record<string, unknown>;
  submittedAt: string;
  updatedAt: string;
}

const CATEGORY_LABELS: Record<string, TrackingCategory> = {
  permit: "Perizinan",
  education: "Pendidikan",
  social: "Sosial",
  health: "Kesehatan",
  reporting: "Pengaduan",
};

function getStatus(status: string): TrackingStatus {
  switch (status) {
    case "submitted":
      return "Diterima";
    case "verified":
      return "Diverifikasi";
    case "in_progress":
      return "Sedang diproses";
    case "needs_document":
    case "needs_documents":
      return "Perlu dokumen";
    case "resolved":
    case "closed":
      return "Selesai";
    case "rejected":
      return "Ditolak";
    default:
      return "Status lain";
  }
}

function getStep(status: TrackingStatus): number {
  switch (status) {
    case "Diterima":
      return 1;
    case "Perlu dokumen":
    case "Diverifikasi":
      return 2;
    case "Sedang diproses":
      return 3;
    case "Selesai":
      return 4;
    case "Ditolak":
      return 2;
    case "Status lain":
      return 1;
  }
}

export function mapStoredServiceApplication(
  application: StoredServiceApplication,
): TrackingApplication {
  const status = getStatus(application.status);
  const category = CATEGORY_LABELS[application.category] ?? "Layanan lainnya";
  const submittedAt = new Date(application.submittedAt).toISOString();
  const updatedAt = new Date(application.updatedAt).toISOString();
  const hasStatusUpdate =
    new Date(updatedAt).getTime() > new Date(submittedAt).getTime();
  const timeline: TrackingTimelineItem[] = [
    {
      title: "Pengajuan diterima",
      description: "Pengajuan Anda berhasil dicatat.",
      occurredAt: submittedAt,
      completed: true,
    },
  ];

  if (hasStatusUpdate) {
    timeline.push({
      title: "Status diperbarui",
      description: `Status pengajuan saat ini: ${status}.`,
      occurredAt: updatedAt,
      completed: status === "Selesai" || status === "Ditolak",
    });
  }

  return {
    id: application.id,
    trackingNumber: application.trackingNumber,
    serviceName: application.serviceName,
    category,
    status,
    submittedAt,
    updatedAt,
    targetAt: null,
    currentStep: getStep(status),
    progressLabel: status,
    progressDescription:
      status === "Diterima"
        ? "Pengajuan Anda telah diterima dan menunggu pemeriksaan."
        : `Status terakhir pengajuan Anda: ${status}.`,
    agency: application.agency,
    team: "Belum ditentukan",
    responseEstimate: "Belum tersedia",
    timeline,
    applicantName: application.applicantName,
    contactEmail: application.contactEmail,
  };
}

export const TRACKING_NUMBER_PATTERN = /^[A-Z]{2,3}-\d{6}-\d{5}$/;
