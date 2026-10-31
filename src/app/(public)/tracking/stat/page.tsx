import type { Metadata } from "next";
import { AnalyticsDashboard } from "./analytics-dashboard";

export const metadata: Metadata = {
  title: "Ruang Statistik",
  description:
    "Pantau volume laporan warga, kecepatan tindak lanjut, dan kinerja layanan lintas instansi.",
};

export default function TrackingStatisticsPage() {
  return <AnalyticsDashboard />;
}
