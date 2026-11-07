"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDatasetDate } from "@/lib/dataset-catalog-presentation";

const reviewResponseSchema = z.object({
  dataset: z
    .object({
      slug: z.string(),
      title: z.string(),
      summary: z.string(),
      lastUpdatedAt: z.string().datetime(),
      recordCount: z.number().int().nonnegative(),
      preview: z.array(
        z.object({
          indicatorCode: z.string(),
          regionCode: z.string(),
          year: z.number().int(),
          value: z.number(),
          unit: z.string(),
        }),
      ),
    })
    .nullable(),
});

export function BpsDatasetReview({ onPublished }: { onPublished: () => void }) {
  const [dataset, setDataset] =
    useState<z.infer<typeof reviewResponseSchema>["dataset"]>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadPendingDataset() {
      try {
        const response = await fetch("/api/asn/datasets/review", {
          signal: controller.signal,
        });
        if (response.status === 401 || response.status === 403) return;
        if (!response.ok) throw new Error("Dataset review request failed.");
        const result = reviewResponseSchema.parse(await response.json());
        setDataset(result.dataset);
        setVisible(Boolean(result.dataset));
      } catch {
        if (!controller.signal.aborted) setHasError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadPendingDataset();
    return () => controller.abort();
  }, []);

  async function publishDataset() {
    setPublishing(true);
    setHasError(false);
    setMessage("");
    try {
      const response = await fetch("/api/asn/datasets/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });
      if (!response.ok) throw new Error("Dataset publication failed.");
      setVisible(false);
      setMessage("Dataset BPS berhasil diajukan ke katalog publik.");
      onPublished();
    } catch {
      setHasError(true);
    } finally {
      setPublishing(false);
    }
  }

  if (loading || (!visible && !message && !hasError)) return null;

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        {visible && dataset ? (
          <>
            <div>
              <p className="text-sm font-semibold">Tinjauan dataset BPS</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Data yang disinkronkan menunggu persetujuan sebelum tampil di
                katalog publik.
              </p>
            </div>
            <div className="space-y-1">
              <h2 className="font-medium">{dataset.title}</h2>
              <p className="text-muted-foreground text-sm">{dataset.summary}</p>
              <p className="text-muted-foreground text-xs">
                Pembaruan data: {formatDatasetDate(dataset.lastUpdatedAt)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {dataset.recordCount} agregat tersimpan
              </p>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-left text-xs">
                  <caption className="sr-only">
                    Pratinjau agregat BPS yang akan diajukan
                  </caption>
                  <thead className="bg-muted/60">
                    <tr>
                      <th scope="col" className="p-2">
                        Indikator
                      </th>
                      <th scope="col" className="p-2">
                        Wilayah
                      </th>
                      <th scope="col" className="p-2">
                        Tahun
                      </th>
                      <th scope="col" className="p-2">
                        Nilai
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.preview.map((item) => (
                      <tr
                        key={`${item.indicatorCode}-${item.regionCode}-${item.year}`}
                        className="border-t"
                      >
                        <td className="p-2">{item.indicatorCode}</td>
                        <td className="p-2">{item.regionCode}</td>
                        <td className="p-2">{item.year}</td>
                        <td className="p-2">
                          {item.value} {item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Button onClick={publishDataset} disabled={publishing}>
              {publishing ? "Memublikasikan..." : "Tinjau dan publikasikan"}
            </Button>
          </>
        ) : null}
        {message ? (
          <p role="status" className="flex items-center gap-2 text-sm">
            <CheckCircle2 aria-hidden="true" className="size-4" />
            {message}
          </p>
        ) : null}
        {hasError ? (
          <p
            role="alert"
            className="text-destructive flex items-center gap-2 text-sm"
          >
            <AlertCircle aria-hidden="true" className="size-4" />
            Tinjauan dataset gagal diproses. Silakan coba kembali.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
