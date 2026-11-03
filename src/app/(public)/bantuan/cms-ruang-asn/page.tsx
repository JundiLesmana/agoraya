import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Database,
  FileText,
  Lightbulb,
  Megaphone,
} from "lucide-react";

export const metadata: Metadata = {
  title: "CMS · Ruang ASN — Pusat bantuan | Agoraya",
  description:
    "Panduan CMS Ruang ASN untuk mengelola data pemerintah: dataset, anggaran APBD, proyek pembangunan, statistik daerah, dan verifikasi sebelum publikasi.",
};

const items = [
  {
    title: "CMS Data Pemerintah",
    href: "/bantuan/cms-ruang-asn/cms-data-pemerintah",
    description:
      "Kelola dataset, APBD, proyek, dan statistik daerah dengan metadata yang utuh serta pemeriksaan sebelum publikasi.",
    icon: Database,
  },
  {
    title: "CMS Layanan Publik",
    href: "/bantuan/cms-ruang-asn/cms-layanan-publik",
    description:
      "Kelola antrean pengajuan, standar formulir, penanganan pengaduan, dan hasil layanan.",
    icon: FileText,
  },
  {
    title: "CMS Lapor Warga",
    href: "/bantuan/cms-ruang-asn/cms-lapor-warga",
    description:
      "Kelola antrean laporan, verifikasi & moderasi, disposisi ke OPD, hingga penutupan laporan.",
    icon: Megaphone,
  },
  {
    title: "CMS Insight",
    href: "/bantuan/cms-ruang-asn/cms-insight",
    description:
      "Kelola sumber & validasi analisis, identitas & SEO, widget data, draf, dan penerbitan insight.",
    icon: Lightbulb,
  },
];

export default function CmsRuangAsnPage() {
  return (
    <main className="min-h-screen bg-white px-5 py-10 text-slate-800 md:px-8">
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
          <Link href="/bantuan" className="hover:text-blue-700 hover:underline">
            Pusat bantuan
          </Link>
          <span className="mx-2 text-slate-400">/</span>
          <span className="font-medium text-slate-700">CMS · Ruang ASN</span>
        </nav>

        <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">
          CMS · Ruang ASN
        </h1>

        <p className="mb-8 max-w-2xl text-base leading-7 text-slate-600">
          Jelajahi panduan untuk mengelola dan menerbitkan data pemerintah dari
          sisi administrator, termasuk alur kerja multi-peran Operator,
          Verifikator, dan Approver.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {items.map(({ title, href, description, icon: Icon }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                <Icon className="h-5 w-5 text-blue-700" aria-hidden="true" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-800">
                  {title}
                </h2>
                <ArrowRight
                  className="h-4 w-4 text-blue-700 transition group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
