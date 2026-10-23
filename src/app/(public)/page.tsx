import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BarChart3, FileText, Megaphone, Sparkles } from 'lucide-react';
import { PublicHeroSearch } from './_components/public-hero-search';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Beranda | Agoraya',
  description: 'Platform transparansi, pelaporan publik, dan tata kelola pemerintahan digital untuk Indonesia.',
};

const SERVICE_CARDS = [
  { title: 'Data Pemerintah', description: 'Akses data pemerintah secara real-time, seperti anggaran, realisasi proyek, dan statistik daerah, dalam bentuk dashboard interaktif dan visualisasi yang mudah dipahami.', href: '/data', cta: 'Lihat Data', accent: 'blue', Icon: BarChart3 },
  { title: 'Layanan Publik', description: 'Pantau status dan progres layanan publik seperti pengaduan warga, perizinan, atau bantuan sosial dengan sistem tracking yang transparan dari sisi pengguna maupun instansi.', href: '/citizen/dashboard', cta: 'Cek Layanan', accent: 'green', Icon: FileText },
  { title: 'Laporan Warga', description: 'Laporkan masalah di sekitar Anda (seperti infrastruktur rusak, dugaan penyimpangan, atau isu lingkungan) yang terintegrasi dengan sistem verifikasi dan tindak lanjut, guna mendorong partisipasi warga.', href: '/citizen/reporting', cta: 'Laporkan Sekarang', accent: 'orange', Icon: Megaphone },
  { title: 'Insight', description: 'Ubah data publik menjadi insight yang mudah dicerna, seperti perbandingan kualitas layanan antar daerah, tren anggaran, atau indikator kesejahteraan untuk membantu pengambilan keputusan.', href: '/insights', cta: 'Jelajahi Insight', accent: 'violet', Icon: Sparkles },
] as const;

function cardAccentClasses(accent: string) {
  switch (accent) {
    case 'blue': return 'border-blue-100 bg-blue-50/80 text-blue-600 group-hover:shadow-blue-200/50';
    case 'green': return 'border-emerald-100 bg-emerald-50/80 text-emerald-600 group-hover:shadow-emerald-200/50';
    case 'orange': return 'border-orange-100 bg-orange-50/80 text-orange-600 group-hover:shadow-orange-200/50';
    case 'violet': return 'border-violet-100 bg-violet-50/80 text-violet-600 group-hover:shadow-violet-200/50';
    default: return 'border-slate-100 bg-slate-50/80 text-slate-600';
  }
}

function CtaBanner() {
  return (
    <section
      aria-labelledby="cta-banner-title"
      className="relative isolate overflow-hidden rounded-[2rem] bg-slate-950 px-5 py-8 text-white shadow-[0_24px_90px_-36px_rgba(15,23,42,0.8)] sm:px-8 sm:py-10 lg:px-10 lg:py-12"
    >
      <div className="absolute inset-0 -z-10">
        <Image
          src="/cta-banner-city.jpg"
          alt="Silhouette kota pada senja di balik warga yang melihat informasi publik"
          fill
          sizes="(max-width: 1024px) 100vw, 1280px"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.96)_0%,rgba(15,23,42,0.9)_34%,rgba(15,23,42,0.62)_62%,rgba(15,23,42,0.78)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_24%,rgba(255,255,255,0.08),transparent_28%)]" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)] lg:items-end">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/70">PARTISIPASI ANDA BERARTI</p>
          <h2 id="cta-banner-title" className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Data Transparan, Layanan Lebih Baik, Masa Depan Lebih Cerah
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/82 sm:text-base sm:leading-8">
            Jadilah bagian dari masyarakat yang aktif, kritis, dan peduli. Gunakan data, pantau layanan, laporkan
            masalah, dan bantu wujudkan pemerintahan yang lebih baik.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:max-w-sm">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-full bg-white px-6 text-base font-semibold text-slate-950 shadow-lg shadow-slate-950/20 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-xl hover:shadow-slate-950/30 focus-visible:ring-white/80"
            >
              <Link href="/register">
                Mulai Sekarang
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <p className="text-xs leading-6 text-white/65 sm:text-sm">
              Tidak perlu form tambahan di sini — cukup klik untuk masuk ke halaman pendaftaran.
            </p>
          </div>
        </div>

        <div className="flex justify-start lg:justify-end">
          <div className="max-w-xs rounded-[1.5rem] border border-white/10 bg-white/8 p-5 shadow-2xl shadow-black/30 backdrop-blur-sm sm:max-w-sm">
            <p className="font-[cursive] text-3xl leading-tight text-white/95 sm:text-4xl">
              Bersama kita bisa
              <br />
              membuat perubahan
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PublicLandingPage() {
  return (
    <main className="overflow-hidden bg-slate-50">
      <section className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(246,250,255,0.98)_0%,rgba(226,237,252,0.94)_52%,rgba(207,225,250,0.82)_100%)]" />
        <div className="absolute inset-0 -z-10">
          <Image src="/logo-agoraya.svg" alt="Monumen Nasional dan langit Jakarta" fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover object-right md:object-[78%_center] lg:object-right" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.96),rgba(255,255,255,0.36)_38%,rgba(255,255,255,0)_68%)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/72 to-slate-50/10" />
        </div>

        <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-primary/15 bg-white/80 px-4 py-2 text-sm font-medium text-primary shadow-sm backdrop-blur">Transparansi publik untuk semua warga</p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">Transparan, Terbuka, Untuk Indonesia yang Lebih Baik</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">Satu pintu untuk mencari data, layanan, dan informasi publik agar warga bisa memahami, mengawasi, dan berpartisipasi lebih cepat.</p>
            <div className="mt-10 max-w-3xl"><PublicHeroSearch /></div>
          </div>
          <div className="relative flex min-h-[28rem] items-end justify-end lg:min-h-[36rem]"><div className="absolute right-0 top-0 max-w-xs rounded-[2rem] border border-primary/10 bg-white/70 px-6 py-5 text-right shadow-xl backdrop-blur-md sm:top-8 sm:max-w-sm lg:right-8 lg:top-14"><p className="font-[cursive] text-3xl leading-tight text-primary/90 sm:text-4xl">Data yang terbuka<br />adalah langkah awal<br />untuk perubahan nyata</p></div><div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent" /></div>
        </div>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.24em] text-slate-500">EKOSISTEM LAYANAN</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Solusi Lengkap untuk Transparansi dan Partisipasi Publik</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">Pilih pilar yang paling relevan untuk kebutuhan Anda — mulai dari data, layanan, laporan warga, hingga insight kebijakan.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {SERVICE_CARDS.map(({ title, description, href, cta, accent, Icon }) => (
              <article key={title} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/85 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl focus-within:-translate-y-1 focus-within:shadow-2xl">
                <div className={cn('flex flex-1 flex-col p-6', cardAccentClasses(accent))}>
                  <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/90 shadow-sm ring-1 ring-inset ring-white/10"><Icon className="size-6" aria-hidden="true" /></div>
                  <h3 className="mt-4 text-2xl font-semibold text-slate-900">{title}</h3>
                  <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600">{description}</p>
                  <div className="mt-5"><Link href={href} className="inline-flex items-center gap-2 text-sm font-semibold transition hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">{cta}<ArrowRight className="size-4" aria-hidden="true" /></Link></div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10">
            <CtaBanner />
          </div>
        </section>
      </section>
    </main>
  );
}
