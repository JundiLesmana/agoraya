export type TrackingStatus =
  | "Sedang diproses"
  | "Perlu dokumen"
  | "Diverifikasi"
  | "Diterima"
  | "Menunggu Tinjauan Warga"
  | "Selesai"
  | "Selesai (Ditutup)"
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

export interface TrackingEvidenceItem {
  id: string;
  title: string;
  fileName: string;
  fileType: 'image' | 'pdf';
  safePreviewLabel: string;
}

export interface TrackingResolutionDetails {
  officialNote: string;
  officerName: string;
  completedAt: string;
  evidence: TrackingEvidenceItem[];
}

export interface TrackingReviewResult {
  action: 'accepted' | 'revision_requested';
  rating?: number;
  comment?: string;
  reason?: string;
  submittedAt: string;
}

export interface TrackingApplication {
  id: string;
  trackingNumber: string;
  serviceName: string;
  category: TrackingCategory;
  status: TrackingStatus;
  submittedAt: string;
  updatedAt: string;
  applicantName: string;
  contactEmail: string;
  targetAt: string | null;
  deadlineAt?: string;
  currentStep: number;
  progressLabel: string;
  progressDescription: string;
  agency: string;
  team: string;
  responseEstimate: string;
  originalRequest: string;
  resolutionDetails: TrackingResolutionDetails | null;
  citizenReviewState: 'eligible' | 'accepted' | 'revision_requested' | 'unavailable';
  citizenReviewResult: TrackingReviewResult | null;
  timeline: TrackingTimelineItem[];
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

export function getStoredServiceApplicationStatus(status: string): TrackingStatus {
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
      return "Menunggu Tinjauan Warga";
    case "closed":
      return "Selesai (Ditutup)";
    case "rejected":
      return "Ditolak";
    default:
      return "Status lain";
  }
}

const CATEGORY_LABELS: Record<string, TrackingCategory> = {
  permit: "Perizinan",
  education: "Pendidikan",
  social: "Sosial",
  health: "Kesehatan",
  reporting: "Pengaduan",
};


function getStep(status: TrackingStatus): number {
  switch (status) {
    case "Diterima":
      return 1;
    case "Perlu dokumen":
    case "Diverifikasi":
      return 2;
    case "Sedang diproses":
      return 3;
    case "Menunggu Tinjauan Warga":
    case "Selesai":
    case "Selesai (Ditutup)":
      return 4;
    case "Ditolak":
      return 2;
    case "Status lain":
      return 1;
    default:
      return 1;
  }
}

function getOriginalRequest(application: StoredServiceApplication): string {
  if (typeof application.payload?.summary === 'string' && application.payload.summary.trim()) {
    return application.payload.summary.trim();
  }

  if (typeof application.payload?.description === 'string' && application.payload.description.trim()) {
    return application.payload.description.trim();
  }

  return `Pengajuan ${application.serviceName} sedang diproses oleh ${application.agency}.`;
}

function getResolutionDetails(
  application: StoredServiceApplication,
  status: TrackingStatus,
): TrackingResolutionDetails | null {
  if (status !== 'Menunggu Tinjauan Warga' && status !== 'Selesai (Ditutup)') {
    return null;
  }

  return {
    officialNote:
      'Instansi menindaklanjuti pengajuan Anda dan mencatat hasil penyelesaian untuk ditinjau warga.',
    officerName: 'Petugas Layanan Instansi',
    completedAt: new Date(application.updatedAt).toISOString(),
    evidence: [
      {
        id: `${application.id}-evidence-photo`,
        title: 'Foto tindak lanjut',
        fileName: 'bukti-tindak-lanjut.jpg',
        fileType: 'image',
        safePreviewLabel: 'Pratinjau aman foto tindak lanjut tersedia melalui akses terlindungi.',
      },
      {
        id: `${application.id}-evidence-report`,
        title: 'Berita acara',
        fileName: 'berita-acara.pdf',
        fileType: 'pdf',
        safePreviewLabel: 'Pratinjau aman PDF berita acara tersedia melalui akses terlindungi.',
      },
    ],
  };
}

export function mapStoredServiceApplication(
  application: StoredServiceApplication,
): TrackingApplication {
  const status = getStoredServiceApplicationStatus(application.status);
  const category = CATEGORY_LABELS[application.category] ?? "Layanan lainnya";
  const submittedAt = new Date(application.submittedAt).toISOString();
  const updatedAt = new Date(application.updatedAt).toISOString();
  const hasStatusUpdate =
    new Date(updatedAt).getTime() > new Date(submittedAt).getTime();
  const resolutionDetails = getResolutionDetails(application, status);
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
      title:
        status === 'Menunggu Tinjauan Warga'
          ? 'Resolusi instansi dikirim'
          : 'Status diperbarui',
      description:
        status === 'Menunggu Tinjauan Warga'
          ? 'Instansi menunggu tinjauan warga atas hasil penyelesaian.'
          : `Status pengajuan saat ini: ${status}.`,
      occurredAt: updatedAt,
      completed: status === "Selesai" || status === "Selesai (Ditutup)" || status === "Ditolak",
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
    applicantName: application.applicantName,
    contactEmail: application.contactEmail,
    targetAt: null,
    currentStep: getStep(status),
    progressLabel: status,
    progressDescription:
      status === "Diterima"
        ? "Pengajuan Anda telah diterima dan menunggu pemeriksaan."
        : status === 'Menunggu Tinjauan Warga'
          ? 'Instansi telah mengirim resolusi. Tinjau hasilnya lalu terima atau minta revisi.'
          : `Status terakhir pengajuan Anda: ${status}.`,
    agency: application.agency,
    team: "Belum ditentukan",
    responseEstimate: "Belum tersedia",
    originalRequest: getOriginalRequest(application),
    resolutionDetails,
    citizenReviewState: status === 'Menunggu Tinjauan Warga' ? 'eligible' : status === 'Selesai (Ditutup)' ? 'accepted' : 'unavailable',
    citizenReviewResult: null,
    timeline,
  };
}

export const TRACKING_NUMBER_PATTERN = /^[A-Z]{2,3}-\d{6}-\d{5}$/;
