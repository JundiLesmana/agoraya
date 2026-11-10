import type { Metadata } from "next";
import { CitizenTrackingDashboard } from "./_components/citizen-tracking-dashboard";

export const metadata: Metadata = {
  title: "Ruang Warga | Agoraya",
  description: "Lacak dan kelola pengajuan layanan warga Anda.",
};

export default function CitizenTrackingPage() {
  return <CitizenTrackingDashboard />;
}