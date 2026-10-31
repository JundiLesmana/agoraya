"use client";

import { useCallback, useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  budgetTrendResponseSchema,
  calculateBudgetTrendSummary,
  transformBudgetTrendData,
  type BudgetTrendResponse,
} from "@/lib/insight-anggaran";

function formatTrillion(value: number) {
  return `Rp${value.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} triliun`;
}

function BudgetTrendTooltip({
  active,
  payload,
  label,
}: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{String(label)}</p>
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
  const [trend, setTrend] = useState<BudgetTrendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    setTrend(null);

    async function loadTrend() {
      try {
        const response = await fetch(
          "/api/insight/anggaran?tahun=2020-2024",
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error("Data tren anggaran gagal dimuat.");
        }

        const parsed = budgetTrendResponseSchema.safeParse(
          await response.json(),
        );
        if (!parsed.success) {
          throw new Error("Format data tren anggaran tidak valid.");
        }

        setTrend(parsed.data);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Data tren anggaran gagal dimuat.",
        );
      }
    }

    void loadTrend();
    return () => controller.abort();
  }, [retry]);

  const retryLoading = useCallback(() => setRetry((count) => count + 1), []);

  if (error) {
    return (
      <section aria-labelledby="budget-trend-title">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <h2
              id="budget-trend-title"
              className="font-semibold leading-none tracking-tight"
            >
              Anggaran naik, bagaimana realisasinya?
            </h2>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
            <Button type="button" variant="outline" onClick={retryLoading}>
              <RefreshCw className="mr-2 size-4" aria-hidden="true" />
              Coba lagi
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!trend) {
    return (
      <section aria-labelledby="budget-trend-title" aria-busy="true">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <h2
              id="budget-trend-title"
              className="font-semibold leading-none tracking-tight"
            >
              Anggaran naik, bagaimana realisasinya?
            </h2>
            <CardDescription>Memuat tren anggaran…</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 animate-pulse rounded-lg bg-muted/50" />
          </CardContent>
        </Card>
      </section>
    );
  }

  const chartData = transformBudgetTrendData(trend.data);
  const summary = calculateBudgetTrendSummary(trend.data);

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
            <h2
              id="budget-trend-title"
              className="text-xl font-semibold tracking-tight sm:text-2xl"
            >
              Anggaran naik, bagaimana realisasinya?
            </h2>
            <CardDescription className="mt-2">
              {trend.wilayah} · {trend.periode}
            </CardDescription>
          </div>
          <p className="text-muted-foreground text-xs">
            Triliun rupiah (Rp)
          </p>
        </CardHeader>
        <CardContent className="space-y-5 px-4 pb-5 sm:px-6">
          <div
            role="img"
            aria-label={`Grafik garis anggaran dan realisasi Kota Bandung ${trend.periode}, dalam triliun rupiah`}
            className="h-64 min-w-0 sm:h-72"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 12, bottom: 8, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="tahun"
                  tickLine={false}
                  axisLine={false}
                  className="fill-muted-foreground text-xs"
                />
                <YAxis
                  domain={[0, 3.5]}
                  ticks={[0, 1, 2, 3, 3.5]}
                  tickFormatter={(value: number) =>
                    `Rp${value.toLocaleString("id-ID")}`
                  }
                  tickLine={false}
                  axisLine={false}
                  width={54}
                  className="fill-muted-foreground text-xs"
                />
                <Tooltip content={BudgetTrendTooltip} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="anggaran"
                  name="Anggaran"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="realisasi"
                  name="Realisasi"
                  stroke="#059669"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-sm">
              <caption className="sr-only">
                Data anggaran dan realisasi Kota Bandung tahun 2020 sampai 2024,
                dalam triliun rupiah
              </caption>
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium">
                    Tahun
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Anggaran (Rp triliun)
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    Realisasi (Rp triliun)
                  </th>
                </tr>
              </thead>
              <tbody>
                {trend.data.map((row) => (
                  <tr key={row.tahun} className="border-b border-border">
                    <th scope="row" className="px-3 py-2 text-left font-medium">
                      {row.tahun}
                    </th>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.anggaran.toLocaleString("id-ID", {
                        minimumFractionDigits: 1,
                      })}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.realisasi.toLocaleString("id-ID", {
                        minimumFractionDigits: 1,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside
            aria-label="Cara membaca tren anggaran"
            className="flex gap-3 border-l-4 border-primary bg-muted/50 p-4"
          >
            <Info
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p className="text-sm">
              <span className="font-semibold">
                {summary.realizationRate}% anggaran terealisasi pada 2024.
              </span>{" "}
              {formatTrillion(trend.data[trend.data.length - 1].realisasi)} dari{" "}
              {formatTrillion(trend.data[trend.data.length - 1].anggaran)}.
              {" "}Naik {summary.realizationIncrease}% dibanding realisasi 2020
              ({formatTrillion(trend.data[0].realisasi)}); belum disesuaikan
              dengan inflasi.
            </p>
          </aside>

          <p className="text-muted-foreground text-xs leading-relaxed">
            Sumber contoh: Simulasi APBD Agoraya · 2020–2024. Nilai nominal,
            bukan APBD resmi. Kenaikan belanja tidak otomatis menunjukkan
            peningkatan mutu layanan.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
