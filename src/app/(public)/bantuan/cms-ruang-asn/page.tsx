import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Database,
  FileText,
  Lightbulb,
  Megaphone,
} from "lucide-react";
import { CMS_PAGE_CATALOG } from "@/lib/cms-page-catalog";

export const metadata: Metadata = {
  title: "CMS · Ruang ASN — Pusat bantuan | Agoraya",
  description:
    "Panduan CMS Ruang ASN untuk mengelola data pemerintah: dataset, anggaran APBD, proyek pembangunan, statistik daerah, dan verifikasi sebelum publikasi.",
};

const CMS_ICONS = {
  "data-pemerintah": Database,
  "layanan-publik": FileText,
  "lapor-warga": Megaphone,
  insight: Lightbulb,
} as const;

function getCmsIcon(id: (typeof CMS_PAGE_CATALOG)[number]["id"]) {
  switch (id) {
    case "data-pemerintah":
      return CMS_ICONS["data-pemerintah"];
    case "layanan-publik":
      return CMS_ICONS["layanan-publik"];
    case "lapor-warga":
      return CMS_ICONS["lapor-warga"];
    case "insight":
      return CMS_ICONS.insight;
  }
}

export default function CmsRuangAsnPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 px-5 py-10 text-slate-800 dark:text-slate-100 md:px-8">
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/bantuan" className="hover:text-blue-700 hover:underline">
            Pusat bantuan
          </Link>
          <span className="mx-2 text-slate-400">/</span>
          <span className="font-medium text-slate-700">CMS · Ruang ASN</span>
        </nav>

        <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">
          CMS · Ruang ASN
        </h1>

        <p className="mb-8 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
          Jelajahi panduan untuk mengelola dan menerbitkan data pemerintah dari
          sisi administrator, termasuk alur kerja multi-peran Operator,
          Verifikator, dan Approver.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {CMS_PAGE_CATALOG.map(({ id, title, href, description }) => {
            const Icon = getCmsIcon(id);
            return (
              <Link
                key={title}
                href={href}
                className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-5 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-white dark:bg-slate-950 shadow-sm ring-1 ring-slate-200">
                  <Icon className="h-5 w-5 text-blue-700" aria-hidden="true" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                    {title}
                  </h2>
                  <ArrowRight
                    className="h-4 w-4 text-blue-700 transition group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
