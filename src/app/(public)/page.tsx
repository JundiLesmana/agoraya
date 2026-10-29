import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BarChart3, FileText, Megaphone, Sparkles } from 'lucide-react';
import { PublicHeroSearch } from './_components/public-hero-search';
import { DashboardPreview } from './_components/dashboard-preview';
import { ReportTrackingSection } from './_components/report-tracking-section';
import { RecentReportsSection } from './_components/recent-reports-section';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Beranda | Agoraya — Transparansi Data Publik untuk Indonesia',
  description:
    'Agoraya: satu platform untuk mengakses data pemerintah, memantau layanan publik, melaporkan masalah, dan mendapatkan insight berbasis data. Transparan, Terbuka, Untuk Indonesia yang Lebih Baik.',
  keywords: ['data pemerintah', 'transparansi', 'layanan publik', 'lapor warga', 'insight', 'APBD', 'Indonesia'],
  openGraph: {
    title: 'Agoraya — Transparan, Terbuka, Untuk Indonesia yang Lebih Baik',
    description: 'Satu platform untuk mengakses data pemerintah, memantau layanan publik, melaporkan masalah, dan mendapatkan insight berbasis data.',
    url: 'https://agoraya.vercel.app',
    siteName: 'Agoraya',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agoraya — Transparansi Data Publik untuk Indonesia',
    description: 'Satu platform untuk mengakses data pemerintah, memantau layanan publik, melaporkan masalah, dan mendapatkan insight berbasis data.',
  },
};

const SERVICE_CARDS = [
  {
    title: 'Data Pemerintah',
    description: 'Akses data pemerintah secara real-time, seperti anggaran, realisasi proyek, dan statistik daerah, dalam bentuk dashboard interaktif dan visualisasi yang mudah dipahami.',
    href: '/data',
    cta: 'Lihat Data',
    accent: 'blue',
    Icon: BarChart3,
  },
  {
    title: 'Layanan Publik',
    description: 'Pantau status dan progres layanan publik seperti pengaduan warga, perizinan, atau bantuan sosial dengan sistem tracking yang transparan dari sisi pengguna maupun instansi.',
    href: '/citizen/dashboard',
    cta: 'Cek Layanan',
    accent: 'green',
    Icon: FileText,
  },
  {
    title: 'Laporan Warga',
    description:
      'Laporkan masalah di sekitar Anda (seperti infrastruktur rusak, dugaan penyimpangan, atau isu lingkungan) yang terintegrasi dengan sistem verifikasi dan tindak lanjut, guna mendorong partisipasi warga.',
    href: '/tracking',
    cta: 'Laporkan Sekarang',
    accent: 'orange',
    Icon: Megaphone,
  },
  {
    title: 'Insight',
    description:
      'Ubah data publik menjadi insight yang mudah dicerna, seperti perbandingan kualitas layanan antar daerah, tren anggaran, atau indikator kesejahteraan untuk membantu pengambilan keputusan.',
    href: '/insight',
    cta: 'Jelajahi Insight',
    accent: 'violet',
    Icon: Sparkles,
  },
] as const;

function cardAccentClasses(accent: string) {
  switch (accent) {
    case 'blue':
      return 'border-blue-100 bg-blue-50/80 text-blue-600 group-hover:shadow-blue-200/50 dark:border-blue-900/70 dark:bg-blue-950/50 dark:text-blue-300 dark:group-hover:shadow-blue-950/40';
    case 'green':
      return 'border-emerald-100 bg-emerald-50/80 text-emerald-600 group-hover:shadow-emerald-200/50 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-300 dark:group-hover:shadow-emerald-950/40';
    case 'orange':
      return 'border-orange-100 bg-orange-50/80 text-orange-600 group-hover:shadow-orange-200/50 dark:border-orange-900/70 dark:bg-orange-950/50 dark:text-orange-300 dark:group-hover:shadow-orange-950/40';
    case 'violet':
      return 'border-violet-100 bg-violet-50/80 text-violet-600 group-hover:shadow-violet-200/50 dark:border-violet-900/70 dark:bg-violet-950/50 dark:text-violet-300 dark:group-hover:shadow-violet-950/40';
    default:
      return 'border-slate-100 bg-slate-50/80 text-slate-600';
  }
}

