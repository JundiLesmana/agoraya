"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { LineChart } from "@/components/charts/line-chart";
import { SourceBadge } from "@/components/source-badges";
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
          <SourceBadge source="SIMULATED" label="Data contoh" />
        </div>
        <h2
          id="budget-trend-title"
          className="text-foreground text-xl font-bold tracking-tight"
        >
          Anggaran naik, bagaimana realisasinya?
        </h2>
        <p className="text-muted-foreground text-sm">
          {fokus} · {data.periode} · Data contoh
        </p>
      </header>

      <p className="text-muted-foreground text-xs">Triliun rupiah (Rp)</p>
      <LineChart
        data={chartData}
        xKey="tahun"
        width="100%"
        height={250}
        showDots
        ariaLabel={`Tren anggaran dan realisasi Kota Bandung ${data.periode}, dalam triliun rupiah`}
        series={[
          { key: "anggaran", name: "Anggaran", color: "#1769d2" },
          { key: "realisasi", name: "Realisasi", color: "#218b67" },
        ]}
      />

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
