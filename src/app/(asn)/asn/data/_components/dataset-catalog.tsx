"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Database,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { SourceBadge } from "@/components/source-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select, type SelectOption } from "@/components/ui/select";
import {
  datasetCatalogResponseSchema,
  datasetMetadataSchema,
  type DatasetCatalogItem,
  type DatasetMetadata,
} from "@/modules/dataset-catalog/contract";
import {
  formatDatasetDate,
  formatRelativeDatasetDate,
  getHighlightedTextParts,
} from "@/lib/dataset-catalog-presentation";

const FORMAT_OPTIONS: readonly SelectOption[] = [
  { value: "CSV", label: "CSV" },
  { value: "JSON", label: "JSON" },
  { value: "PDF", label: "PDF" },
  { value: "API", label: "API" },
];

const SORT_OPTIONS: readonly SelectOption[] = [
  { value: "relevance", label: "Paling Relevan" },
  { value: "recent", label: "Terbaru" },
  { value: "downloads", label: "Paling Banyak Diunduh" },
];

function HighlightedText({ text, query }: { text: string; query: string }) {
  return (
    <>
      {getHighlightedTextParts(text, query).map((part, index) =>
        part.highlighted ? (
          <mark
            key={`${part.text}-${index}`}
            className="text-foreground rounded-sm bg-amber-200 dark:bg-amber-800"
          >
            {part.text}
          </mark>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        ),
      )}
    </>
  );
}

