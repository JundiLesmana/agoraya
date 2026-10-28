"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Info, Lightbulb } from "lucide-react";
import { SourceBadge } from "@/components/source-badges/source-badge";
import { Button } from "@/components/ui/button";
import {
  formatPercentagePoints,
  timelyServiceResponseSchema,
  transformTimelyServiceResponse,
  type TimelyServiceChartRow,
  type TimelyServiceComparison,
} from "@/lib/insight-layanan";

const CITY_QUERY = "Bandung,Bogor,Depok,Bekasi,Cimahi";

const CHART_COLORS: Record<TimelyServiceChartRow["city"], string> = {
  Bandung: "#1769d2",
  Bogor: "#8bb8eb",
  Depok: "#8bb8eb",
  Bekasi: "#8bb8eb",
  Cimahi: "#8bb8eb",
};

function isTimelyServiceChartRow(
  value: unknown,
): value is TimelyServiceChartRow {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return (
    "city" in value &&
    "percentage" in value &&
    "deltaFromAverage" in value &&
    typeof value.city === "string" &&
    typeof value.percentage === "number" &&
    typeof value.deltaFromAverage === "number"
  );
}

function TimelyServiceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: readonly { payload?: unknown }[];
}) {
  const rowValue = payload?.[0]?.payload;
  if (!active || !isTimelyServiceChartRow(rowValue)) {
    return null;
  }

  return (
    <div className="border-border bg-card rounded-md border px-3 py-2 text-sm shadow-md">
      <p className="font-semibold">Kota {rowValue.city}</p>
      <p>{rowValue.percentage}% selesai tepat waktu</p>
      <p className="text-muted-foreground">
        {formatPercentagePoints(rowValue.deltaFromAverage)} dari rata-rata
      </p>
    </div>
  );
}

function ComparisonSkeleton() {
  return (
    <section
      aria-label="Perbandingan layanan tepat waktu"
      aria-busy="true"
      role="region"
      className="border-border bg-card rounded-xl border p-5"
    >
      <p className="sr-only">Memuat perbandingan layanan...</p>
      <div className="bg-muted h-7 w-2/3 animate-pulse rounded" />
      <div className="bg-muted/50 mt-5 h-64 animate-pulse rounded" />
    </section>
  );
}

function ComparisonError({ onRetry }: { onRetry: () => void }) {
  return (
    <section
      aria-labelledby="timely-service-title"
      className="border-border bg-card rounded-xl border p-5"
    >
      <h2 id="timely-service-title" className="text-xl font-semibold">
        Seberapa tepat waktu layanan daerah?
      </h2>
      <div
        role="alert"
        className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
      >
        Gagal memuat perbandingan layanan tepat waktu.
        <Button variant="outline" size="sm" className="ml-3" onClick={onRetry}>
          Coba lagi
        </Button>
      </div>
    </section>
  );
}

function ComparisonEmpty() {
  return (
    <p
      role="status"
      className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm"
    >
      Belum ada data perbandingan layanan untuk ditampilkan.
    </p>
  );
}

