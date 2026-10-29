import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { InsightDashboard } from "./_components/insight-dashboard";
import { InsightMethodology } from "./_components/insight-methodology";
import { InsightReadingGuide } from "./_components/insight-reading-guide";

export const metadata: Metadata = {
  title: "Insight Publik | Agoraya",
  description:
    "Pahami data pemerintah melalui interpretasi analitis. Bandingkan layanan daerah, telusuri anggaran, dan pahami kesejahteraan untuk keputusan yang lebih terarah.",
};

const BREADCRUMB_ITEMS = [
  { label: "Beranda", href: "/", current: false },
  { label: "Insight", href: undefined, current: true },
] as const;

export default function InsightPage() {
  return (
    <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground mb-4 text-xs"
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
      <section className="-mx-4 -mt-2 mb-6 bg-sky-50 px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:bg-sky-950/20">
        <span className="text-primary mb-3 inline-block text-xs font-semibold tracking-wider uppercase">
          INSIGHT PUBLIK
        </span>
        <h1 className="text-foreground mt-0 mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Pahami datanya. Lihat maknanya.
        </h1>
        <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed sm:text-base">
          Bandingkan layanan daerah, telusuri anggaran, dan pahami
          kesejahteraan. Insight sederhana untuk keputusan yang lebih terarah.
        </p>
      </section>

      <Suspense
        fallback={
          <div className="border-border bg-muted/40 h-96 animate-pulse rounded-xl border" />
        }
      >
        <InsightDashboard />
      </Suspense>

      <InsightReadingGuide />
      <InsightMethodology />

      <section
        aria-labelledby="insight-data-cta-title"
        className="mt-6 flex flex-col gap-4 rounded-xl bg-sky-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 dark:bg-sky-950/30"
      >
        <div>
          <h2
            id="insight-data-cta-title"
            className="text-foreground text-xl font-bold tracking-tight"
          >
            Dari insight, lanjutkan ke datanya.
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Temukan dataset dan pelajari konteks di balik setiap angka.
          </p>
        </div>
        <Link
          href="/data-pemerintah"
          aria-label="Jelajahi Data Pemerintah"
          className="bg-primary text-primary-foreground focus-visible:outline-primary inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Jelajahi Data Pemerintah
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
