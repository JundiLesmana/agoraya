import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Database, FileText, Lightbulb, Megaphone } from "lucide-react";

export const metadata: Metadata = {
  title: "Platform publik — Pusat bantuan | Agoraya",
  description: "Panduan platform publik Agoraya untuk Data Pemerintah, Layanan Publik, Lapor Warga, dan Insight.",
};

const items = [
  {
    title: "Data Pemerintah",
    href: "/bantuan/platform-publik/data-pemerintah",
    description: "Baca anggaran, pantau proyek, dan telusuri data daerah.",
    icon: Database,
  },
  {
    title: "Layanan Publik",
    href: "/bantuan/platform-publik/layanan-publik",
    description: "Pahami alur layanan dan status pengajuan yang sedang berjalan.",
    icon: FileText,
  },
  {
    title: "Lapor Warga",
    href: "/bantuan/platform-publik/lapor-warga",
    description: "Sampaikan laporan, cek proses penanganan, dan pantau hasilnya.",
    icon: Megaphone,
  },
  {
    title: "Insight",
    href: "/bantuan/platform-publik/insight",
    description: "Lihat analisis, perbandingan indikator, dan metodologi data.",
    icon: Lightbulb,
  },
];

export default function PlatformPublikPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 px-5 py-10 text-slate-800 dark:text-slate-100 md:px-8">
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/bantuan" className="hover:text-blue-700 hover:underline">
            Pusat bantuan
          </Link>
          <span className="mx-2 text-slate-400">/</span>
          <span className="font-medium text-slate-700">Platform publik</span>
        </nav>

        <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">
          Platform publik
        </h1>

        <p className="mb-8 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
          Jelajahi panduan untuk data publik, layanan, pelaporan, dan insight yang dapat
          diakses secara umum.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {items.map(({ title, href, description, icon: Icon }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-5 transition hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-white dark:bg-slate-950 shadow-sm ring-1 ring-slate-200">
                <Icon className="h-5 w-5 text-blue-700" aria-hidden="true" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
                <ArrowRight className="h-4 w-4 text-blue-700 transition group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
