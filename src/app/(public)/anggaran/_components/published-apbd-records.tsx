"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatApbdPercent,
  formatRupiahInteger,
} from "@/modules/apbd-budget/domain";
import {
  publishedApbdResponseSchema,
  type PublishedApbdResponse,
} from "@/modules/apbd-budget/contract";

export function PublishedApbdRecords() {
  const [entries, setEntries] = useState<PublishedApbdResponse["entries"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/v1/apbd/published", {
          cache: "no-store",
        });
        const payload: unknown = await response.json();
        if (!response.ok) {
          throw new Error("Data APBD terpublikasi belum dapat dimuat.");
        }
        const parsed = publishedApbdResponseSchema.safeParse(payload);
        if (!parsed.success) {
          throw new Error("Format data APBD terpublikasi tidak valid.");
        }
        if (active) setEntries(parsed.data.entries);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Data APBD terpublikasi belum dapat dimuat.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data APBD yang dipublikasikan</CardTitle>
        <CardDescription>
          Angka berikut berasal dari input operator instansi dan ditampilkan
          setelah melalui publikasi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div
            className="h-28 animate-pulse rounded-md bg-muted"
            aria-label="Memuat data APBD terpublikasi"
          />
        ) : error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada data APBD yang dipublikasikan oleh instansi.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left text-sm">
              <caption className="sr-only">
                Data Pagu dan Realisasi APBD yang sudah dipublikasikan
              </caption>
              <thead>
                <tr className="border-b bg-muted/50">
                  <th scope="col" className="p-3">Wilayah / Instansi</th>
                  <th scope="col" className="p-3">Tahun</th>
                  <th scope="col" className="p-3">Urusan</th>
                  <th scope="col" className="p-3 text-right">Pagu</th>
                  <th scope="col" className="p-3 text-right">Realisasi</th>
                  <th scope="col" className="p-3 text-right">Penyerapan</th>
                  <th scope="col" className="p-3">Dipublikasikan</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const pagu = entry.items.reduce(
                    (total, item) => total + BigInt(item.pagu ?? "0"),
                    0n,
                  );
                  const realisasi = entry.items.reduce(
                    (total, item) => total + BigInt(item.realisasi ?? "0"),
                    0n,
                  );
                  return (
                    <tr key={entry.id} className="border-b last:border-0">
                      <td className="p-3">
                        <p className="font-medium">{entry.metadata.opdName || entry.regionName}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.regionName} · {entry.metadata.budgetType} · Kode instansi {entry.agencyId}
                        </p>
                        {entry.metadata.publicSummary ? (
                          <p className="mt-1 max-w-md text-xs text-muted-foreground">
                            {entry.metadata.publicSummary}
                          </p>
                        ) : null}
                        {entry.metadata.sourceUrl ? (
                          <a
                            className="mt-1 inline-block text-xs text-primary underline"
                            href={entry.metadata.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Sumber resmi
                          </a>
                        ) : null}
                      </td>
                      <td className="p-3">{entry.referenceYear}</td>
                      <td className="p-3">{entry.sectorId}</td>
                      <td className="p-3 text-right tabular-nums">
                        {formatRupiahInteger(pagu.toString())}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {formatRupiahInteger(realisasi.toString())}
                      </td>
                      <td className="p-3 text-right">
                        <Badge variant="outline">
                          {formatApbdPercent(realisasi, pagu)}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(entry.publishedAt).toLocaleDateString("id-ID")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
