import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SourceBadge } from '@/components/source-badges/source-badge';
import { PieChart } from '@/components/charts/pie-chart';
import { LineChart } from '@/components/charts/line-chart';
import { DashboardMockup } from '../_components/dashboard-preview';
import { SummaryKpiCards, type SummaryKpiData } from './_components/summary-kpi-cards';

// TODO: Replace with the read-only public-data aggregate endpoint when available.
const SUMMARY_KPI_DATA: SummaryKpiData = {
  totalAnggaran: 80_000_000_000_000,
  realisasi: 60_000_000_000_000,
  proyekSelesai: 156,
  totalProyek: 240,
  cakupanWilayah: 27,
};

const DASHBOARD_STATS = [
  { value: '+10.000', label: 'Dataset', description: 'Dataset nasional dan sektoral', source: 'SIMULATED' as const },
  { value: '34', label: 'Provinsi', description: 'Cakupan wilayah Indonesia', source: 'SIMULATED' as const },
  { value: '514', label: 'Kabupaten/Kota', description: 'Unit administratif terpantau', source: 'SIMULATED' as const },
  { value: '100%', label: 'Terbuka', description: 'Akses data publik transparan', source: 'SIMULATED' as const },
] as const;

// TODO(#24): replace with real data from modules/public-data when available
const MOCK_SECTOR_DATA = [
  { name: 'Infrastruktur', value: 28 },
  { name: 'Pendidikan', value: 19 },
  { name: 'Kesehatan', value: 18 },
  { name: 'Perlindungan Sosial', value: 17 },
  { name: 'Lainnya', value: 18 },
];

// TODO(#24): replace with real data from modules/public-data when available
const MOCK_TREND_DATA = [
  { bulan: 'Jan', anggaran: 3800, realisasi: 2900 },
  { bulan: 'Feb', anggaran: 3800, realisasi: 3100 },
  { bulan: 'Mar', anggaran: 3800, realisasi: 3300 },
  { bulan: 'Apr', anggaran: 3900, realisasi: 3500 },
  { bulan: 'Mei', anggaran: 4000, realisasi: 3600 },
  { bulan: 'Jun', anggaran: 4000, realisasi: 3700 },
  { bulan: 'Jul', anggaran: 4100, realisasi: 3800 },
  { bulan: 'Agu', anggaran: 4100, realisasi: 3900 },
  { bulan: 'Sep', anggaran: 4200, realisasi: 4000 },
  { bulan: 'Okt', anggaran: 4200, realisasi: 4050 },
  { bulan: 'Nov', anggaran: 4300, realisasi: 4100 },
];

export default function PublicDataPage() {
  return (
    <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-8">
      <SummaryKpiCards data={SUMMARY_KPI_DATA} />

      <section className="space-y-8">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] lg:gap-12">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Data Pemerintah</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-card-foreground sm:text-5xl">
              Akses Data, Pahami Kondisi, Lihat Bukti Nyata
            </h1>
            <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
              Jelajahi dataset pemerintah, pantau anggaran, dan baca kondisi publik melalui dashboard yang ringkas,
              terbuka, dan mudah dipahami oleh ASN, eksekutif, dan peneliti.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="rounded-full px-6 shadow-lg shadow-primary/20">
                <Link href="/data/catalog">
                  Jelajahi Semua Data
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <SourceBadge
                source="SIMULATED"
                label="Preview mockup"
                className="px-1.5 text-[10px] sm:px-2 sm:text-xs"
              />
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {DASHBOARD_STATS.map((stat) => (
                <Card key={stat.label} className="border-border bg-card shadow-sm">
                  <CardHeader className="space-y-2 px-4 pb-2 pt-4">
                    <CardDescription className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      {stat.label}
                    </CardDescription>
                    <CardTitle className="text-3xl font-semibold tracking-tight text-card-foreground">
                      {stat.value}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-3 px-4 pb-4">
                    <p className="max-w-[11rem] text-sm leading-6 text-muted-foreground">
                      {stat.description}
                    </p>
                    <SourceBadge
                      source={stat.source}
                      label={stat.source === 'SIMULATED' ? 'SIMULATED' : stat.source}
                      withIcon={false}
                      className="shrink-0 px-1.5 text-[10px] sm:px-2 sm:text-xs"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="order-last lg:order-none">
            <DashboardMockup />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight text-card-foreground">
          Visualisasi Data Pemerintah
        </h2>
        <p className="text-muted-foreground">Ringkasan alokasi dan tren realisasi anggaran pemerintah.</p>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="px-4 pb-3 pt-4">
              <CardTitle className="text-base font-semibold text-card-foreground">
                Realisasi Anggaran per Sektor
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Komposisi alokasi anggaran dalam diagram donat.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="h-[260px]">
                <PieChart
                  data={MOCK_SECTOR_DATA}
                  height={240}
                  width="100%"
                  showLegend={true}
                  showTooltip={true}
                  innerRadius="60%"
                  outerRadius="85%"
                  ariaLabel="Grafik realisasi anggaran per sektor"
                />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <SourceBadge
                  source="SIMULATED"
                  label="SIMULATED"
                  withIcon={false}
                  className="px-1.5 text-[10px] sm:px-2 sm:text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="px-4 pb-3 pt-4">
              <CardTitle className="text-base font-semibold text-card-foreground">
                Tren Realisasi Anggaran
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Perbandingan anggaran dan realisasi bulanan.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="h-[260px]">
                <LineChart
                  data={MOCK_TREND_DATA}
                  xKey="bulan"
                  series={[
                    { key: 'anggaran', name: 'Anggaran' },
                    { key: 'realisasi', name: 'Realisasi' },
                  ]}
                  height={240}
                  width="100%"
                  showGrid={true}
                  showLegend={true}
                  showTooltip={true}
                  showDots={false}
                  ariaLabel="Grafik tren realisasi anggaran bulanan"
                />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <SourceBadge
                  source="SIMULATED"
                  label="SIMULATED"
                  withIcon={false}
                  className="px-1.5 text-[10px] sm:px-2 sm:text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