function DatasetCard({
  dataset,
  search,
  onOpen,
}: {
  dataset: DatasetCatalogItem;
  search: string;
  onOpen: (slug: string) => void;
}) {
  return (
    <Card className="h-full shadow-sm">
      <CardContent className="flex h-full flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <Badge variant="outline" className="text-primary border-primary/20">
            {dataset.category}
          </Badge>
          <span className="text-muted-foreground text-right text-xs">
            ID {dataset.slug}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpen(dataset.slug)}
          className="focus-visible:ring-ring mt-3 text-left text-base leading-snug font-semibold hover:underline focus-visible:ring-2 focus-visible:outline-none"
        >
          <HighlightedText text={dataset.title} query={search} />
        </button>
        <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-5">
          <HighlightedText text={dataset.summary} query={search} />
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {dataset.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs font-normal"
            >
              <HighlightedText text={tag} query={search} />
            </Badge>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Format file">
          {dataset.resources.map((resource) => (
            <Badge key={resource.id} variant="outline" className="text-xs">
              {resource.format}
            </Badge>
          ))}
        </div>

        <div className="mt-auto border-t pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                <HighlightedText
                  text={dataset.sourceOrganization}
                  query={search}
                />
              </p>
              <p
                className="text-muted-foreground mt-1 text-xs"
                title={formatDatasetDate(dataset.lastUpdatedAt)}
              >
                Diperbarui {formatRelativeDatasetDate(dataset.lastUpdatedAt)}
              </p>
            </div>
            <SourceBadge
              source={dataset.sourceLabel}
              className="shrink-0 text-[10px]"
            />
          </div>
          <Button
            variant="outline"
            className="mt-3 w-full"
            onClick={() => onOpen(dataset.slug)}
          >
            Detail Metadata
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DatasetCardSkeleton() {
  return (
    <Card aria-hidden="true" className="h-56 animate-pulse shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="bg-muted h-5 w-24 rounded" />
        <div className="bg-muted h-6 w-3/4 rounded" />
        <div className="bg-muted h-12 rounded" />
        <div className="bg-muted h-5 w-28 rounded" />
        <div className="bg-muted mt-6 h-9 rounded" />
      </CardContent>
    </Card>
  );
}

function DatasetFilters({
  categories,
  agencies,
  category,
  format,
  agency,
  onChange,
}: {
  categories: string[];
  agencies: string[];
  category: string;
  format: string;
  agency: string;
  onChange: (name: "category" | "format" | "agency", value: string) => void;
}) {
  const categoryOptions = useMemo(
    () => categories.map((value) => ({ value, label: value })),
    [categories],
  );
  const agencyOptions = useMemo(
    () => agencies.map((value) => ({ value, label: value })),
    [agencies],
  );

  return (
    <div className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Kategori</span>
        <Select
          aria-label="Filter kategori"
          value={category}
          onChange={(event) => onChange("category", event.target.value)}
          options={categoryOptions}
          placeholder="Semua kategori"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Format File</span>
        <Select
          aria-label="Filter format file"
          value={format}
          onChange={(event) => onChange("format", event.target.value)}
          options={FORMAT_OPTIONS}
          placeholder="Semua format"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Instansi Sumber</span>
        <Select
          aria-label="Filter instansi sumber"
          value={agency}
          onChange={(event) => onChange("agency", event.target.value)}
          options={agencyOptions}
          placeholder="Semua instansi"
        />
      </label>
    </div>
  );
}

function MetadataDetails({ dataset }: { dataset: DatasetMetadata }) {
  return (
    <div className="max-h-[65vh] space-y-6 overflow-y-auto pr-1">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{dataset.category}</Badge>
        <SourceBadge source={dataset.sourceLabel} />
        {dataset.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="font-normal">
            {tag}
          </Badge>
        ))}
      </div>

      <section aria-labelledby="metadata-description">
        <h3 id="metadata-description" className="font-semibold">
          Deskripsi lengkap
        </h3>
        <p className="text-muted-foreground mt-2 leading-6">
          {dataset.description}
        </p>
      </section>

      <section aria-labelledby="metadata-source">
        <h3 id="metadata-source" className="font-semibold">
          Sumber & lisensi
        </h3>
        <dl className="mt-2 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-muted-foreground">Instansi sumber</dt>
          <dd>
            {dataset.sourceUrl ? (
              <a
                className="text-primary underline underline-offset-4"
                href={dataset.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                {dataset.sourceOrganization}
              </a>
            ) : (
              dataset.sourceOrganization
            )}
          </dd>
          <dt className="text-muted-foreground">Lisensi</dt>
          <dd>
            {dataset.licenseUrl ? (
              <a
                className="text-primary underline underline-offset-4"
                href={dataset.licenseUrl}
                rel="noreferrer"
                target="_blank"
              >
                {dataset.licenseName}
              </a>
            ) : (
              dataset.licenseName
            )}
          </dd>
          <dt className="text-muted-foreground">Pembaruan terakhir</dt>
          <dd>{formatDatasetDate(dataset.lastUpdatedAt)}</dd>
        </dl>
      </section>

      <section aria-labelledby="metadata-dictionary">
        <h3 id="metadata-dictionary" className="font-semibold">
          Kamus data
        </h3>
        <div className="mt-2 overflow-x-auto rounded-md border">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="sr-only">
              Struktur kolom dataset {dataset.title}
            </caption>
            <thead className="bg-muted/60">
              <tr className="border-b">
                <th scope="col" className="p-2.5 font-semibold">
                  Kolom
                </th>
                <th scope="col" className="p-2.5 font-semibold">
                  Tipe data
                </th>
                <th scope="col" className="p-2.5 font-semibold">
                  Deskripsi
                </th>
              </tr>
            </thead>
            <tbody>
              {dataset.dataDictionary.map((column) => (
                <tr key={column.name} className="border-b last:border-0">
                  <th scope="row" className="p-2.5 font-medium">
                    {column.name}
                  </th>
                  <td className="p-2.5">{column.type}</td>
                  <td className="text-muted-foreground p-2.5">
                    {column.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="metadata-resources">
        <h3 id="metadata-resources" className="font-semibold">
          Unduh / akses data
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {dataset.resources.map((resource) => (
            <Button key={resource.id} asChild variant="outline">
              <a
                href={resource.url}
                download={resource.format === "API" ? undefined : true}
              >
                {resource.format === "API" ? (
                  <Database aria-hidden="true" className="size-4" />
                ) : (
                  <ArrowDownToLine aria-hidden="true" className="size-4" />
                )}
                {resource.format === "API"
                  ? `Akses ${resource.format}`
                  : `Unduh ${resource.format}`}
              </a>
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function DatasetCatalog() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") ?? "",
  );
  const [catalog, setCatalog] = useState<ReturnType<
    typeof datasetCatalogResponseSchema.parse
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [metadata, setMetadata] = useState<DatasetMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState(false);

  const queryString = searchParams.toString();
  const datasetSlug = searchParams.get("dataset");
  const currentSearch = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const format = searchParams.get("format") ?? "";
  const agency = searchParams.get("agency") ?? "";
  const sort = searchParams.get("sort") ?? "relevance";

  function updateQuery(
    updates: Record<string, string | null>,
    resetPage = false,
  ) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    if (resetPage) params.delete("page");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    const params = new URLSearchParams(queryString);
    params.delete("dataset");
    const controller = new AbortController();

    async function loadCatalog() {
      setIsLoading(true);
      setHasError(false);
      try {
        const response = await fetch(`/api/asn/datasets?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Dataset catalog request failed.");
        const result = datasetCatalogResponseSchema.parse(
          await response.json(),
        );
        setCatalog(result);
      } catch {
        if (!controller.signal.aborted) {
          setHasError(true);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadCatalog();
    return () => controller.abort();
  }, [queryString, retryCount]);

  useEffect(() => {
    if (!datasetSlug) {
      setMetadata(null);
      setMetadataError(false);
      return;
    }
    const slug = datasetSlug;

    const controller = new AbortController();
    async function loadMetadata() {
      setMetadataLoading(true);
      setMetadataError(false);
      setMetadata(null);
      try {
        const response = await fetch(
          `/api/asn/datasets/${encodeURIComponent(slug)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Dataset metadata request failed.");
        setMetadata(datasetMetadataSchema.parse(await response.json()));
      } catch {
        if (!controller.signal.aborted) setMetadataError(true);
      } finally {
        if (!controller.signal.aborted) setMetadataLoading(false);
      }
    }

    void loadMetadata();
    return () => controller.abort();
  }, [datasetSlug]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateQuery({ search: searchInput.trim() || null }, true);
  }

  function changeFilter(name: "category" | "format" | "agency", value: string) {
    updateQuery({ [name]: value || null }, true);
  }

  const page = Number(searchParams.get("page") ?? "1");
  const total = catalog?.total ?? 0;
  const start = total === 0 ? 0 : (page - 1) * 12 + 1;
  const end = Math.min(page * 12, total);

  return (
    <div className="space-y-6 pb-8">
      <header className="space-y-3">
        <nav aria-label="Breadcrumb" className="text-muted-foreground text-xs">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link
                className="hover:text-foreground underline-offset-4 hover:underline"
                href="/"
              >
                Beranda
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li>
              <Link
                className="hover:text-foreground underline-offset-4 hover:underline"
                href="/data-pemerintah"
              >
                Data Pemerintah
              </Link>
            </li>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="text-foreground font-medium">
              Dataset
            </li>
          </ol>
        </nav>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Katalog Dataset & Metadata Terbuka
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
              Temukan dataset pemerintah, pahami konteks dan struktur datanya,
              lalu akses sumber dalam format yang tersedia.
            </p>
          </div>
          {catalog ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold">{catalog.total}</span>
              <span className="text-muted-foreground text-sm">
                dataset tersedia
              </span>
              <SourceBadge source="SIMULATED" className="text-[10px]" />
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside aria-label="Filter dataset" className="h-fit">
          <div className="hidden rounded-xl border p-4 lg:block">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              Filter dataset
            </h2>
            <DatasetFilters
              categories={catalog?.filters.categories ?? []}
              agencies={catalog?.filters.agencies ?? []}
              category={category}
              format={format}
              agency={agency}
              onChange={changeFilter}
            />
          </div>
          <details className="rounded-xl border p-4 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold">
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              Filter dataset
            </summary>
            <div className="pt-4">
              <DatasetFilters
                categories={catalog?.filters.categories ?? []}
                agencies={catalog?.filters.agencies ?? []}
                category={category}
                format={format}
                agency={agency}
                onChange={changeFilter}
              />
            </div>
          </details>
        </aside>

        <section
          aria-labelledby="dataset-list-title"
          className="min-w-0 space-y-4"
        >
          <h2 id="dataset-list-title" className="sr-only">
            Daftar dataset
          </h2>
          <div className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row">
            <form
              onSubmit={submitSearch}
              role="search"
              className="flex min-w-0 flex-1 gap-2"
            >
              <label className="relative min-w-0 flex-1">
                <Search
                  aria-hidden="true"
                  className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
                />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Cari dataset, kata kunci, atau instansi..."
                  aria-label="Cari dataset, kata kunci, atau instansi"
                  className="pl-9"
                />
              </label>
              <Button type="submit">Cari</Button>
            </form>
            <label className="flex items-center gap-2 sm:w-56">
              <span className="text-muted-foreground shrink-0 text-xs">
                Urutkan
              </span>
              <Select
                aria-label="Urutkan dataset"
                value={sort}
                options={SORT_OPTIONS}
                onChange={(event) =>
                  updateQuery({ sort: event.target.value }, true)
                }
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <p className="text-muted-foreground" aria-live="polite">
              {isLoading
                ? "Memuat dataset..."
                : `Menampilkan ${start}–${end} dari ${total} dataset`}
            </p>
            {currentSearch ? (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                onClick={() => updateQuery({ search: null }, true)}
              >
                Hapus pencarian “{currentSearch}”
              </Button>
            ) : null}
          </div>

          {hasError ? (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/5 flex flex-col items-center gap-3 rounded-xl border px-5 py-12 text-center"
            >
              <AlertCircle
                aria-hidden="true"
                className="text-destructive size-6"
              />
              <p className="font-medium">Katalog dataset gagal dimuat.</p>
              <p className="text-muted-foreground text-sm">
                Periksa koneksi Anda, lalu coba lagi.
              </p>
              <Button
                variant="outline"
                onClick={() => setRetryCount((count) => count + 1)}
              >
                Muat ulang
              </Button>
            </div>
          ) : isLoading ? (
            <div
              aria-label="Memuat dataset"
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <DatasetCardSkeleton key={index} />
              ))}
            </div>
          ) : catalog && catalog.data.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {catalog.data.map((dataset) => (
                <DatasetCard
                  key={dataset.id}
                  dataset={dataset}
                  search={currentSearch}
                  onOpen={(slug) => updateQuery({ dataset: slug })}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border px-5 py-16 text-center">
              <Database
                aria-hidden="true"
                className="text-muted-foreground mx-auto size-8"
              />
              <h3 className="mt-3 font-semibold">Dataset tidak ditemukan</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Ubah kata kunci atau hapus filter untuk melihat dataset lain.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.replace(pathname, { scroll: false })}
              >
                Reset pencarian dan filter
              </Button>
            </div>
          )}

          {catalog && catalog.total > 0 ? (
            <nav
              aria-label="Pagination dataset"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
            >
              <p className="text-muted-foreground text-xs">
                Menampilkan {start}–{end} dari {total} metadata terbit
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() =>
                    updateQuery({ page: String(Math.max(1, page - 1)) })
                  }
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  Sebelumnya
                </Button>
                <span aria-current="page" className="text-sm tabular-nums">
                  {page} / {Math.max(catalog.totalPages, 1)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    page >= Math.max(catalog.totalPages, 1) || isLoading
                  }
                  onClick={() => updateQuery({ page: String(page + 1) })}
                >
                  Berikutnya
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </nav>
          ) : null}
        </section>
      </div>

      <Modal
        open={datasetSlug !== null}
        onOpenChange={(open) => {
          if (!open) updateQuery({ dataset: null });
        }}
        title={metadata?.title ?? "Detail metadata dataset"}
        description="Deskripsi, sumber, lisensi, kamus data, dan akses berkas dataset."
        contentClassName="w-[calc(100%-2rem)] max-w-3xl"
      >
        {metadataLoading ? (
          <div aria-label="Memuat metadata" className="space-y-3 py-6">
            <div className="bg-muted h-5 w-36 animate-pulse rounded" />
            <div className="bg-muted h-20 animate-pulse rounded" />
            <div className="bg-muted h-40 animate-pulse rounded" />
          </div>
        ) : metadataError ? (
          <div role="alert" className="py-8 text-center">
            <p className="font-medium">Metadata gagal dimuat.</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Tutup panel dan coba buka dataset kembali.
            </p>
          </div>
        ) : metadata ? (
          <MetadataDetails dataset={metadata} />
        ) : null}
      </Modal>
    </div>
  );
}
