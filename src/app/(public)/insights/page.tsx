import type { Metadata } from 'next';
import Link from 'next/link';
import { Info } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Insight Publik | Agoraya',
  description:
    'Pahami data pemerintah melalui interpretasi analitis. Bandingkan layanan daerah, telusuri anggaran, dan pahami kesejahteraan untuk keputusan yang lebih terarah.',
};

const BREADCRUMB_ITEMS = [
  { label: 'Beranda', href: '/', current: false },
  { label: 'Insight', href: undefined, current: true },
] as const;

export default function InsightPage() {
  return (
    <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-10 text-xs text-muted-foreground"
      >
        <ol className="flex flex-wrap items-center gap-1">
          {BREADCRUMB_ITEMS.flatMap((item, index) => [
            index > 0 ? (
              <li
                key={`breadcrumb-separator-${index}`}
                aria-hidden="true"
                className="select-none"
              >
                &rsaquo;
              </li>
            ) : null,
            item.current ? (
              <li
                key={`breadcrumb-item-${index}`}
                aria-current="page"
                className="text-primary font-medium"
              >
                {item.label}
              </li>
            ) : (
              <li key={`breadcrumb-item-${index}`}>
                <Link href={item.href as string}>{item.label}</Link>
              </li>
            ),
          ])}
        </ol>
      </nav>

      {/* Hero section */}
      <section className="max-w-3xl">
        <span className="inline-block mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
          INSIGHT PUBLIK
        </span>
        <h1 className="mt-0 mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Pahami datanya. Lihat maknanya.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Bandingkan layanan daerah, telusuri anggaran, dan pahami
          kesejahteraan. Insight sederhana untuk keputusan yang lebih terarah.
        </p>

        {/* Informasi banner */}
        <div className="mt-10 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 size-5 text-primary flex-shrink-0" aria-hidden="true" />
            <p className="text-sm text-muted-foreground leading-6">
              Seluruh angka, temuan, dan sumber di lamaran ini adalah data
              contoh untuk ilustrasi, bukan data resmi aktual.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
