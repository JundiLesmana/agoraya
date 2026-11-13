"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Database, Search } from "lucide-react";
import { searchPublicPages } from "@/modules/site-search";
import {
  datasetCatalogResponseSchema,
  type DatasetCatalogItem,
} from "@/modules/dataset-catalog/contract";

const DATASET_CATEGORY_HREFS: Readonly<Record<string, string>> = {
  Anggaran: "/data/anggaran",
  Ekonomi: "/data/anggaran",
  Proyek: "/data/project",
  Pembangunan: "/data/project",
  Statistik: "/data/statistik",
};

function SearchForm({ query }: { query: string }) {
  return (
    <form action="/cari" role="search" className="flex gap-2">
      <label className="sr-only" htmlFor="public-search-query">
        Cari data, layanan, atau informasi
      </label>
      <input
        id="public-search-query"
        name="q"
        type="search"
        defaultValue={query}
        minLength={2}
        maxLength={120}
        required
        placeholder="Cari data, layanan, atau informasi..."
        className="border-input bg-background text-foreground h-11 min-w-0 flex-1 rounded-md border px-3 text-sm"
      />
      <button
        type="submit"
        className="bg-primary text-primary-foreground inline-flex h-11 items-center gap-2 rounded-md px-4 text-sm font-medium"
      >
        <Search className="size-4" aria-hidden="true" />
        Cari
      </button>
    </form>
  );
}

function DatasetResults({ query, page }: { query: string; page: number }) {
  const [datasets, setDatasets] = useState<readonly DatasetCatalogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({
          search: query,
          sort: "relevance",
          page: String(page),
        });
        const response = await fetch(`/api/asn/datasets?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Pencarian dataset gagal dimuat.");
        const parsed = datasetCatalogResponseSchema.safeParse(
          await response.json(),
        );
        if (!parsed.success) throw new Error("Hasil dataset tidak valid.");
        if (controller.signal.aborted) return;
        setDatasets(parsed.data.data);
        setTotal(parsed.data.total);
        setTotalPages(parsed.data.totalPages);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [query, page, retryCount]);

  return (
    <section aria-labelledby="dataset-results-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="dataset-results-heading" className="text-lg font-semibold">
          Dataset publik
        </h2>
        {!loading && !error ? (
          <span className="text-muted-foreground text-sm">{total} hasil</span>
        ) : null}
      </div>
      {loading ? (
        <p role="status" className="text-muted-foreground text-sm">
          Mencari dataset...
        </p>
      ) : error ? (
        <div role="alert" className="rounded-lg border p-4">
          <p className="text-destructive text-sm">
            Dataset tidak dapat dicari saat ini.
          </p>
          <button
            type="button"
            className="text-primary mt-2 text-sm underline"
            onClick={() => setRetryCount((current) => current + 1)}
          >
            Coba lagi
          </button>
        </div>
      ) : datasets.length ? (
        <ul className="divide-y rounded-lg border">
          {datasets.map((dataset) => (
            <li
              key={dataset.id}
              className="flex flex-wrap items-start justify-between gap-3 p-4"
            >
              <div>
                <h3 className="font-medium">{dataset.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {dataset.summary}
                </p>
                <p className="text-muted-foreground mt-2 text-xs">
                  {dataset.category} · {dataset.sourceOrganization}
                </p>
              </div>
              <Link
                href={DATASET_CATEGORY_HREFS[dataset.category] ?? "/data"}
                className="text-primary inline-flex items-center gap-1 text-sm font-medium"
              >
                Lihat kategori
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
          Tidak ada dataset yang cocok dengan semua kata kunci.
        </p>
      )}
      {!loading && totalPages > 1 ? (
        <nav
          aria-label="Halaman hasil dataset"
          className="flex items-center justify-between gap-3"
        >
          <Link
            href={`/cari?q=${encodeURIComponent(query)}&page=${Math.max(1, page - 1)}`}
            aria-disabled={page <= 1}
            className={`text-sm font-medium ${page <= 1 ? "text-muted-foreground pointer-events-none" : "text-primary"}`}
          >
            Sebelumnya
          </Link>
          <span className="text-muted-foreground text-xs">
            Halaman {page} dari {totalPages} · {total} dataset
          </span>
          {page < totalPages ? (
            <Link
              href={`/cari?q=${encodeURIComponent(query)}&page=${page + 1}`}
              className="text-primary text-sm font-medium"
            >
              Berikutnya
            </Link>
          ) : (
            <span className="text-muted-foreground text-sm">Berikutnya</span>
          )}
        </nav>
      ) : null}
    </section>
  );
}

export function SearchResults({
  query,
  datasetPage = 1,
}: {
  query: string;
  datasetPage?: number;
}) {
  const pages = searchPublicPages(query);

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kembali ke beranda
      </Link>
      <header className="space-y-4">
        <p className="text-primary text-xs font-semibold tracking-wider uppercase">
          Pencarian Agoraya
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Hasil pencarian</h1>
        <SearchForm query={query} />
        {query ? (
          <p className="text-muted-foreground text-sm">
            Hasil yang cocok dengan semua kata kunci untuk{" "}
            <strong className="text-foreground">“{query}”</strong>
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Masukkan minimal dua karakter untuk mencari halaman dan dataset
            publik.
          </p>
        )}
      </header>

      {query.length >= 2 ? (
        <>
          <section aria-labelledby="page-results-heading" className="space-y-3">
            <h2 id="page-results-heading" className="text-lg font-semibold">
              Halaman dan layanan
            </h2>
            {pages.length ? (
              <ul className="divide-y rounded-lg border">
                {pages.map((page) => (
                  <li key={page.href}>
                    <Link
                      href={page.href}
                      className="group flex items-start justify-between gap-4 p-4"
                    >
                      <span>
                        <span className="group-hover:text-primary block font-medium">
                          {page.title}
                        </span>
                        <span className="text-muted-foreground mt-1 block text-sm">
                          {page.description}
                        </span>
                      </span>
                      <ArrowUpRight
                        className="text-primary mt-1 size-4 shrink-0"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                Tidak ada halaman yang cocok dengan semua kata kunci.
              </p>
            )}
          </section>
          <DatasetResults query={query} page={datasetPage} />
        </>
      ) : (
        <div className="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed p-5 text-sm">
          <Database className="size-4 shrink-0" aria-hidden="true" />
          Pencarian mencakup halaman publik dan metadata dataset yang telah
          dipublikasikan.
        </div>
      )}
    </main>
  );
}