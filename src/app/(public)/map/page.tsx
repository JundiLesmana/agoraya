import type { Metadata } from "next";
import { PublicReportMap } from "./_components/public-report-map";

export const metadata: Metadata = {
  title: "Peta laporan publik | Agoraya",
  description:
    "Jelajahi laporan warga yang tersedia untuk publik beserta sumber dan riwayat validasinya.",
};

export default function PublicReportMapPage() {
  return <PublicReportMap />;
}