function ComparisonChart({ data }: { data: TimelyServiceComparison }) {
  const chartData = data.rows.map((row) => ({
    ...row,
    cityLabel: `Kota ${row.city}`,
  }));
  const positiveDelta = data.rows[0]?.deltaFromAverage ?? 0;

  return (
    <div className="min-w-0">
      <div className="text-muted-foreground mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span className="inline-flex items-center gap-2">
          <span className="bg-primary size-2.5 rounded-sm" aria-hidden="true" />
          Daerah fokus
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="size-2.5 rounded-sm bg-blue-300"
            aria-hidden="true"
          />
          Daerah pembanding
        </span>
      </div>
      <p className="text-muted-foreground mb-2 text-xs">
        Permohonan selesai tepat waktu (%) • {data.period}
      </p>
      <div
        role="img"
        aria-label={`Grafik batang horizontal penyelesaian layanan tepat waktu tahun ${data.period}, rata-rata ${data.roundedAverage} persen`}
        className="h-[300px] w-full min-w-0"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 38, bottom: 8, left: 4 }}
          >
            <CartesianGrid horizontal={false} vertical={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(value: number) =>
                `${value}${value === 100 ? "%" : ""}`
              }
              tickLine={false}
              axisLine={false}
              fontSize={11}
            />
            <YAxis
              type="category"
              dataKey="cityLabel"
              width={100}
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <Tooltip content={<TimelyServiceTooltip />} />
            <ReferenceLine
              x={data.average}
              stroke="#1769d2"
              strokeDasharray="5 4"
              label={{
                value: `Rata-rata ${data.roundedAverage}%`,
                position: "insideTopRight",
                fill: "#1769d2",
                fontSize: 11,
              }}
            />
            <Bar
              dataKey="percentage"
              name="Selesai tepat waktu"
              background={{ fill: "#edf2f7", radius: 4 }}
              radius={[0, 4, 4, 0]}
              maxBarSize={28}
            >
              {chartData.map((row) => (
                <Cell key={row.city} fill={CHART_COLORS[row.city]} />
              ))}
              <LabelList
                dataKey="percentage"
                position="right"
                formatter={(value: unknown) => `${value}%`}
                className="fill-foreground"
                fontSize={12}
                fontWeight={600}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        Rata-rata sederhana:{" "}
        {data.average.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%.
        Bandung {formatPercentagePoints(positiveDelta)} di atas rata-rata.
      </p>
      <div className="border-primary bg-muted/60 text-muted-foreground mt-4 rounded-md border-l-4 p-3 text-xs leading-relaxed">
        <p>
          Sumber contoh: Simulasi layanan perizinan Agoraya, {data.period}.
          Persentase = permohonan selesai sesuai standar waktu ÷ seluruh
          permohonan selesai × 100. Semakin tinggi, semakin baik.
        </p>
        <SourceBadge
          source="SIMULATED"
          label="Data contoh"
          withIcon={false}
          className="mt-2"
        />
      </div>
      <div className="sr-only">
        <table>
          <caption>
            Data penyelesaian layanan tepat waktu di lima kota Jawa Barat tahun{" "}
            {data.period}. Rata-rata {data.roundedAverage}%.
          </caption>
          <thead>
            <tr>
              <th scope="col">Kota</th>
              <th scope="col">Selesai tepat waktu</th>
              <th scope="col">Selisih dari rata-rata</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.city}>
                <th scope="row">Kota {row.city}</th>
                <td>{row.percentage}%</td>
                <td>{formatPercentagePoints(row.deltaFromAverage)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TimelyServiceComparison() {
  const [data, setData] = useState<TimelyServiceComparison | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const response = await fetch(
        `/api/insight/layanan?kota=${encodeURIComponent(CITY_QUERY)}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        throw new Error("Gagal memuat perbandingan layanan.");
      }
      const json: unknown = await response.json();
      const parsed = timelyServiceResponseSchema.parse(json);
      setData(transformTimelyServiceResponse(parsed));
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (isLoading) {
    return <ComparisonSkeleton />;
  }
  if (hasError) {
    return <ComparisonError onRetry={() => void loadData()} />;
  }
  if (!data || data.rows.length === 0) {
    return <ComparisonEmpty />;
  }

  return (
    <section
      aria-labelledby="timely-service-title"
      className="border-border bg-card rounded-xl border p-5 sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-primary mb-1 text-xs font-semibold tracking-wider uppercase">
            Layanan publik
          </p>
          <h2
            id="timely-service-title"
            className="text-foreground text-xl font-semibold tracking-tight sm:text-2xl"
          >
            Seberapa tepat waktu layanan daerah?
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Bandingkan penyelesaian layanan di 5 kota Jawa Barat
          </p>
        </div>
        <SourceBadge source="SIMULATED" label="Data contoh" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.4fr)_minmax(15rem,0.9fr)]">
        <div className="min-w-0">
          <ComparisonChart data={data} />
        </div>
        <aside
          aria-labelledby="timely-service-meaning"
          className="rounded-lg bg-blue-50 p-5 text-blue-950"
        >
          <h3
            id="timely-service-meaning"
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <Lightbulb className="text-primary size-4" aria-hidden="true" />
            Apa artinya?
          </h3>
          <p className="mt-4 text-sm leading-relaxed font-medium">
            Bandung paling tinggi di antara 5 kota yang dibandingkan.
          </p>
          <p className="text-primary mt-4 text-3xl font-bold">
            {data.roundedAverage}%
          </p>
          <p className="mt-2 text-xs leading-relaxed text-blue-900/70">
            Rata-rata sederhana 5 kota. Bandung berada{" "}
            {formatPercentagePoints(positiveDeltaForBandung(data))} di atas
            rata-rata.
          </p>
          <div className="my-4 border-t border-blue-200" />
          <div className="border-primary bg-muted/60 text-muted-foreground flex gap-2 rounded-md border-l-4 p-3 text-xs leading-relaxed">
            <Info
              className="text-primary mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <p>
              Bukan peningkatan kualitas layanan keseluruhan. Volume permohonan
              dan jenis layanan tiap kota dapat berbeda.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function positiveDeltaForBandung(data: TimelyServiceComparison): number {
  return data.rows.find((row) => row.city === "Bandung")?.deltaFromAverage ?? 0;
}
