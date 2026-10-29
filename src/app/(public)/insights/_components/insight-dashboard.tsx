'use client';

import { Suspense, useCallback, useState } from 'react';
import { type InsightFilterValues, DEFAULT_FILTERS } from './filter-controls';
import { MobileFilterDrawer } from './mobile-filter-drawer';
import { InfoBanner } from './info-banner';
import { SourceBadge } from '@/components/source-badges';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { MOCK_INSIGHTS, filterInsights } from '@/lib/insight';

const TOPIC_LABELS: Record<string, string> = {
  Layanan: 'Layanan Publik',
  Anggaran: 'Anggaran Daerah',
  Kesejahteraan: 'Kesejahteraan Masyarakat',
};

function InsightSection({
  topic,
  items,
}: {
  topic: { key: string; label: string };
  items: InsightItem[];
}) {
  if (items.length === 0) {
    return (
      <section
        id={`section-${topic.key}`}
        aria-labelledby={`heading-${topic.key}`}
        className="rounded-xl border border-border bg-card p-5"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id={`heading-${topic.key}`} className="text-lg font-semibold">
            {topic.label}
          </h2>
          <SourceBadge source="SIMULATED" withIcon={false} />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Tidak ada data insight untuk filter yang dipilih.
        </p>
      </section>
    );
  }

  return (
    <section
      id={`section-${topic.key}`}
      aria-labelledby={`heading-${topic.key}`}
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 id={`heading-${topic.key}`} className="text-lg font-semibold">
          {topic.label}
        </h2>
        <SourceBadge source="SIMULATED" withIcon={false} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-lg border border-border bg-background p-4">
            <h3 className="text-base font-semibold">{item.judul}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {item.keterangan}
            </p>
            <p className="mt-3 text-2xl font-bold">{item.nilai}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

interface InsightItem {
  id: string;
  judul: string;
  topik: string;
  wilayah: string;
  fokus: string;
  periode: string;
  nilai: number;
  keterangan: string;
}

export function InsightDashboard() {
  const [filters, setFilters] = useState<InsightFilterValues>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const allFiltered = filterInsights(MOCK_INSIGHTS, filters);
  const itemsByTopic = Object.entries(TOPIC_LABELS).map(([key, label]) => ({
    key,
    label,
    items: allFiltered.filter((item) => item.topik === key),
  }));

  const sections =
    filters.topik === 'Semua topik'
      ? itemsByTopic
      : itemsByTopic.filter(({ key }) => key === filters.topik);

  const refresh = useCallback((next: InsightFilterValues) => {
    setHasError(false);
    setIsLoading(true);
    setFilters(next);
    void setTimeout(() => setIsLoading(false), 500);
  }, []);

  const handleApply = useCallback(
    (next: InsightFilterValues) => refresh(next),
    [refresh],
  );

  const handleReset = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    setFilters(DEFAULT_FILTERS);
    void setTimeout(() => setIsLoading(false), 500);
  }, []);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-muted-foreground">Memuat ulang insight...</p>
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-xl border border-border bg-muted/40"
          />
        ))}
      </section>
    );
  }

  if (hasError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <span>Gagal memuat ulang insight setelah filter diubah.</span>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RefreshCw className="size-4 mr-2" aria-hidden="true" />
          Coba lagi
        </Button>
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={<div className="h-36 animate-pulse rounded-xl border border-border bg-muted/40" />}>
        <MobileFilterDrawer
          filters={filters}
          onApply={handleApply}
          onReset={handleReset}
        />
      </Suspense>
      <InfoBanner
        wilayah={filters.wilayah}
        periode={filters.periode}
        topik={filters.topik}
        updatedAt="10 Apr 2024, 08.00 WIB"
      />
      <section id="insight-tab-panel" role="tabpanel" className="space-y-5">
        {sections.map(({ key, label, items }) => (
          <InsightSection key={key} topic={{ key, label }} items={items} />
        ))}
        {sections.every((section) => section.items.length === 0) && (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Tidak ada insight yang cocok dengan filter yang dipilih.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
