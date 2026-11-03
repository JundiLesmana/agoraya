"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatStatisticValue,
  publishedStatisticInputsSchema,
} from "@/modules/statistics-input";
import type { z } from "zod";

type PublishedInputs = z.infer<typeof publishedStatisticInputsSchema>;

function getErrorMessage(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return "Data publikasi belum dapat dimuat.";
}

export function PublishedStatisticInputs() {
  const [data, setData] = useState<PublishedInputs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadPublishedInputs() {
      try {
        const response = await fetch("/api/v1/statistics/published");
        const payload: unknown = await response.json();
        if (!response.ok) throw new Error(getErrorMessage(payload));
        const parsed = publishedStatisticInputsSchema.safeParse(payload);
        if (!parsed.success) {
          throw new Error("Data publikasi yang diterima tidak valid.");
        }
        if (active) setData(parsed.data);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Data publikasi belum dapat dimuat.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadPublishedInputs();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Publikasi terbaru dari operator statistik
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Data yang dipublikasikan menampilkan nilai beserta sumber dan
            metodologi.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div
              className="bg-muted h-28 animate-pulse rounded-lg"
              aria-label="Memuat data statistik terpublikasi"
            />
          ) : error ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : !data?.entries.length ? (
            <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
              Belum ada indikator yang dipublikasikan oleh operator.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.entries.map((entry) => (
                <article
                  key={entry.id}
                  className="space-y-4 rounded-lg border p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold">{entry.indicatorName}</h2>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {entry.regionName} · {entry.referenceYear}
                      </p>
                    </div>
                    <Badge variant="outline">Dipublikasikan</Badge>
                  </div>
                  <dl className="grid gap-2 sm:grid-cols-2">
                    {entry.values.map((value) => (
                      <div
                        key={value.periodValue}
                        className="bg-muted/40 rounded-md px-3 py-2"
                      >
                        <dt className="text-muted-foreground text-xs">
                          {value.periodValue}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold tabular-nums">
                          {formatStatisticValue(value.value, 2)} {entry.unit}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="border-t pt-3 text-xs">
                    <p>
                      <span className="text-muted-foreground">
                        Sumber data:
                      </span>{" "}
                      {entry.sourceName}
                    </p>
                    <p className="text-muted-foreground mt-1 line-clamp-3">
                      Metodologi: {entry.methodology}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
