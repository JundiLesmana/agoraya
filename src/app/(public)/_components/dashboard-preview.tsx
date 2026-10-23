import Image from 'next/image';
import { ArrowRight, Database, MapPin, Building2, Unlock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SourceBadge } from '@/components/source-badges/source-badge';
import { LineChart } from '@/components/charts/line-chart';
import { PieChart } from '@/components/charts/pie-chart';

const MOCK_SUMMARY_STATS = [
  {
    label: 'Total Anggaran',
    value: 'Rp 342,7 T',
    delta: '+12% dari tahun sebelumnya',
    icon: Database,
    iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300',
  },
  {
    label: 'Realisasi',
    value: 'Rp 284,1 T',
    delta: '+10% dari tahun sebelumnya',
    icon: Building2,
    iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
  },
  {
    label: 'Proyek Infrastruktur',
    value: '1.248',
    delta: '+8% dari tahun sebelumnya',
    icon: MapPin,
    iconClass: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300',
  },
] as const;

const MOCK_PIE_DATA = [
  { name: 'Pendidikan', value: 32 },
  { name: 'Kesehatan', value: 24 },
  { name: 'Infrastruktur', value: 18 },
  { name: 'Sosial', value: 14 },
  { name: 'Lainnya', value: 12 },
];

const MOCK_LINE_DATA = [
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

const PLATFORM_STATS = [
  { value: '+10.000', label: 'Dataset Tersedia', Icon: Database },
  { value: '34', label: 'Provinsi', Icon: MapPin },
  { value: '514', label: 'Kabupaten/Kota', Icon: Building2 },
  { value: '100%', label: 'Terbuka untuk Publik', Icon: Unlock },
] as const;

function MockSidebarNav() {
  const items = [
    { label: 'Beranda', active: false },
    { label: 'Dashboard', active: true },
    { label: 'Data Pemerintah', active: false },
    { label: 'Layanan Publik', active: false },
    { label: 'Lapor Warga', active: false },
    { label: 'Insight', active: false },
    { label: 'Pengaturan', active: false },
  ];
  return (
    <nav aria-label="Pratinjau navigasi dashboard" className="flex flex-col gap-0.5 py-2">
      {items.map(({ label, active }) => (
        <span
          key={label}
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${
            active
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground'
          }`}
        >
          {label}
        </span>
      ))}
    </nav>
  );
}

function DashboardMockup() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/5 dark:shadow-black/20"
      aria-label="Pratinjau dashboard publik menampilkan total anggaran dan realisasi"
      role="img"
    >
      <div className="flex items-center gap-3 border-b border-border bg-muted px-4 py-3">
        <Image src="/logo/logo-light.svg" alt="" width={110} height={25} className="h-6 w-auto dark:hidden" />
        <Image src="/logo/logo-dark.svg" alt="" width={110} height={25} className="hidden h-6 w-auto dark:block" />
        <span className="ml-auto rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Dashboard Publik
        </span>
      </div>

      <div className="flex min-h-0">
        <aside className="hidden w-40 shrink-0 border-r border-border bg-muted sm:block">
          <MockSidebarNav />
        </aside>

        <div className="flex-1 overflow-hidden p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">Dashboard Publik</p>
              <p className="text-xs text-muted-foreground">Ringkasan data pemerintah dalam satu tampilan</p>
            </div>
            <SourceBadge source="SIMULATED" />
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2">
            {MOCK_SUMMARY_STATS.map(({ label, value, delta, icon: Icon, iconClass }) => (
              <Card key={label} className="rounded-xl border-border bg-card p-0 shadow-none">
                <CardHeader className="p-2 pb-0">
                  <div className={`inline-flex size-7 items-center justify-center rounded-lg ${iconClass}`}>
                    <Icon className="size-3.5" aria-hidden="true" />
                  </div>
                </CardHeader>
                <CardContent className="p-2 pt-1">
                  <CardTitle className="text-sm font-bold leading-tight text-card-foreground">{value}</CardTitle>
                  <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{label}</p>
                  <p className="mt-0.5 text-[9px] text-emerald-600 dark:text-emerald-400">{delta}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-[10px] font-semibold text-muted-foreground">
                Realisasi Anggaran per Sektor
              </p>
              <PieChart
                data={MOCK_PIE_DATA}
                height={140}
                width="100%"
                showLegend={true}
                showTooltip={false}
                innerRadius="45%"
                outerRadius="72%"
                ariaLabel="Grafik realisasi anggaran per sektor"
              />
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold text-muted-foreground">Tren Realisasi Anggaran</p>
              <LineChart
                data={MOCK_LINE_DATA}
                xKey="bulan"
                series={[
                  { key: 'anggaran', name: 'Anggaran' },
                  { key: 'realisasi', name: 'Realisasi' },
                ]}
                height={140}
                width="100%"
                showGrid={false}
                showLegend={false}
                showTooltip={false}
                ariaLabel="Grafik tren realisasi anggaran"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <section
      aria-labelledby="dashboard-preview-title"
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
        <div>
          <p className="text-sm font-semibold tracking-[0.24em] text-muted-foreground">DATA PEMERINTAH</p>
          <h2
            id="dashboard-preview-title"
            className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Akses Data, Pahami Kondisi, Lihat Perkembangannya
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Jelajahi berbagai dataset pemerintah, mulai dari anggaran, proyek infrastruktur, hingga
            statistik daerah dalam tampilan yang interaktif dan mudah dipahami.
          </p>

          <div className="mt-8">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href="/data">
                Jelajahi Semua Data
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <div
            className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4"
            aria-label="Statistik platform Agoraya"
          >
            {PLATFORM_STATS.map(({ value, label, Icon }) => (
              <div key={label} className="flex flex-col gap-1">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <SourceBadge source="SIMULATED" />
          </div>
        </div>

        <DashboardMockup />
      </div>
    </section>
  );
}

export { DashboardMockup, DashboardPreview };
