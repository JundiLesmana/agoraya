import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Search } from "lucide-react";
import { HelpSearch } from "../_components/HelpSearch";
import { searchHelpArticles } from "../search-index";

export const metadata: Metadata = {
  title: "Hasil pencarian — Pusat bantuan | Agoraya",
  description: "Cari panduan dan topik bantuan Agoraya.",
};

export default async function HelpSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = searchHelpArticles(query);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 px-5 pb-16 pt-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/bantuan"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-800 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Pusat bantuan
        </Link>
        <header className="mt-8 border-b border-slate-200 dark:border-slate-800 pb-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
            Pencarian dokumentasi
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Temukan panduan yang tepat
          </h1>
          <div className="mt-6 max-w-2xl">
            <HelpSearch />
          </div>
          {query && (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              {results.length} hasil untuk <strong className="text-slate-900">“{query}”</strong>
            </p>
          )}
        </header>

        {!query ? (
          <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white dark:bg-slate-950 p-6 text-slate-700">
            <Search className="mb-3 size-5 text-blue-700" aria-hidden="true" />
            <p>Masukkan kata kunci untuk mencari panduan platform publik atau CMS Ruang ASN.</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Gunakan tanda kutip untuk frasa tepat atau tanda minus untuk mengecualikan kata, misalnya{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5">anggaran -CMS</code>.
            </p>
          </div>
        ) : results.length > 0 ? (
          <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200 dark:border-slate-800">
            {results.map((result) => (
              <li key={result.href}>
                <Link
                  href={result.href}
                  className="group flex items-start justify-between gap-6 py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                  <span>
                    <span className="block text-lg font-semibold text-slate-900 group-hover:text-blue-800">
                      {result.title}
                    </span>
                    <span className="mt-1 block max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {result.description}
                    </span>
                  </span>
                  <ArrowUpRight
                    className="mt-1 size-5 shrink-0 text-blue-700"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
            <h2 className="font-semibold">Belum ada panduan yang cocok</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Coba kata kunci yang lebih singkat, periksa ejaan, atau hapus kata pengecualian.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
