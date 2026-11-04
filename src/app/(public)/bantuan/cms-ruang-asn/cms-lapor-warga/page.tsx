import type { Metadata } from "next";
import CMSLaporWargaClient from "./CMSLaporWargaClient";

export const metadata: Metadata = {
  title: "CMS Lapor Warga — Panduan Pengelola | Agoraya",
  description:
    "Panduan lengkap mengelola laporan warga di CMS Ruang ASN: antrean laporan, verifikasi & moderasi, disposisi ke OPD, hingga tindak lanjut dan penutupan, termasuk pemecahan masalah umum.",
};

export default function CMSLaporWargaArticlePage() {
  return <CMSLaporWargaClient />;
}