function ReportingCta() {
  return (
    <section
      aria-labelledby="reporting-cta-title"
      className="border-primary/10 from-primary/10 dark:from-primary/20 rounded-3xl border bg-gradient-to-br via-blue-50 to-sky-100 px-6 py-10 sm:px-10 sm:py-12 dark:via-blue-950/50 dark:to-slate-900"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-primary text-xs font-semibold tracking-[0.24em] uppercase">PERLU DIKETAHUI</p>
        <h2 id="reporting-cta-title" className="text-foreground mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Melapor dengan lebih tenang
        </h2>
        <p className="text-muted-foreground mt-3 text-sm leading-6 sm:text-base">Pahami progres laporan Anda dari awal hingga akhir</p>
        <p className="text-muted-foreground mt-3 text-sm">Identitas Anda tidak ditampilkan jika memilih laporan anonim. Pilihan privasi akan dijelaskan saat mengisi formulir.</p>
        <Button asChild size="lg" className="mt-6" aria-label="Buat laporan baru">
          <Link href="/tracking">
            Buat laporan baru
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function HomeCtaBanner() {
  return (
    <section
      aria-labelledby="home-cta-title"
      className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 lg:pb-12"
    >
      <div className="relative isolate aspect-[350/180] overflow-hidden rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/10 sm:aspect-[1320/300] sm:rounded-3xl">
        <picture className="absolute inset-0 -z-10 block">
          <source
            media="(max-width: 639px)"
            srcSet="/landing/footer-mobile.png"
          />
          <Image
            src="/landing/footer-desktop.png"
            alt=""
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover"
          />
        </picture>
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-[5] bg-gradient-to-r from-slate-950/80 via-slate-950/45 to-transparent"
        />
        <div className="absolute inset-y-0 left-0 flex w-[68%] flex-col items-start justify-center gap-0.5 px-2 py-1 sm:w-auto sm:max-w-[54%] sm:gap-3 sm:px-8 sm:py-0 lg:px-12">
          <p className="text-[0.55rem] font-semibold tracking-[0.14em] text-sky-200 sm:text-xs sm:tracking-[0.2em]">
            PARTISIPASI ANDA BERARTI
          </p>
          <h2
            id="home-cta-title"
            className="text-xs leading-[1.05] font-semibold tracking-tight sm:text-2xl sm:leading-tight lg:text-3xl"
          >
            Data Transparan, Layanan Lebih Baik, Masa Depan Lebih Cerah
          </h2>
          <p className="max-w-sm text-xs leading-[1.15] text-slate-200 sm:hidden">
            Gunakan data dan laporkan masalah untuk perubahan yang lebih baik.
          </p>
          <p className="hidden max-w-sm text-xs leading-[1.15] text-slate-200 sm:block sm:text-sm sm:leading-6">
            Jadilah bagian dari masyarakat yang aktif, kritis, dan peduli.
            Gunakan data, pantau layanan, laporkan masalah, dan bantu wujudkan
            pemerintahan yang lebih baik.
          </p>
          <Button
            asChild
            className="h-8 bg-white px-3 text-xs text-blue-800 hover:bg-slate-100 focus-visible:ring-white sm:h-10 sm:px-4 sm:text-sm"
          >
            <Link href="/tracking">
              Mulai Sekarang
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function PublicLandingPage() {
  return (
    <div className="bg-background overflow-hidden">
      <section aria-labelledby="hero-title" className="relative isolate overflow-hidden lg:min-h-[480px] xl:min-h-[500px]">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(246,250,255,0.98)_0%,rgba(226,237,252,0.94)_52%,rgba(207,225,250,0.82)_100%)] dark:bg-[linear-gradient(135deg,rgba(9,15,25,0.98)_0%,rgba(16,31,50,0.94)_52%,rgba(19,43,67,0.88)_100%)]" />
        <div className="relative z-10 mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:flex lg:min-h-[480px] lg:items-center lg:px-8 lg:py-10 xl:min-h-[500px]">
          <div className="max-w-2xl lg:max-w-[680px]">
            <h1
              id="hero-title"
              className="text-foreground max-w-3xl text-[clamp(1.25rem,7vw,2.25rem)] leading-[1.12] font-semibold tracking-tight sm:text-4xl sm:leading-tight lg:max-w-[680px] lg:text-5xl lg:leading-[1.08]"
            >
              Transparan, Terbuka, Untuk <span className="text-blue-700 dark:text-sky-300">Indonesia</span> yang Lebih Baik
            </h1>
            <p className="text-muted-foreground mt-3 max-w-2xl text-xs leading-4 sm:mt-4 sm:text-base sm:leading-7 lg:text-[15px] lg:leading-6">
              Satu platform untuk mengakses data pemerintah, memantau layanan publik, melaporkan masalah, dan mendapatkan insight berbasis data. Karena partisipasi Anda, mendorong pemerintahan yang
              lebih transparan, akuntabel, dan responsif.
            </p>
            <div className="mt-4 max-w-3xl sm:mt-6">
              <PublicHeroSearch />
            </div>
          </div>
        </div>
        <div className="relative z-0 aspect-[390/230] w-full lg:absolute lg:inset-0 lg:aspect-auto">
          <picture className="absolute inset-0 block">
            <source media="(max-width: 1023px)" srcSet="/landing/hero-mobile.png" />
            <Image src="/landing/hero-desktop.png" alt="" fill priority sizes="100vw" className="object-cover object-right" />
          </picture>
          <div
            className="pointer-events-none absolute inset-0 z-[1] dark:bg-[linear-gradient(90deg,rgba(9,15,25,0.96)_0%,rgba(9,15,25,0.88)_48%,rgba(9,15,25,0.08)_78%,transparent_100%)]"
            aria-hidden="true"
          />
        </div>
        <p className="sr-only">Data yang terbuka adalah langkah awal untuk perubahan nyata</p>
      </section>

      <section aria-labelledby="ecosystem-title" className="mx-auto max-w-7xl px-4 pt-20 pb-8 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-muted-foreground text-sm font-semibold tracking-[0.24em]">EKOSISTEM LAYANAN</p>
          <h2 id="ecosystem-title" className="text-foreground mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Solusi Lengkap untuk Transparansi dan Partisipasi Publik
          </h2>
          <p className="text-muted-foreground mt-3 text-base leading-7">Dari data hingga aksi nyata, semua dalam satu ekosistem terintegrasi.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {SERVICE_CARDS.map(({ title, description, href, cta, accent, Icon }) => (
            <article
              key={title}
              className="group border-border bg-card flex h-full flex-col overflow-hidden rounded-3xl border shadow-sm transition-all duration-300 focus-within:-translate-y-1 focus-within:shadow-2xl hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className={cn('flex flex-1 flex-col p-6', cardAccentClasses(accent))}>
                <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/90 shadow-sm ring-1 ring-white/10 ring-inset dark:bg-slate-900/80 dark:ring-white/10">
                  <Icon className="size-6" aria-hidden="true" />
                </div>
                <h3 className="text-foreground mt-4 text-2xl font-semibold">{title}</h3>
                <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-7">{description}</p>
                <div className="mt-5">
                  <Link
                    href={href}
                    className="focus-visible:ring-primary inline-flex items-center gap-2 text-sm font-semibold transition hover:gap-3 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {cta}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <DashboardPreview />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ReportingCta />
      </div>

      <RecentReportsSection />

      <ReportTrackingSection />

      <HomeCtaBanner />
    </div>
  );
}
