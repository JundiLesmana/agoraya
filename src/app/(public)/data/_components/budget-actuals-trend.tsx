"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { Info, RefreshCw } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { publishedApbdResponseSchema } from "@/modules/apbd-budget/contract";

type PublishedApbd = z.infer<typeof publishedApbdResponseSchema>;

function formatTrillion(value: number) {
  return `Rp${value.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} triliun`;
}

function BudgetTrendTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">Tahun {String(label)}</p>
      <div className="mt-1 space-y-1">
        {payload.map((entry) => (
          <p key={entry.name} style={{ color: entry.color ?? undefined }}>
            {entry.name}: {formatTrillion(Number(entry.value ?? 0))}
          </p>
        ))}
      </div>
    </div>
  );
}

export function BudgetActualsTrend() {
  const [entries, setEntries] = useState<PublishedApbd["entries"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    async function loadPublishedApbd() {
      try {
        const response = await fetch("/api/v1/apbd/published", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Data APBD terpublikasi gagal dimuat.");
        const parsed = publishedApbdResponseSchema.safeParse(
          await response.json(),
        );
        if (!parsed.success) {
          throw new Error("Format data APBD terpublikasi tidak valid.");
        }
        setEntries(parsed.data.entries);
        setError(null);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Data APBD terpublikasi gagal dimuat.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadPublishedApbd();
    return () => controller.abort();
  }, [retry]);

  const chartData = useMemo(() => {
    const totals = new Map<number, { budget: number; realization: number }>();
    for (const entry of entries) {
      const total = totals.get(entry.referenceYear) ?? {
        budget: 0,
        realization: 0,
      };
      for (const item of entry.items) {
        total.budget += Number(item.pagu ?? 0);
        total.realization += Number(item.realisasi ?? 0);
      }
      totals.set(entry.referenceYear, total);
    }
    return [...totals.entries()]
      .sort(([left], [right]) => left - right)
      .map(([year, total]) => ({
        year,
        budget: total.budget / 1_000_000_000_000,
        realization: total.realization / 1_000_000_000_000,
      }));
  }, [entries]);

  if (error) {
    return (
      <section aria-labelledby="budget-trend-title">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <h2 id="budget-trend-title" className="font-semibold leading-none tracking-tight">
              Anggaran dan realisasi APBD
            </h2>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
            <Button type="button" variant="outline" onClick={() => setRetry((count) => count + 1)}>
              <RefreshCw className="mr-2 size-4" aria-hidden="true" />
              Coba lagi
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (loading) {
    return (
      <section aria-labelledby="budget-trend-title" aria-busy="true">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <h2 id="budget-trend-title" className="font-semibold leading-none tracking-tight">
              Anggaran dan realisasi APBD
            </h2>
            <CardDescription>Memuat data APBD terpublikasi…</CardDescription>
          </CardHeader>
          <CardContent><div className="h-72 animate-pulse rounded-lg bg-muted/50" /></CardContent>
        </Card>
      </section>
    );
  }

  if (!chartData.length) {
    return (
      <section aria-labelledby="budget-trend-title">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <h2 id="budget-trend-title" className="font-semibold leading-none tracking-tight">
              Anggaran dan realisasi APBD
            </h2>
          </CardHeader>
          <CardContent>
            <p role="status" className="text-muted-foreground text-sm">
              Belum ada nilai anggaran yang dipublikasikan.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  const latest = chartData.at(-1);
  if (!latest) return null;
  const realizationRate =
    latest.budget > 0 ? (latest.realization / latest.budget) * 100 : 0;

  return (
    <section aria-labelledby="budget-trend-title">
      <Card className="border-border shadow-sm">
        <CardHeader className="gap-3 px-4 pt-5 pb-2 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-primary text-xs font-semibold uppercase tracking-wide">
              Anggaran daerah
            </p>
          </div>
          <div>
            <h2 id="budget-trend-title" className="text-xl font-semibold tracking-tight sm:text-2xl">
              Anggaran dan realisasi APBD
            </h2>
            <CardDescription className="mt-2">
              Akumulasi data APBD yang telah dipublikasikan · seluruh wilayah
            </CardDescription>
          </div>
          <p className="text-muted-foreground text-xs">Triliun rupiah (Rp)</p>
        </CardHeader>
        <CardContent className="space-y-5 px-4 pb-5 sm:px-6">
          <div
            role="img"
            aria-label="Grafik anggaran dan realisasi APBD terpublikasi per tahun"
            className="h-64 min-w-0 sm:h-72"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="year" tickLine={false} axisLine={false} className="fill-muted-foreground text-xs" />
                <YAxis
                  tickFormatter={(value: number) => `Rp${value.toLocaleString("id-ID")}`}
                  tickLine={false}
                  axisLine={false}
                  width={54}
                  className="fill-muted-foreground text-xs"
                />
                <Tooltip content={BudgetTrendTooltip} />
                <Legend />
                <Line type="monotone" dataKey="budget" name="Pagu" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="realization" name="Realisasi" stroke="#059669" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-sm">
              <caption className="sr-only">Pagu dan realisasi APBD terpublikasi menurut tahun</caption>
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium">Tahun</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Pagu (Rp triliun)</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Realisasi (Rp triliun)</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row) => (
                  <tr key={row.year} className="border-b border-border">
                    <th scope="row" className="px-3 py-2 text-left font-medium">{row.year}</th>
                    <td className="px-3 py-2 text-right tabular-nums">{row.budget.toLocaleString("id-ID", { maximumFractionDigits: 1 })}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.realization.toLocaleString("id-ID", { maximumFractionDigits: 1 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <aside aria-label="Cara membaca tren anggaran" className="flex gap-3 border-l-4 border-primary bg-muted/50 p-4">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm">
              Pada {latest.year}, {realizationRate.toLocaleString("id-ID", { maximumFractionDigits: 1 })}% pagu yang dipublikasikan telah terealisasi.
              {" "}Perhitungan menjumlahkan nilai triwulan dari entri APBD terbit.
            </p>
          </aside>
        </CardContent>
      </Card>
    </section>
  );
}
