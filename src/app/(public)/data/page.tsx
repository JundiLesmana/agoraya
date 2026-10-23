import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SourceBadge } from '@/components/source-badges/source-badge';

const DASHBOARD_STATS = [
  { value: '+10.000', label: 'Dataset', description: 'Dataset nasional dan sektoral', source: 'SIMULATED' as const },
  { value: '34', label: 'Provinsi', description: 'Cakupan wilayah Indonesia', source: 'SIMULATED' as const },
  { value: '514', label: 'Kabupaten/Kota', description: 'Unit administratif terpantau', source: 'SIMULATED' as const },
  { value: '100%', label: 'Terbuka', description: 'Akses data publik transparan', source: 'SIMULATED' as const },
] as const;

function DashboardMockup() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-30px_rgba(15,23,42,0.35)]">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Dashboard Publik</p>
            <p className="mt-1 text-sm text-slate-600">Ringkasan fiskal dan visualisasi indikator nasional</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
            <span>Periode</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-900">2025</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-emerald-100 bg-emerald-50/70 shadow-none">
            <CardHeader className="space-y-2 px-4 pb-2 pt-4">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                <BarChart3 className="size-5 text-emerald-600" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm text-slate-600">Total Anggaran</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-3xl font-semibold tracking-tight text-slate-900">Rp 342,7T</p>
              <p className="mt-1 text-sm text-slate-600">Alokasi nasional lintas sektor</p>
            </CardContent>
          </Card>

          <Card className="border-indigo-100 bg-indigo-50/70 shadow-none">
            <CardHeader className="space-y-2 px-4 pb-2 pt-4">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                <ArrowRight className="size-5 text-indigo-600" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm text-slate-600">Realisasi</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-3xl font-semibold tracking-tight text-slate-900">Rp 284,1T</p>
              <p className="mt-1 text-sm text-slate-600">Terkonfirmasi pada laporan terakhir</p>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 shadow-none">
            <CardHeader className="px-4 pb-3 pt-4">
              <CardTitle className="text-base text-slate-900">Realisasi Anggaran per Sektor</CardTitle>
              <CardDescription>Komposisi alokasi anggaran dalam diagram pie</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid gap-4 lg:grid-cols-[170px_1fr] lg:items-center">
                <div className="mx-auto flex size-[170px] items-center justify-center rounded-full bg-[conic-gradient(#4f46e5_0_28%,#06b6d4_28%_47%,#22c55e_47%_65%,#f59e0b_65%_82%,#cbd5e1_82%_100%)] p-4">
                  <div className="flex size-[104px] flex-col items-center justify-center rounded-full bg-white text-center shadow-sm">
                    <PieChartIcon className="size-5 text-slate-500" aria-hidden="true" />
                    <span className="mt-1 text-lg font-semibold text-slate-900">100%</span>
                    <span className="text-xs text-slate-500">Distribusi</span>
                  </div>
                </div>
                <ul className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <li className="flex items-center gap-3">
                    <span className="size-3 rounded-full bg-indigo-600" /> Infrastruktur <span className="ml-auto font-medium text-slate-900">28%</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="size-3 rounded-full bg-cyan-500" /> Pendidikan <span className="ml-auto font-medium text-slate-900">19%</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="size-3 rounded-full bg-emerald-500" /> Kesehatan <span className="ml-auto font-medium text-slate-900">18%</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="size-3 rounded-full bg-amber-500" /> Perlindungan Sosial <span className="ml-auto font-medium text-slate-900">17%</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 shadow-none">
            <CardHeader className="px-4 pb-3 pt-4">
              <CardTitle className="text-base text-slate-900">Tren Realisasi Anggaran</CardTitle>
              <CardDescription>Garis tren menampilkan pertumbuhan realisasi bulanan</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="h-40 rounded-2xl bg-slate-50 px-4 py-5">
                <svg viewBox="0 0 560 160" className="h-full w-full" role="img" aria-label="Line chart realisasi anggaran bulanan">
                  <line x1="24" y1="132" x2="536" y2="132" stroke="#cbd5e1" strokeWidth="2" />
                  <path d="M24 122L84 118L144 108L204 101L264 92L324 84L384 76L444 62L504 54L536 46" fill="none" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M24 126L84 124L144 117L204 113L264 106L324 100L384 95L444 84L504 78L536 71V132H24Z" fill="rgba(59,130,246,0.14)" />
                  <path d="M24 110L84 106L144 98L204 91L264 82L324 76L384 68L444 57L504 49L536 42" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-center rounded-[1.75rem] border border-slate-200 bg-slate-950 px-4 py-5 shadow-inner">
          <div className="w-full max-w-[260px] rounded-[1.5rem] bg-slate-900 p-3 text-white shadow-2xl">
            <div className="flex items-center justify-between rounded-2xl bg-slate-800 px-3 py-2 text-xs text-slate-300">
              <span>Dashboard Publik</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-300">Live preview</span>
            </div>
            <div className="mt-3 rounded-[1.25rem] bg-white p-3 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
              <div className="grid gap-3">
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-700">Total Anggaran</p>
                  <p className="mt-1 text-xl font-semibold">Rp 342,7T</p>
                </div>
                <div className="rounded-2xl bg-indigo-50 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-indigo-700">Realisasi</p>
                  <p className="mt-1 text-xl font-semibold">Rp 284,1T</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <PieChartIcon className="size-5 text-slate-500" aria-hidden="true" />
                    <div className="mt-2 h-16 rounded-full bg-[conic-gradient(#4f46e5_0_30%,#06b6d4_30%_50%,#22c55e_50%_70%,#f59e0b_70%_100%)] p-2">
                      <div className="size-full rounded-full bg-white" />
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <LineChartIcon className="size-5 text-slate-500" aria-hidden="true" />
                    <div className="mt-2 h-16 rounded-xl bg-white p-2">
                      <svg viewBox="0 0 120 48" className="h-full w-full" aria-hidden="true">
                        <path d="M0 42L16 38L32 34L48 30L64 26L80 18L96 14L120 8" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicDataPage() {
  return (
    <main className="bg-slate-50 py-16 sm:py-20">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] lg:gap-12">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Data Pemerintah</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Akses Data, Pahami Kondisi, Lihat Bukti Nyata
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
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
              <SourceBadge source="SIMULATED" label="Preview mockup" />
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {DASHBOARD_STATS.map((stat) => (
                <Card key={stat.label} className="border-slate-200 bg-white shadow-sm">
                  <CardHeader className="space-y-2 px-4 pb-2 pt-4">
                    <CardDescription className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      {stat.label}
                    </CardDescription>
                    <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900">{stat.value}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-3 px-4 pb-4">
                    <p className="max-w-[11rem] text-sm leading-6 text-slate-600">{stat.description}</p>
                    <SourceBadge source={stat.source} label={stat.source === 'SIMULATED' ? 'SIMULATED' : stat.source} withIcon={false} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="order-last lg:order-none">
            <Image
              src="/dashboard-public-preview.png"
              alt="Mockup dashboard publik menampilkan total anggaran dan realisasi"
              width={1280}
              height={900}
              sizes="(max-width: 1024px) 100vw, 56vw"
              className="h-auto w-full rounded-[2rem] border border-slate-200 bg-white shadow-2xl"
            />
          </div>
        </div>

        <div className="mt-6 hidden lg:block">
          <DashboardMockup />
        </div>
      </section>
    </main>
  );
}
