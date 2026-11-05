import type { Metadata } from "next";
import { ReportTrackingPage } from "./report-tracking-page";

export const metadata: Metadata = {
  title: "Lacak laporan | Agoraya",
  description:
    "Lacak status laporan warga menggunakan nomor laporan Anda.",
};

export default async function ReportTrackingRoute({
  searchParams,
}: {
  searchParams: Promise<{ reportNumber?: string | string[] }>;
}) {
  const params = await searchParams;
  const reportNumber =
    typeof params.reportNumber === "string" ? params.reportNumber : "";

  return <ReportTrackingPage initialReportNumber={reportNumber} />;
}
