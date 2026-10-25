import { BarChart3, CheckCircle2, Database, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SourceBadge } from "@/components/source-badges/source-badge";
import {
  formatPersentase,
  formatRupiah,
  formatRupiahForScreenReader,
} from "@/lib/public-data-format";

export interface SummaryKpiData {
  totalAnggaran: number;
  realisasi: number;
  proyekSelesai: number;
  totalProyek: number;
  cakupanWilayah: number;
}

interface SummaryKpiCardsProps {
  data: SummaryKpiData | null;
  periodLabel?: string;
}

const KPI_PRESENTATION = [
  {
    Icon: Database,
    iconClass: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    Icon: BarChart3,
    iconClass:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    Icon: CheckCircle2,
    iconClass:
      "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
  },
  {
    Icon: MapPin,
    iconClass: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
  },
] as const;

function SummaryKpiSkeleton() {
  return (
    <section
      aria-label="Ringkasan anggaran dan pembangunan"
      aria-busy="true"
      role="status"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {KPI_PRESENTATION.map(({ Icon, iconClass }, index) => (
          <Card
            key={index}
            className="border-border bg-card gap-3 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="sr-only">
                Memuat kartu KPI {index + 1} dari 4
              </span>
              <span
                className={`inline-flex size-9 animate-pulse items-center justify-center rounded-lg motion-reduce:animate-none ${iconClass}`}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="bg-muted h-5 w-16 animate-pulse rounded-full motion-reduce:animate-none" />
            </div>
            <div className="space-y-2">
              <div className="bg-muted h-4 w-2/3 animate-pulse rounded motion-reduce:animate-none" />
              <div className="bg-muted h-8 w-3/4 animate-pulse rounded motion-reduce:animate-none" />
              <div className="bg-muted h-3 w-1/2 animate-pulse rounded motion-reduce:animate-none" />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function SummaryKpiCards({
  data,
  periodLabel = "Tahun anggaran 2025",
}: SummaryKpiCardsProps) {
  if (data === null) {
    return <SummaryKpiSkeleton />;
  }

  const realisasiPercentage =
    data.totalAnggaran > 0
      ? formatPersentase(data.realisasi / data.totalAnggaran)
      : "—";
  const projectPercentage =
    data.totalProyek > 0
      ? formatPersentase(data.proyekSelesai / data.totalProyek)
      : "—";

  const kpis = [
    {
      label: "Total anggaran",
      value: formatRupiah(data.totalAnggaran),
      description: "Pagu APBD sesuai filter aktif",
      ariaLabel: `Total anggaran ${formatRupiahForScreenReader(data.totalAnggaran)}`,
      Icon: Database,
      iconClass: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
    },
    {
      label: "Realisasi anggaran",
      value: formatRupiah(data.realisasi),
      description:
        realisasiPercentage === "—"
          ? "Persentase dari total anggaran tidak tersedia"
          : `${realisasiPercentage} dari total anggaran`,
      ariaLabel: `Realisasi anggaran ${formatRupiahForScreenReader(data.realisasi)}, ${realisasiPercentage} dari total anggaran`,
      Icon: BarChart3,
      iconClass:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    },
    {
      label: "Proyek selesai",
      value: `${data.proyekSelesai} / ${data.totalProyek}`,
      description:
        projectPercentage === "—"
          ? "Persentase proyek selesai tidak tersedia"
          : `${projectPercentage} dari seluruh proyek`,
      ariaLabel: `${data.proyekSelesai} dari ${data.totalProyek} proyek selesai, ${projectPercentage}`,
      Icon: CheckCircle2,
      iconClass:
        "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
    },
    {
      label: "Cakupan wilayah",
      value: `${data.cakupanWilayah} daerah`,
      description: "Kabupaten/kota tercakup",
      ariaLabel: `Cakupan wilayah ${data.cakupanWilayah} daerah`,
      Icon: MapPin,
      iconClass: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
    },
  ];

  return (
    <section aria-labelledby="summary-kpi-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="summary-kpi-title"
            className="text-card-foreground text-xl font-semibold tracking-tight"
          >
            Ringkasan Anggaran dan Pembangunan
          </h2>
          <CardDescription>
            Ikhtisar fiskal dan pelaksanaan proyek daerah.
          </CardDescription>
        </div>
        <p className="text-muted-foreground text-xs">{periodLabel}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map(
          ({ label, value, description, ariaLabel, Icon, iconClass }) => (
            <Card
              key={label}
              aria-label={ariaLabel}
              className="border-border bg-card gap-3 p-4 shadow-sm"
              role="group"
            >
              <CardHeader className="flex-row items-center justify-between gap-2 p-0">
                <span
                  className={`inline-flex size-9 items-center justify-center rounded-lg ${iconClass}`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <SourceBadge
                  source="SIMULATED"
                  label="Simulasi"
                  withIcon={false}
                  className="px-1.5 py-0.5 text-[10px]"
                />
              </CardHeader>
              <CardContent className="space-y-1 p-0">
                <CardDescription className="text-xs">{label}</CardDescription>
                <CardTitle className="text-card-foreground text-2xl font-semibold tracking-tight">
                  {value}
                </CardTitle>
                <p className="text-muted-foreground text-xs leading-5">
                  {description}
                </p>
              </CardContent>
            </Card>
          ),
        )}
      </div>
    </section>
  );
}
