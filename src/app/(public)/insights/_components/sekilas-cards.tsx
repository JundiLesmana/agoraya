"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Clock, TrendingUp, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SourceBadge } from "@/components/source-badges/source-badge";
import {
  buildSekilasAriaLabel,
  type SekilasItem,
  sekilasItemsSchema,
} from "@/lib/insight-sekilas";

type SekilasColor = "success" | "warning";

const COLOR_CLASSES: Record<SekilasColor, { icon: string; text: string }> = {
  success: {
    icon: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  warning: {
    icon: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    text: "text-amber-700 dark:text-amber-400",
  },
};

const PRESENTATION = new Map<
  string,
  { Icon: typeof Clock; color: SekilasColor }
>([
  ["Layanan", { Icon: Clock, color: "success" }],
  ["Realisasi", { Icon: TrendingUp, color: "success" }],
  ["Penduduk miskin", { Icon: Users, color: "success" }],
]);

function SekilasCard({ item }: { item: SekilasItem }) {
  const { Icon, color } = PRESENTATION.get(item.label) ?? {
    Icon: AlertTriangle,
    color: "warning",
  };
  const classes =
    color === "success" ? COLOR_CLASSES.success : COLOR_CLASSES.warning;
  const ariaLabel = buildSekilasAriaLabel(item);

  return (
    <Card
      role="group"
      aria-label={ariaLabel}
      className="border-border bg-card gap-3 p-4 shadow-sm"
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 p-0">
        <div
          className={`inline-flex size-9 items-center justify-center rounded-lg ${classes.icon}`}
        >
          <Icon className="size-4" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-[10px]">Simulasi</span>
          <SourceBadge
            source="SIMULATED"
            label="Data contoh"
            withIcon={false}
            className="px-1.5 py-0.5 text-[10px] leading-none"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-1 p-0">
        <CardDescription className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
          {item.label}
        </CardDescription>
        <p className="text-muted-foreground text-xs">{item.sublabel}</p>
        <CardTitle className="text-foreground text-4xl font-bold tracking-tight">
          {item.value}
        </CardTitle>
        <p className={`text-sm font-medium ${classes.text}`}>{item.delta}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {item.interpretation}
        </p>
        <p className="text-muted-foreground text-xs">{item.context}</p>
      </CardContent>
    </Card>
  );
}

export function SekilasSkeleton() {
  return (
    <section
      aria-label="Kartu KPI sekilas"
      aria-busy="true"
      role="status"
      className="space-y-4"
    >
      <p className="sr-only">Memuat kartu KPI sekilas...</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((index) => (
          <Card
            key={index}
            className="border-border bg-card gap-3 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="sr-only">Memuat kartu KPI {index} dari 3</span>
              <span className="bg-muted/40 inline-flex size-9 animate-pulse items-center justify-center rounded-lg motion-reduce:animate-none">
                <Clock className="size-4" aria-hidden="true" />
              </span>
              <span className="bg-muted h-5 w-20 animate-pulse rounded-full motion-reduce:animate-none" />
            </div>
            <div className="space-y-2">
              <div className="bg-muted h-4 w-1/2 animate-pulse rounded motion-reduce:animate-none" />
              <div className="bg-muted h-10 w-3/4 animate-pulse rounded motion-reduce:animate-none" />
              <div className="bg-muted h-4 w-1/3 animate-pulse rounded motion-reduce:animate-none" />
              <div className="bg-muted h-3 w-1/2 animate-pulse rounded motion-reduce:animate-none" />
              <div className="bg-muted h-3 w-5/6 animate-pulse rounded motion-reduce:animate-none" />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function SekilasError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
    >
      <h3 className="text-sm font-semibold">Gagal memuat perubahan kunci</h3>
      <p className="mt-1 text-sm">{error.message}</p>
      <button
        onClick={onRetry}
        className="text-primary mt-3 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
      >
        Coba lagi
      </button>
    </div>
  );
}

interface SekilasCardsProps {
  /** Filter awal yang dikirim ke API (wilayah, fokus, periode). */
  filters?: { wilayah?: string; fokus?: string; periode?: string };
  topik?: string;
}

export function SekilasCards({ filters, topik }: SekilasCardsProps = {}) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<SekilasItem[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchCount = useRef(0);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters?.wilayah) params.set("wilayah", filters.wilayah);
    if (filters?.fokus) params.set("fokus", filters.fokus);
    if (filters?.periode) params.set("periode", filters.periode);
    ["wilayah", "fokus", "periode"].forEach((key) => {
      const value = searchParams.get(key);
      if (value) {
        params.set(key, value);
      }
    });
    return params.toString();
  }, [searchParams, filters]);

  const fetchData = useCallback(async (nextQuery: string) => {
    const attempt = ++fetchCount.current;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/insight/sekilas?${nextQuery}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Gagal memuat data sekilas.");
      }

      const json = await response.json();
      const items = sekilasItemsSchema.parse(json);

      if (attempt !== fetchCount.current) {
        return;
      }
      setData(items);
    } catch (err) {
      if (attempt !== fetchCount.current) {
        return;
      }
      setError(
        err instanceof Error ? err : new Error("Gagal memuat data sekilas."),
      );
    } finally {
      if (attempt === fetchCount.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchData(query);
  }, [query, fetchData]);

  if (isLoading) {
    return <SekilasSkeleton />;
  }

  if (error) {
    return <SekilasError error={error} onRetry={() => void fetchData(query)} />;
  }

  if (!data) {
    return <SekilasSkeleton />;
  }

  if (data.length === 0) {
    return (
      <section aria-labelledby="sekilas-title" className="space-y-4">
        <h2
          id="sekilas-title"
          className="text-foreground text-xl font-semibold tracking-tight"
        >
          Sekilas, apa yang berubah?
        </h2>
        <p role="status" className="text-muted-foreground text-sm">
          Belum ada data sekilas.
        </p>
      </section>
    );
  }

  const topicLabels = new Map([
    ["Layanan", "Layanan"],
    ["Anggaran", "Realisasi"],
    ["Kesejahteraan", "Penduduk miskin"],
  ]);
  const isAllTopics = !topik || topik === "Semua topik";
  const topicLabel = topik ? topicLabels.get(topik) : undefined;
  const visibleData = isAllTopics
    ? data
    : data.filter((item) => item.label === topicLabel);

  if (visibleData.length === 0) {
    return (
      <section aria-labelledby="sekilas-title" className="space-y-4">
        <h2
          id="sekilas-title"
          className="text-foreground text-xl font-semibold tracking-tight"
        >
          Sekilas, apa yang berubah?
        </h2>
        <p role="status" className="text-muted-foreground text-sm">
          Tidak ada ringkasan untuk topik yang dipilih.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="sekilas-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="sekilas-title"
          className="text-foreground text-xl font-semibold tracking-tight"
        >
          Sekilas, apa yang berubah?
        </h2>
        <p className="text-muted-foreground text-xs">
          Perubahan kunci dalam hitungan detik.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleData.map((item) => (
          <SekilasCard key={item.label} item={item} />
        ))}
      </div>
    </section>
  );
}
