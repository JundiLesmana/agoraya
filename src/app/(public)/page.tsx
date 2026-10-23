import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PublicHeroSearch } from './_components/public-hero-search';

export const metadata: Metadata = {
  title: 'Beranda | Agoraya',
  description: 'Platform transparansi, pelaporan publik, dan tata kelola pemerintahan digital untuk Indonesia.',
};

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

            <div className="mt-6">
              <p className="text-sm font-medium text-slate-500">Pencarian populer:</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {['APBD', 'Proyek Infrastruktur', 'Pendidikan', 'Kesehatan', 'Bantuan Sosial'].map((tag) => (
                  <Link
                    key={tag}
                    href={`/data?query=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
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
