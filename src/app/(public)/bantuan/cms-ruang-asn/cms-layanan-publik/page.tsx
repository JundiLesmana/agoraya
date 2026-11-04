import type { Metadata } from "next";
import CMSLayananPublikClient from "./CMSLayananPublikClient";

export const metadata: Metadata = {
  title: "CMS Layanan Publik — Panduan Pengelola | Agoraya",
  description:
    "Panduan lengkap mengelola antrean pengajuan, standar formulir layanan, penanganan pengaduan, dan penyampaian hasil kepada pemohon di CMS Ruang ASN, termasuk pemecahan masalah umum.",
};

export default function CMSLayananPublikArticlePage() {
  return <CMSLayananPublikClient />;
}
