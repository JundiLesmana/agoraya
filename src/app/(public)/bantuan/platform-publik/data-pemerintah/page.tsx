import type { Metadata } from "next";
import DataPemerintahClient from "./DataPemerintahClient";

export const metadata: Metadata = {
  title: "Data Pemerintah — Panduan Warga | Agoraya",
  description:
    "Panduan lengkap cara menggunakan fitur Data Pemerintah di Agoraya: ringkasan & filter, anggaran APBD, proyek pembangunan, statistik daerah, dan dataset & unduhan, termasuk pemecahan masalah umum.",
};

export default function DataPemerintahArticlePage() {
  return <DataPemerintahClient />;
}
