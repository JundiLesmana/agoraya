import type { Metadata } from "next";
import LayananPublikClient from "./LayananPublikClient";

export const metadata: Metadata = {
  title: "Layanan Publik — Panduan Warga | Agoraya",
  description:
    "Panduan lengkap cara mengajukan layanan publik (perizinan, bantuan sosial, pendidikan) melalui Agoraya, termasuk cara kerja, pemecahan masalah, dan konteks penting sebelum mulai.",
};

export default function LayananPublikArticlePage() {
  return <LayananPublikClient />;
}
