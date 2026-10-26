import type { ReportStatus } from "@/modules/reporting/types";

export type TrackingNodeState = "completed" | "active" | "upcoming";

export const TRACKING_STEPS = [
  {
    status: "submitted",
    title: "Diterima",
    description: "Laporan Anda telah diterima dan masuk ke antrean pemeriksaan.",
  },
  {
    status: "verified",
    title: "Terverifikasi",
    description: "Lokasi dan bukti laporan telah diperiksa.",
  },
  {
    status: "in_progress",
    title: "Dalam tindak lanjut",
    description:
      "Instansi terkait sedang meninjau laporan dan menjadwalkan penanganan.",
  },
  {
    status: "resolved",
    title: "Penyelesaian",
    description:
      "Hasil dan bukti penanganan akan ditampilkan setelah pekerjaan selesai.",
  },
] as const;

export function determineActiveTrackingNode(status: ReportStatus): number {
  switch (status) {
    case "submitted":
      return 0;
    case "verified":
      return 1;
    case "in_progress":
      return 2;
    case "resolved":
    case "closed":
      return 3;
  }
}

export function getTrackingNodeState(
  nodeIndex: number,
  activeIndex: number,
): TrackingNodeState {
  if (nodeIndex < activeIndex) return "completed";
  if (nodeIndex === activeIndex) return "active";
  return "upcoming";
}

export function formatTrackingDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
