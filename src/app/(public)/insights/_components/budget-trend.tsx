"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AccessibleChartTable } from "@/components/charts/shared";
import {
  budgetTrendResponseSchema,
  calculateBudgetTrendSummary,
  transformBudgetTrendData,
  type BudgetTrendResponse,
} from "@/lib/insight-anggaran";

function BudgetTrendSkeleton() {
  return (
    <section
      aria-label="Memuat tren anggaran"
      aria-busy="true"
      className="border-border bg-card animate-pulse space-y-4 rounded-xl border p-5"
    >
      <span className="sr-only">Memuat tren anggaran...</span>
      <div className="bg-muted h-7 w-2/3 rounded" />
      <div className="bg-muted h-56 rounded" />
    </section>
  );
}

export function BudgetTrend({ fokus }: { fokus: string }) {
  const [data, setData] = useState<BudgetTrendResponse | null>(null);
  const [hasError, setHasError] = useState(false);

  const loadData = useCallback(async () => {
    setHasError(false);
    try {
      const response = await fetch("/api/insight/anggaran?tahun=2020-2024", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Gagal memuat tren anggaran.");
      }
      setData(budgetTrendResponseSchema.parse(await response.json()));
    } catch {
      setHasError(true);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (!data && !hasError) {
    return <BudgetTrendSkeleton />;
  }

  if (hasError || !data) {
    return (
      <section
        aria-labelledby="budget-trend-title"
        className="border-border bg-card rounded-xl border p-5"
      >
        <h2 id="budget-trend-title" className="text-xl font-semibold">
          Anggaran naik, bagaimana realisasinya?
        </h2>
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <span>Gagal memuat tren anggaran.</span>
          <button
            type="button"
            onClick={() => void loadData()}
            className="focus-visible:outline-primary inline-flex items-center gap-2 font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Coba lagi
          </button>
        </div>
      </section>
    );
  }

  const summary = calculateBudgetTrendSummary(data.data);
  const chartData = transformBudgetTrendData(data.data);

  return (
    <section
      aria-labelledby="budget-trend-title"
      className="border-border bg-card min-w-0 space-y-4 rounded-xl border p-5 sm:p-6"
    >
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-primary text-xs font-semibold tracking-wider uppercase">
            Anggaran daerah
          </p>
        </div>
        <h2
          id="budget-trend-title"
          className="text-foreground text-xl font-bold tracking-tight"
        >
          Anggaran naik, bagaimana realisasinya?
        </h2>
        <p className="text-muted-foreground text-sm">
          {fokus} · {data.periode}
        </p>
      </header>

      <div>
        <p className="text-muted-foreground mb-2 text-xs">
          Triliun rupiah (Rp)
        </p>
        <AccessibleChartTable
          data={chartData}
          xKey="tahun"
          caption={`Grafik batang anggaran dan realisasi ${fokus}, ${data.periode}, triliun rupiah`}
          series={[
            { key: "anggaran", name: "Anggaran" },
            { key: "realisasi", name: "Realisasi" },
          ]}
        />
        <div aria-hidden="true" className="h-[220px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, bottom: 4, left: -18 }}
              barGap={5}
              barCategoryGap="22%"
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="tahun"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <YAxis
                domain={[0, 3]}
                ticks={[0, 1, 2, 3]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              />
              <Tooltip
                formatter={(value, name) => [
                  `${value} triliun`,
                  name === "anggaran" ? "Anggaran" : "Realisasi",
                ]}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  color: "var(--popover-foreground)",
                }}
              />
              <Legend
                formatter={(value) =>
                  value === "anggaran" ? "Anggaran" : "Realisasi"
                }
                wrapperStyle={{
                  color: "var(--foreground)",
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="anggaran"
                fill="#1769d2"
                radius={[2, 2, 0, 0]}
                maxBarSize={20}
              />
              <Bar
                dataKey="realisasi"
                fill="#218b67"
                radius={[2, 2, 0, 0]}
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="border-border mt-2 overflow-x-auto border-y">
          <table className="w-full min-w-[320px] text-xs">
            <caption className="sr-only">
              Rincian anggaran dan realisasi {fokus} tahun {data.periode}
            </caption>
            <thead className="text-muted-foreground">
              <tr className="border-border border-b">
                <th scope="col" className="px-2 py-2 text-left font-medium">
                  Tahun
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  Anggaran
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  Realisasi
                </th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((row) => (
                <tr
                  key={row.tahun}
                  className="border-border border-b last:border-0"
                >
                  <th scope="row" className="px-2 py-2 text-left font-medium">
                    {row.tahun}
                  </th>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {row.anggaran.toLocaleString("id-ID", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {row.realisasi.toLocaleString("id-ID", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <aside
        role="note"
        className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
      >
        <p className="font-semibold">
          {summary.realizationRate}% anggaran terealisasi pada 2024.
        </p>
        <p className="mt-1 text-xs leading-relaxed">
          Realisasi meningkat dari Rp1,5 triliun menjadi Rp2,7 triliun. Nilai
          nominal belum disesuaikan dengan inflasi dan tidak membuktikan
          peningkatan kualitas layanan.
        </p>
      </aside>
      <p className="text-muted-foreground text-xs">
        Sumber contoh: Simulasi APBD Agoraya, 2020–2024. Data contoh, bukan
        catatan APBD resmi.
      </p>
    </section>
  );
}
