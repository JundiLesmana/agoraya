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
import { Textarea } from "@/components/ui/textarea";
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
import { BpsDatasetReview } from "./bps-dataset-review";

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

const DATA_CATEGORY_OPTIONS: readonly {
  value: string;
  label: string;
}[] = [
  { value: "Anggaran", label: "Anggaran (data/anggaran)" },
  { value: "Proyek", label: "Proyek (data/project)" },
  { value: "Statistik", label: "Statistik (data/statistik)" },
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
    <div className="grid gap-3 sm:grid-cols-3">
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

export function DatasetCatalog({
  allowLegacyActions = false,
  hideHeader = false,
}: {
  allowLegacyActions?: boolean;
  hideHeader?: boolean;
}) {
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

  const [addDatasetOpen, setAddDatasetOpen] = useState(false);
  const [addDatasetPending, setAddDatasetPending] = useState(false);
  const [addDatasetError, setAddDatasetError] = useState("");
  const [addDatasetMessage, setAddDatasetMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importPending, setImportPending] = useState(false);
  const [importError, setImportError] = useState("");
  const [importMessage, setImportMessage] = useState("");

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

  async function handleImport() {
    setImportPending(true);
    setImportError("");
    setImportMessage("");
    try {
      const response = await fetch("/api/asn/datasets/import", {
        method: "POST",
      });
      const result = (await response.json()) as {
        imported?: boolean;
        count?: number;
        error?: string;
        message?: string;
      };
      if (!response.ok) throw new Error(result.error ?? "Impor gagal.");
      if (!result.imported) {
        setImportError(
          result.error ?? result.message ?? "Sinkronisasi data BPS gagal.",
        );
        return;
      }
      setImportMessage(
        result.message ??
          `Sinkronisasi BPS selesai (${result.count ?? 0} agregat).`,
      );
      setRetryCount((count) => count + 1);
    } catch {
      setImportError("Gagal menyinkronkan data dari BPS API. Coba lagi nanti.");
    } finally {
      setImportPending(false);
    }
  }

  async function handleAddDataset(values: {
    category: string;
    title: string;
    summary: string;
    description: string;
    file: File | null;
  }) {
    setAddDatasetPending(true);
    setAddDatasetError("");
    setAddDatasetMessage("");

    if (
      !DATA_CATEGORY_OPTIONS.some(
        (option) => option.value === values.category,
      ) ||
      !values.title ||
      !values.summary ||
      !values.description
    ) {
      setAddDatasetPending(false);
      setAddDatasetError(
        "Judul, ringkasan, deskripsi, dan kategori wajib diisi.",
      );
      return;
    }
    if (!values.file) {
      setAddDatasetPending(false);
      setAddDatasetError("Berkas CSV wajib diunggah.");
      return;
    }

    const uploadData = new FormData();
    uploadData.set("category", values.category);
    uploadData.set("title", values.title);
    uploadData.set("summary", values.summary);
    uploadData.set("description", values.description);
    uploadData.set("file", values.file);

    try {
      const response = await fetch("/api/asn/datasets", {
        method: "POST",
        body: uploadData,
      });
      const result = (await response.json()) as {
        message?: string;
        dataset?: { id: string; slug: string; category: string };
        error?: string;
      };
      if (!response.ok)
        throw new Error(result.error ?? "Dataset gagal ditambahkan.");
      setAddDatasetMessage(result.message ?? "Dataset berhasil ditambahkan.");
      setAddDatasetOpen(false);
      setSelectedFile(null);
      setRetryCount((count) => count + 1);
    } catch {
      setAddDatasetError("Gagal menambahkan dataset. Coba lagi nanti.");
    } finally {
      setAddDatasetPending(false);
    }
  }

  const page = Number(searchParams.get("page") ?? "1");
  const total = catalog?.total ?? 0;
  const start = total === 0 ? 0 : (page - 1) * 12 + 1;
  const end = Math.min(page * 12, total);

  return (
    <div className="space-y-6 pb-8">
      <BpsDatasetReview
        refreshKey={retryCount}
        onPublished={() => setRetryCount((count) => count + 1)}
      />
      {!hideHeader ? (
        <header className="space-y-3">
          <nav
            aria-label="Breadcrumb"
            className="text-muted-foreground text-xs"
          >
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
      ) : null}

      <div className="space-y-4">
        <section
          aria-labelledby="dataset-list-title"
          className="min-w-0 space-y-4"
        >
          <h2 id="dataset-list-title" className="sr-only">
            Daftar dataset
          </h2>
          {allowLegacyActions ? (
            <>
              <div className="flex justify-end gap-2">
                {importMessage || importError ? (
                  <p className="text-muted-foreground text-sm">
                    {importError ? `⚠ ${importError}` : importMessage}
                  </p>
                ) : null}
                {addDatasetMessage || addDatasetError ? (
                  <p className="text-muted-foreground text-sm">
                    {addDatasetError
                      ? `⚠ ${addDatasetError}`
                      : addDatasetMessage}
                  </p>
                ) : null}
                <Button
                  onClick={() => setAddDatasetOpen(true)}
                  disabled={addDatasetPending}
                >
                  {addDatasetPending ? "Menambahkan..." : "Tambah Dataset"}
                </Button>
                <Button onClick={handleImport} disabled={importPending}>
                  {importPending
                    ? "Menyinkronkan..."
                    : "Import BPS (Statistik)"}
                </Button>
              </div>
              <p className="text-muted-foreground text-right text-xs">
                Impor BPS menunggu tinjauan sebelum metadata tampil di halaman
                publik Statistik.
              </p>
            </>
          ) : null}
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
          <details className="rounded-xl border bg-white px-3 py-2 dark:bg-slate-900">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium">
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              Filter aktif
            </summary>
            <div className="pt-3">
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

      {allowLegacyActions ? (
        <AddDatasetModal
          open={addDatasetOpen}
          onOpenChange={setAddDatasetOpen}
          selectedFile={selectedFile}
          onFileChange={setSelectedFile}
          serverError={addDatasetError}
          onAdd={(values) => handleAddDataset(values)}
          isPending={addDatasetPending}
        />
      ) : null}

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

function AddDatasetModal({
  open,
  onOpenChange,
  selectedFile,
  onFileChange,
  serverError,
  onAdd,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFile: File | null;
  onFileChange: (file: File | null) => void;
  serverError?: string;
  onAdd: (values: {
    category: string;
    title: string;
    summary: string;
    description: string;
    file: File | null;
  }) => Promise<void>;
  isPending: boolean;
}) {
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!open) {
      setCategory("");
      setTitle("");
      setSummary("");
      setDescription("");
      setSubmitError("");
    }
  }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    if (!selectedFile) {
      setSubmitError("Berkas CSV wajib diunggah.");
      return;
    }
    if (
      !DATA_CATEGORY_OPTIONS.some((option) => option.value === category) ||
      !title ||
      !summary ||
      !description
    ) {
      setSubmitError("Judul, ringkasan, deskripsi, dan kategori wajib diisi.");
      return;
    }
    await onAdd({ category, title, summary, description, file: selectedFile });
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Tambah Dataset"
      description="Unggah berkas CSV dan pilih kategori data pemerintah. Data akan diekstrak dan disimpan ke database."
      contentClassName="w-[calc(100%-2rem)] max-w-2xl"
    >
      <form onSubmit={submit} className="space-y-4">
        {serverError ? (
          <p role="alert" className="text-destructive text-xs">
            {serverError}
          </p>
        ) : null}
        <label className="block">
          <span className="text-sm font-medium">Kategori data pemerintah</span>
          <Select
            aria-label="Kategori data pemerintah"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Pilih kategori"
            options={DATA_CATEGORY_OPTIONS}
          />
          {!category && (
            <p className="text-destructive text-xs" role="alert">
              Kategori wajib dipilih.
            </p>
          )}
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Judul dataset</span>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Contoh: Anggaran Pendidikan 2026"
            aria-label="Judul dataset"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Ringkasan singkat</span>
          <Input
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Ringkasan singkat tentang isi dataset"
            aria-label="Ringkasan singkat"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Deskripsi lengkap</span>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Deskripsi lengkap dataset, sumber data, dan cara penggunaan"
            aria-label="Deskripsi lengkap"
            className="min-h-[100px]"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Berkas CSV</span>
          <input
            type="file"
            accept=".csv"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              onFileChange(file);
              if (!file) return;
              if (
                file.type !== "text/csv" &&
                !file.name.toLocaleLowerCase("id-ID").endsWith(".csv")
              ) {
                onFileChange(null);
                setSubmitError("Hanya berkas CSV yang diperbolehkan.");
              }
            }}
            className="text-muted-foreground file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold"
          />
          {selectedFile && (
            <p className="text-muted-foreground text-xs">
              {selectedFile.name} ·{(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          )}
        </label>
        {submitError ? (
          <p role="alert" className="text-destructive text-xs">
            {submitError}
          </p>
        ) : null}
        <footer className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Menyimpan..." : "Simpan Dataset"}
          </Button>
        </footer>
      </form>
    </Modal>
  );
}
