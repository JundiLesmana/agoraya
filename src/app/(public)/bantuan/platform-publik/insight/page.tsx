import type { Metadata } from "next";
import InsightClient from "./InsightClient";

export const metadata: Metadata = {
  title: "Insight — Panduan Warga | Agoraya",
  description:
    "Panduan lengkap membaca perbandingan data di Insight: filter perbandingan, ketepatan layanan, tren anggaran, indikator kesejahteraan, dan sumber & metodologi, termasuk pemecahan masalah umum.",
};

export default function InsightArticlePage() {
  return <InsightClient />;
}
