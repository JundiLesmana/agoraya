import * as React from "react";
import { Banknote, Building2, CheckCircle2, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SourceBadge } from "@/components/source-badges/source-badge";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/currency";

/**
 * Kartu statistik individual dalam BudgetSummary.
 */
interface BudgetCardProps {
  label: string;
  /** Nilai sudah diformat (mis. "Rp80 T" atau "75%"). */
  value: string;
  /** Teks konteks kecil di bawah nilai (mis. "Rp60 T dari pagu Rp80 T"). */
  context: string;
  icon: React.ElementType;
  iconClass: string;
  /** Hanya diisi pada kartu "Tingkat Realisasi" untuk menampilkan progress bar. */
  progress?: { value: number; label: string };
}

function BudgetSummaryIcon({
  icon: Icon,
  className,
}: {
  icon: React.ElementType;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg",
        className,
      )}
      aria-hidden="true"
    >
      <Icon className="size-4" />
    </div>
  );
}

function BudgetCard({
  label,
  value,
  context,
  icon: Icon,
  iconClass,
  progress,
}: BudgetCardProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BudgetSummaryIcon icon={Icon} className={iconClass} />
          <CardTitle className="text-sm leading-none font-semibold">
            {label}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <p className="text-foreground text-3xl font-bold tracking-tight">
          {value}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">{context}</p>
        {progress ? (
          <div className="mt-3">
            <div
              role="progressbar"
              aria-valuenow={progress.value}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={progress.label}
              className="bg-muted h-1.5 w-full rounded-full"
            >
              <div
                className="bg-primary h-1.5 rounded-full"
                style={{
                  width: `${Math.max(0, Math.min(100, progress.value))}%`,
                }}
              />
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {progress.label}
            </p>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="pt-3">
        <SourceBadge source="SIMULATED" className="text-xs" />
      </CardFooter>
    </Card>
  );
}

function BudgetSkeletonCard() {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div
            className="bg-muted flex size-7 shrink-0 animate-pulse items-center justify-center rounded-lg"
            aria-hidden="true"
          />
          <div className="bg-muted h-4 w-24 animate-pulse rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="bg-muted h-10 w-32 animate-pulse rounded-md" />
        <div className="bg-muted/50 mt-1 h-4 w-48 animate-pulse rounded-md" />
      </CardContent>
      <CardFooter className="pt-3">
        <div className="bg-muted/50 h-5 w-20 animate-pulse rounded-md" />
      </CardFooter>
    </Card>
  );
}

interface BudgetSummaryProps {
  totalAnggaran: number | null | undefined;
  realisasi: number | null | undefined;
  sisaAnggaran: number | null | undefined;
  tingkatRealisasi: number | null | undefined;
  /** Tahun anggaran untuk konteks kartu Total Anggaran. */
  tahun?: string;
  /** Periode untuk konteks kartu Realisasi. */
  periode?: string;
  /** Saat true, render skeleton card agar layout tidak bergeser saat data dimuat. */
  loading?: boolean;
}

/**
 * Ringkasan anggaran daerah dengan 4 metrik kunci:
 * Total Anggaran (Pagu), Realisasi, Sisa Anggaran, dan Tingkat Realisasi.
 *
 * Komponen presentasional (Server Component). Data diterima melalui props;
 * gunakan `loading` saat menunggu data dari API agar tidak terjadi CLS.
 */
export function BudgetSummary({
  totalAnggaran,
  realisasi,
  sisaAnggaran,
  tingkatRealisasi,
  tahun = "2025",
  periode = "s.d. September",
  loading = false,
}: BudgetSummaryProps) {
  const sisaPersen = tingkatRealisasi == null ? null : 100 - tingkatRealisasi;

  const cards = [
    {
      label: "Total Anggaran",
      value: formatCurrency(totalAnggaran),
      context: `Pagu APBD tahun ${tahun}`,
      icon: Building2,
      iconClass: "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
    },
    {
      label: "Realisasi Anggaran",
      value: formatCurrency(realisasi),
      context: `Kumulatif ${periode}`,
      icon: TrendingUp,
      iconClass:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400",
    },
    {
      label: "Sisa Anggaran",
      value: formatCurrency(sisaAnggaran),
      context:
        sisaPersen == null
          ? "Data belum tersedia"
          : `${formatPercent(sisaPersen)} belum terealisis`,
      icon: Banknote,
      iconClass:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400",
    },
    {
      label: "Tingkat Realisasi",
      value: formatPercent(tingkatRealisasi),
      context:
        realisasi == null || totalAnggaran == null
          ? "Data belum tersedia"
          : `${formatCurrency(realisasi)} dari pagu ${formatCurrency(
              totalAnggaran,
            )}`,
      icon: CheckCircle2,
      iconClass:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-400",
      progress: {
        value: tingkatRealisasi == null ? 0 : tingkatRealisasi,
        label: formatPercent(tingkatRealisasi),
      },
    },
  ] as const;

  return (
    <section aria-labelledby="budget-summary-heading" className="space-y-2">
      <h2 id="budget-summary-heading" className="sr-only">
        Ringkasan anggaran daerah
      </h2>
      <div
        className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4")}
      >
        {loading
          ? cards.map((_, i) => <BudgetSkeletonCard key={i} />)
          : cards.map((card) => <BudgetCard key={card.label} {...card} />)}
      </div>
    </section>
  );
}

export default BudgetSummary;
