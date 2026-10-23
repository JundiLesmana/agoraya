import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BarChart3, FileText, Megaphone, Sparkles } from 'lucide-react';
import { PublicHeroSearch } from './_components/public-hero-search';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Beranda | Agoraya',
  description: 'Platform transparansi, pelaporan publik, dan tata kelola pemerintahan digital untuk Indonesia.',
};

const SERVICE_CARDS = [
  {
    title: 'Data Pemerintah',
    description:
      'Akses data pemerintah secara real-time, seperti anggaran, realisasi proyek, dan statistik daerah, dalam bentuk dashboard interaktif dan visualisasi yang mudah dipahami.',
    href: '/data',
    cta: 'Lihat Data',
    accent: 'blue',
    Icon: BarChart3,
    mockup: (
      <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
        <rect width="320" height="180" rx="20" fill="#EFF6FF" />
        <rect x="18" y="18" width="284" height="144" rx="16" fill="#FFFFFF" stroke="#DBEAFE" />
        <rect x="34" y="34" width="52" height="6" rx="3" fill="#60A5FA" />
        <circle cx="276" cy="38" r="10" fill="#DBEAFE" />
        <rect x="36" y="56" width="118" height="72" rx="10" fill="#F8FAFC" />
        <path d="M46 106L60 92L74 98L88 72L102 84L116 66L130 74" fill="none" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="170" y="56" width="108" height="72" rx="10" fill="#F8FAFC" />
        <rect x="182" y="90" width="14" height="26" rx="4" fill="#93C5FD" />
        <rect x="202" y="80" width="14" height="36" rx="4" fill="#60A5FA" />
        <rect x="222" y="72" width="14" height="44" rx="4" fill="#2563EB" />
        <rect x="242" y="86" width="14" height="30" rx="4" fill="#BFDBFE" />
        <rect x="46" y="138" width="88" height="7" rx="3.5" fill="#BFDBFE" />
        <rect x="46" y="150" width="72" height="6" rx="3" fill="#DBEAFE" />
      </svg>
    ),
  },
  {
    title: 'Layanan Publik',
    description:
      'Pantau status dan progres layanan publik seperti pengaduan warga, perizinan, atau bantuan sosial dengan sistem tracking yang transparan dari sisi pengguna maupun instansi.',
    href: '/citizen/dashboard',
    cta: 'Cek Layanan',
    accent: 'green',
    Icon: FileText,
    mockup: (
      <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
        <rect width="320" height="180" rx="20" fill="#F0FDF4" />
        <rect x="18" y="18" width="284" height="144" rx="16" fill="#FFFFFF" stroke="#DCFCE7" />
        <rect x="34" y="34" width="88" height="10" rx="5" fill="#34D399" />
        <rect x="34" y="56" width="150" height="10" rx="5" fill="#D1FAE5" />
        <rect x="34" y="76" width="130" height="10" rx="5" fill="#D1FAE5" />
        <rect x="34" y="96" width="166" height="10" rx="5" fill="#D1FAE5" />
        <circle cx="252" cy="72" r="24" fill="#DCFCE7" />
        <path d="M242 72l7 7 15-18" fill="none" stroke="#16A34A" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="34" y="124" width="110" height="18" rx="9" fill="#DCFCE7" />
      </svg>
    ),
  },
  {
    title: 'Laporan Warga',
    description:
      'Laporkan masalah di sekitar Anda (seperti infrastruktur rusak, dugaan penyimpangan, atau isu lingkungan) yang terintegrasi dengan sistem verifikasi dan tindak lanjut, guna mendorong partisipasi warga.',
    href: '/citizen/reporting',
    cta: 'Laporkan Sekarang',
    accent: 'orange',
    Icon: Megaphone,
    mockup: (
      <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
        <rect width="320" height="180" rx="20" fill="#FFF7ED" />
        <rect x="18" y="18" width="284" height="144" rx="16" fill="#FFFFFF" stroke="#FED7AA" />
        <path d="M34 128L78 90L112 102L146 72L182 92L214 78L266 48" fill="none" stroke="#F97316" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="78" cy="90" r="8" fill="#FB923C" />
        <circle cx="146" cy="72" r="8" fill="#FB923C" />
        <circle cx="266" cy="48" r="8" fill="#FB923C" />
        <rect x="188" y="104" width="82" height="34" rx="10" fill="#FFEDD5" />
        <rect x="36" y="26" width="94" height="10" rx="5" fill="#FDBA74" />
      </svg>
    ),
  },
  {
    title: 'Insight',
    description:
      'Ubah data publik menjadi insight yang mudah dicerna, seperti perbandingan kualitas layanan antar daerah, tren anggaran, atau indikator kesejahteraan untuk membantu pengambilan keputusan.',
    href: '/insights',
    cta: 'Jelajahi Insight',
    accent: 'violet',
    Icon: Sparkles,
    mockup: (
      <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
        <rect width="320" height="180" rx="20" fill="#F5F3FF" />
        <rect x="18" y="18" width="284" height="144" rx="16" fill="#FFFFFF" stroke="#E9D5FF" />
        <rect x="34" y="36" width="118" height="10" rx="5" fill="#A78BFA" />
        <rect x="34" y="58" width="252" height="80" rx="12" fill="#FAFAFF" />
        <path d="M54 126V92M78 126V78M102 126V86M126 126V70M150 126V96M174 126V64" stroke="#8B5CF6" strokeWidth="10" strokeLinecap="round" />
        <path d="M54 112C80 98 96 104 118 90C140 76 156 88 182 74C208 60 226 66 248 56" fill="none" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

function cardAccentClasses(accent: string) {
  switch (accent) {
    case 'blue':
      return 'border-blue-100 bg-blue-50/80 text-blue-600 group-hover:shadow-blue-200/50';
    case 'green':
      return 'border-emerald-100 bg-emerald-50/80 text-emerald-600 group-hover:shadow-emerald-200/50';
    case 'orange':
      return 'border-orange-100 bg-orange-50/80 text-orange-600 group-hover:shadow-orange-200/50';
    case 'violet':
      return 'border-violet-100 bg-violet-50/80 text-violet-600 group-hover:shadow-violet-200/50';
    default:
      return 'border-slate-100 bg-slate-50/80 text-slate-600';
  }
}

export default function PublicLandingPage() {
  return (
    <main className="overflow-hidden bg-slate-50">
      <section className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(246,250,255,0.98)_0%,rgba(226,237,252,0.94)_52%,rgba(207,225,250,0.82)_100%)]" />
        <div className="absolute inset-0 -z-10">
          <Image
            src="/logo-agoraya.svg"
            alt="Monumen Nasional dan langit Jakarta"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-right md:object-[78%_center] lg:object-right"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.96),rgba(255,255,255,0.36)_38%,rgba(255,255,255,0)_68%)]" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-slate-50/72 to-slate-50/10" />
        </div>

        <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-primary/15 bg-white/80 px-4 py-2 text-sm font-medium text-primary shadow-sm backdrop-blur">
              Transparansi publik untuk semua warga
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Transparan, Terbuka, Untuk Indonesia yang Lebih Baik
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Satu pintu untuk mencari data, layanan, dan informasi publik agar warga bisa memahami, mengawasi,
              dan berpartisipasi lebih cepat.
            </p>

            <div className="mt-10 max-w-3xl">
              <PublicHeroSearch />
            </div>
          </div>

          <div className="relative flex min-h-[28rem] items-end justify-end lg:min-h-[36rem]">
            <div className="absolute right-0 top-0 max-w-xs rounded-[2rem] border border-primary/10 bg-white/70 px-6 py-5 text-right shadow-xl backdrop-blur-md sm:top-8 sm:max-w-sm lg:right-8 lg:top-14">
              <p className="font-[cursive] text-3xl leading-tight text-primary/90 sm:text-4xl">
                Data yang terbuka
                <br />
                adalah langkah awal
                <br />
                untuk perubahan nyata
              </p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent" />
          </div>
        </div>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.24em] text-slate-500">EKOSISTEM LAYANAN</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Solusi Lengkap untuk Transparansi dan Partisipasi Publik
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Pilih pilar yang paling relevan untuk kebutuhan Anda — mulai dari data, layanan, laporan warga,
              hingga insight kebijakan.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {SERVICE_CARDS.map(({ title, description, href, cta, accent, Icon, mockup }) => (
              <article
                key={title}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/85 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl focus-within:-translate-y-1 focus-within:shadow-2xl"
              >
                <div className={cn('flex flex-1 flex-col p-6', cardAccentClasses(accent))}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div
                        className={cn(
                          'inline-flex size-12 items-center justify-center rounded-2xl bg-white/90 shadow-sm ring-1 ring-inset',
                          accent === 'blue'
                            ? 'ring-blue-100'
                            : accent === 'green'
                              ? 'ring-emerald-100'
                              : accent === 'orange'
                                ? 'ring-orange-100'
                                : 'ring-violet-100',
                        )}
                      >
                        <Icon className="size-6" aria-hidden="true" />
                      </div>
                      <h3 className="mt-4 text-2xl font-semibold text-slate-900">{title}</h3>
                    </div>
                  </div>

                  <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600">{description}</p>

                  <div className="mt-5">
                    <Link
                      href={href}
                      className="inline-flex items-center gap-2 text-sm font-semibold transition hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {cta}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>

                  <div className="mt-6 rounded-2xl bg-white/70 p-3 shadow-inner ring-1 ring-white/70">
                    <div className="aspect-[16/9] overflow-hidden rounded-xl">{mockup}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <svg
          aria-hidden="true"
          viewBox="0 0 1440 120"
          className="pointer-events-none absolute bottom-0 left-0 h-16 w-full text-slate-50"
          preserveAspectRatio="none"
        >
          <path fill="currentColor" d="M0,64L80,74.7C160,85,320,107,480,106.7C640,107,800,85,960,80C1120,75,1280,85,1360,90.7L1440,96V120H1360C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120H0Z" />
        </svg>
      </section>
    </main>
  );
}
