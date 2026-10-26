import type { Metadata } from "next";
import { StatisticsDashboard } from "./_components/statistics-dashboard";

export const metadata: Metadata = {
  title: "Statistik Daerah | Agoraya",
  description:
    "Jelajahi indikator penduduk, ekonomi, dan kesejahteraan daerah beserta konteks dan metodologinya.",
};

export default function PublicRegionalStatisticsPage() {
  return <StatisticsDashboard />;
}
