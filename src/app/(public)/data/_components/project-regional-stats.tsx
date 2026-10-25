import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  HeartPulse,
  Users,
  UserRoundSearch,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { SourceBadge } from "@/components/source-badges/source-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PROJECT_STATUSES = [
  { label: "Selesai", count: 156, color: "#0f9f91" },
  { label: "Berjalan", count: 72, color: "#2563eb" },
  { label: "Tertunda", count: 12, color: "#c45b16" },
] as const;

const TOTAL_PROJECTS = PROJECT_STATUSES.reduce(
  (total, status) => total + status.count,
  0,
);
const DONUT_CIRCUMFERENCE = 2 * Math.PI * 42;

interface RegionalIndicator {
  label: string;
  value: string;
  previousValue: string;
  trend: string;
  description: string;
  Icon: LucideIcon;
  trendIsPositive: boolean;
}

const REGIONAL_INDICATORS: RegionalIndicator[] = [
  {
    label: "Jumlah penduduk",
    value: "50,4 juta",
    previousValue: "49,8 juta",
    trend: "+0,6 juta dari 2024",
    description: "Penduduk pertengahan tahun",
    Icon: Users,
    trendIsPositive: true,
  },
  {
    label: "Indeks pembangunan manusia",
    value: "75,2",
    previousValue: "74,6",
    trend: "+0,6 poin dari 2024",
    description: "Skala 0–100",
    Icon: HeartPulse,
    trendIsPositive: true,
  },
  {
    label: "Tingkat kemiskinan",
    value: "7,4%",
    previousValue: "7,1%",
    trend: "+0,3 poin dari 2024",
    description: "Persentase penduduk",
    Icon: HeartPulse,
    trendIsPositive: false,
  },
  {
    label: "Pengangguran terbuka",
    value: "6,8%",
    previousValue: "6,4%",
    trend: "+0,4 poin dari 2024",
    description: "10,7 juta orang · persentase angkatan kerja",
    Icon: UserRoundSearch,
    trendIsPositive: false,
  },
];

function ProjectProgressCard() {
  let precedingPercentage = 0;

  return (
    <Card className="border-border bg-card flex h-full flex-col shadow-sm">
      <CardHeader className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">
              Progres proyek
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              {TOTAL_PROJECTS} proyek di 27 kabupaten/kota
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <SourceBadge
              source="SIMULATED"
              label="Simulasi"
              withIcon={false}
              className="px-1.5 py-0.5 text-[10px]"
            />
            <BriefcaseBusiness
              className="text-muted-foreground size-4 shrink-0"
              aria-hidden="true"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-4 pb-4">
        <div className="grid flex-1 items-center gap-4 sm:grid-cols-[112px_minmax(0,1fr)]">
          <div className="relative mx-auto size-28" aria-hidden="true">
            <svg
              data-testid="project-status-donut"
              viewBox="0 0 100 100"
              className="size-full"
            >
              <g transform="rotate(-90 50 50)">
                {PROJECT_STATUSES.map((status) => {
                  const percentage = (status.count / TOTAL_PROJECTS) * 100;
                  const segmentLength =
                    (DONUT_CIRCUMFERENCE * percentage) / 100;
                  const strokeDasharray = `${segmentLength} ${DONUT_CIRCUMFERENCE - segmentLength}`;
                  const strokeDashoffset =
                    -(DONUT_CIRCUMFERENCE * precedingPercentage) / 100;
                  precedingPercentage += percentage;

                  return (
                    <circle
                      key={status.label}
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke={status.color}
                      strokeWidth="9"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="butt"
                    />
                  );
                })}
              </g>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold tracking-tight">
                {Math.round((PROJECT_STATUSES[0].count / TOTAL_PROJECTS) * 100)}
                %
              </span>
              <span className="text-muted-foreground text-[10px]">selesai</span>
            </div>
          </div>

          <table
            id="project-status-breakdown"
            className="w-full text-left text-xs"
          >
            <caption className="sr-only">
              Rincian status dari {TOTAL_PROJECTS} proyek
            </caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">Status</th>
                <th scope="col">Jumlah</th>
                <th scope="col">Persentase</th>
              </tr>
            </thead>
            <tbody>
              {PROJECT_STATUSES.map((status) => {
                const percentage = Math.round(
                  (status.count / TOTAL_PROJECTS) * 100,
                );

                return (
                  <tr key={status.label}>
                    <th
                      scope="row"
                      className="text-muted-foreground py-1.5 font-normal"
                    >
                      <span
                        className="mr-2 inline-block size-2 rounded-full"
                        style={{ backgroundColor: status.color }}
                        aria-hidden="true"
                      />
                      {status.label}
                    </th>
                    <td className="py-1.5 pr-2 font-semibold tabular-nums">
                      {status.count}
                    </td>
                    <td className="py-1.5 text-right font-semibold tabular-nums">
                      {percentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-muted-foreground mt-4 text-xs leading-5">
          12 proyek tertunda memerlukan progres fisik dan data proyek.
        </p>

        <Link
          href="#project-status-breakdown"
          className="border-border text-primary hover:bg-accent focus-visible:ring-ring mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <ArrowRight className="size-4" aria-hidden="true" />
          Jelajahi proyek
        </Link>
      </CardContent>
    </Card>
  );
}

function RegionalStatsCard() {
  return (
    <Card className="border-border bg-card h-full shadow-sm">
      <CardHeader className="px-4 pt-4 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">
              Statistik daerah
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              Profil daerah · indikator tahunan 2025
            </CardDescription>
          </div>
          <SourceBadge
            source="SIMULATED"
            label="Simulasi"
            withIcon={false}
            className="px-1.5 py-0.5 text-[10px]"
          />
        </div>
        <p className="text-primary pt-2 text-xs font-medium">
          Perbandingan 2024 dan 2025
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {REGIONAL_INDICATORS.map(
            ({
              label,
              value,
              previousValue,
              trend,
              description,
              Icon,
              trendIsPositive,
            }) => {
              const TrendIcon = trendIsPositive ? ArrowUpRight : ArrowDownRight;

              return (
                <article
                  key={label}
                  aria-label={`${label}: ${value} pada 2025, ${previousValue} pada 2024`}
                  className="bg-muted/50 rounded-lg p-3"
                >
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Icon
                      className="text-primary size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <h3>{label}</h3>
                  </div>
                  <p className="mt-2 text-xl font-semibold tracking-tight">
                    {value}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-1 text-[11px]">
                    <TrendIcon
                      className="text-muted-foreground size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{trend}</span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-[10px]">
                    2024: {previousValue} · {description}
                  </p>
                </article>
              );
            },
          )}
        </div>
        <p className="text-muted-foreground mt-3 text-[10px] leading-4">
          Nilai dan perbandingan merupakan ilustrasi, bukan data resmi.
        </p>
      </CardContent>
    </Card>
  );
}

export function ProjectRegionalStats() {
  return (
    <section
      aria-labelledby="project-regional-stats-title"
      className="space-y-4"
    >
      <div>
        <h2
          id="project-regional-stats-title"
          className="text-card-foreground text-xl font-semibold tracking-tight"
        >
          Progres proyek &amp; Statistik daerah
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Ringkasan pelaksanaan proyek dan indikator kesejahteraan.
        </p>
      </div>
      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.1fr)]">
        <ProjectProgressCard />
        <RegionalStatsCard />
      </div>
    </section>
  );
}
