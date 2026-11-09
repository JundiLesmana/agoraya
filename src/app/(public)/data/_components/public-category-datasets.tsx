"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowRight, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SourceBadge } from "@/components/source-badges";
import {
  datasetCatalogResponseSchema,
  type DatasetCatalogResponse,
} from "@/modules/dataset-catalog/contract";

type PublicDatasetCategory = "Anggaran" | "Proyek" | "Statistik";

export function PublicCategoryDatasets({
  category,
}: {
  category: PublicDatasetCategory;
}) {
  const [result, setResult] = useState<DatasetCatalogResponse | null>(null);
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      category,
      page: String(page),
      sort: "recent",
    });

    async function loadDatasets() {
      setIsLoading(true);
      setHasError(false);
      try {
        const response = await fetch(`/api/asn/datasets?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Dataset kategori gagal dimuat.");
        const parsed = datasetCatalogResponseSchema.safeParse(
          await response.json(),
        );
        if (!parsed.success) {
          throw new Error("Data dataset kategori tidak valid.");
        }
        if (!controller.signal.aborted) setResult(parsed.data);
      } catch {
        if (!controller.signal.aborted) setHasError(true);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadDatasets();
    return () => controller.abort();
  }, [category, page, retryCount]);

  return (
    <section
      aria-labelledby={`public-datasets-${category}`}
      className="space-y-3 border-t p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3
            id={`public-datasets-${category}`}
            className="text-sm font-semibold"
          >
            Dataset {category} dari ASN
          </h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Dataset publik kategori {category} yang diunggah atau telah
            disetujui.
          </p>
        </div>
        {result ? (
          <span className="text-muted-foreground text-xs">
            {result.total} dataset
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div
          role="status"
          aria-label={`Memuat dataset ${category}`}
          className="bg-muted h-28 animate-pulse rounded-lg"
        />
      ) : hasError ? (
        <div
          role="alert"
          className="border-destructive/30 rounded-lg border p-4"
        >
          <p className="text-destructive text-sm">
            Dataset {category} gagal dimuat.
          </p>
          <Button
            variant="link"
            className="h-auto px-0"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            Coba lagi
          </Button>
        </div>
      ) : result?.data.length ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {result.data.map((dataset) => (
              <Card key={dataset.id} className="shadow-sm">
                <CardHeader className="px-3 pt-3 pb-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold">{dataset.title}</h4>
                    <SourceBadge
                      source={dataset.sourceLabel}
                      className="shrink-0 text-[10px]"
                    />
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-xs">
                    {dataset.summary}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2 px-3 pb-3">
                  <Badge variant="outline">{dataset.category}</Badge>
                  {dataset.resources.map((resource) => (
                    <Button
                      key={resource.id}
                      asChild
                      variant="outline"
                      size="sm"
                    >
                      <a
                        href={resource.url}
                        download={resource.format === "API" ? undefined : true}
                        aria-label={
                          resource.format === "API"
                            ? `Akses ${dataset.title}`
                            : `Unduh ${dataset.title} ${resource.format}`
                        }
                      >
                        {resource.format === "API" ? (
                          <Database className="size-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowDownToLine
                            className="size-3.5"
                            aria-hidden="true"
                          />
                        )}
                        {resource.format === "API"
                          ? "Akses API"
                          : `Unduh ${resource.format}`}
                      </a>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
          {result.totalPages > 1 ? (
            <nav
              aria-label={`Halaman dataset ${category}`}
              className="flex items-center justify-end gap-2"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                aria-label={`Dataset ${category} halaman sebelumnya`}
                onClick={() => setPage((current) => current - 1)}
              >
                Sebelumnya
              </Button>
              <span
                className="text-muted-foreground text-xs"
                aria-live="polite"
              >
                Halaman {page} dari {result.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= result.totalPages}
                aria-label={`Dataset ${category} halaman berikutnya`}
                onClick={() => setPage((current) => current + 1)}
              >
                Berikutnya{" "}
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </nav>
          ) : null}
        </>
      ) : (
        <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
          Belum ada dataset publik kategori {category}.
        </p>
      )}
    </section>
  );
}
