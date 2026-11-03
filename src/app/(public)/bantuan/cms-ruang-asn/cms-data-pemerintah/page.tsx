import type { Metadata } from "next";
import CMSDataPemerintahClient from "./CMSDataPemerintahClient";

export const metadata: Metadata = {
  title: "CMS Data Pemerintah — Panduan Pengelola | Agoraya",
  description:
    "Panduan lengkap mengelola data di CMS Ruang ASN: dataset & metadata, anggaran APBD, proyek pembangunan, statistik daerah, dan verifikasi sebelum publikasi, termasuk pemecahan masalah umum.",
};

export default function CMSDataPemerintahArticlePage() {
  return <CMSDataPemerintahClient />;
}
