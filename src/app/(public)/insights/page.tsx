import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { InsightDashboard } from './_components/insight-dashboard';
import {
  SekilasCards,
  SekilasSkeleton,
} from './_components/sekilas-cards';
import { TimelyServiceComparison } from './_components/timely-service-comparison';
import { WellbeingIndicators } from './_components/wellbeing-indicators';

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
      </section>

      {/* Sekilas: 3 kartu KPI perubahan kunci */}
      <Suspense fallback={<SekilasSkeleton />}>
        <SekilasCards />
      </Suspense>

      <div className="mt-6">
        <TimelyServiceComparison />
      </div>

      <div className="mt-6">
        <WellbeingIndicators />
      </div>

      <Suspense
        fallback={
          <div className="h-40 animate-pulse rounded-xl border border-border bg-muted/40" />
        }
      >
        <InsightDashboard />
      </Suspense>
    </main>
  );
}
