"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatPercent } from "@/lib/currency";
import { computeProgressDeviation, periodeLabel } from "@/lib/progress";
import { cn } from "@/lib/utils";
import type { ProgressReport } from "@/lib/progress";

interface ProgressHistoryProps {
  readonly history: readonly ProgressReport[];
}

const STATUS_LABEL: Record<ProgressReport["status"], string> = {
  draft: "Draf",
  submitted: "Dikirim ke Pimpinan",
};

const STATUS_VARIANT: Record<
  ProgressReport["status"],
  "default" | "outline" | "secondary" | "destructive"
> = {
  draft: "outline",
  submitted: "default",
};

export function ProgressHistory({ history }: ProgressHistoryProps) {
  const [detailId, setDetailId] = useState<string | null>(null);

  const visibleHistory = history
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const selectedReport = detailId
    ? visibleHistory.find((r) => r.id === detailId)
    : null;

  return (
    <section aria-labelledby="riwayat-heading" className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="riwayat-heading" className="text-lg font-semibold">
            Riwayat Pelaporan
          </h2>
          <p className="text-muted-foreground text-sm">
            Daftar rekam progres fisik dan keuangan yang telah dicatat untuk
            paket pekerjaan ini.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <caption className="sr-only">
            Riwayat pelaporan progres bulanan
          </caption>
          <thead>
            <tr>
              <th scope="col" className="text-muted-foreground p-3 font-medium">
                Periode
              </th>
              <th
                scope="col"
                className="text-muted-foreground p-3 text-right font-medium"
              >
                Progres Fisik
              </th>
              <th
                scope="col"
                className="text-muted-foreground p-3 text-right font-medium"
              >
                Progres Keuangan
              </th>
              <th
                scope="col"
                className="text-muted-foreground p-3 text-right font-medium"
              >
                Deviasi (+/-)
              </th>
              <th
                scope="col"
                className="text-muted-foreground p-3 text-center font-medium"
              >
                Status
              </th>
              <th scope="col" className="text-muted-foreground p-3 font-medium">
                Tanggal Input
              </th>
              <th
                scope="col"
                className="text-muted-foreground p-3 text-right font-medium"
              >
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleHistory.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-muted-foreground p-12 text-center"
                >
                  Belum ada riwayat pelaporan progres untuk proyek ini.
                </td>
              </tr>
            ) : (
              visibleHistory.map((report) => {
                const deviation = computeProgressDeviation(
                  report.progresFisik,
                  report.progresKeuangan,
                );
                return (
                  <tr key={report.id} className="border-b">
                    <td className="p-3 font-medium">
                      {periodeLabel(report.periodeBulan, report.periodeTahun)}
                    </td>
                    <td className="p-3 text-right">
                      {formatPercent(report.progresFisik)}
                    </td>
                    <td className="p-3 text-right">
                      {formatPercent(report.progresKeuangan)}
                    </td>
                    <td className="p-3 text-right">
                      <span
                        className={cn(
                          "font-medium",
                          deviation.warning
                            ? "text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        {deviation.difference >= 0 ? "+" : ""}
                        {deviation.difference.toFixed(2)}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={STATUS_VARIANT[report.status]}>
                        {STATUS_LABEL[report.status]}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {report.createdAt.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setDetailId(detailId === report.id ? null : report.id)
                        }
                        className="text-primary text-xs underline-offset-4 hover:underline"
                        aria-label={`Lihat detail ${periodeLabel(report.periodeBulan, report.periodeTahun)}`}
                      >
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedReport ? (
        <div className="space-y-3 rounded-xl border p-4">
          <h3 className="text-sm font-semibold">Dokumen Pelaporan</h3>
          <p className="text-muted-foreground text-sm">
            {periodeLabel(
              selectedReport.periodeBulan,
              selectedReport.periodeTahun,
            )}{" "}
            ·{" "}
            {selectedReport.createdAt.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            {selectedReport.dokumen.map((dokumen) => (
              <li key={dokumen.id}>
                {dokumen.url ? (
                  <a
                    href={dokumen.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {dokumen.name}
                  </a>
                ) : (
                  dokumen.name
                )}{" "}
                · {(dokumen.size / 1_048_576).toFixed(2)} MB
              </li>
            ))}
            {selectedReport.dokumen.length === 0 && (
              <li>Belum ada dokumen terlampir.</li>
            )}
          </ul>
          {selectedReport.catatan ? (
            <>
              <h3 className="text-sm font-semibold">
                Catatan Evaluasi / Kendala
              </h3>
              <p className="text-sm">{selectedReport.catatan}</p>
            </>
          ) : null}
          <button
            type="button"
            onClick={() => setDetailId(null)}
            className="text-primary text-xs underline-offset-4 hover:underline"
          >
            Tutup detail
          </button>
        </div>
      ) : null}
    </section>
  );
}