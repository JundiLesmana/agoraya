import type { Metadata } from "next";
import LaporWargaClient from "./LaporWargaClient";

export const metadata: Metadata = {
  title: "Lapor Warga — Panduan Warga | Agoraya",
  description:
    "Panduan lengkap cara menyampaikan laporan warga melalui Agoraya: kategori & kronologi, lokasi & bukti, perlindungan identitas, kirim & lacak, dan konfirmasi hasil, termasuk pemecahan masalah umum.",
};

export default function LaporWargaArticlePage() {
  return <LaporWargaClient />;
}
