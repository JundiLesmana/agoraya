'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { FilterControls, type InsightFilterValues, DEFAULT_FILTERS } from './filter-controls';

export function MobileFilterDrawer({
  filters,
  onApply,
  onReset,
}: {
  filters: InsightFilterValues;
  onApply: (values: InsightFilterValues) => void;
  onReset: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);

  const handleApply = (values: InsightFilterValues) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('wilayah', values.wilayah);
    params.set('fokus', values.fokus);
    params.set('periode', values.periode);
    params.set('topik', values.topik);
    router.replace(`?${params.toString()}`);
    onApply(values);
    setOpen(false);
  };

  const handleReset = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('wilayah', DEFAULT_FILTERS.wilayah);
    params.set('fokus', DEFAULT_FILTERS.fokus);
    params.set('periode', DEFAULT_FILTERS.periode);
    params.set('topik', DEFAULT_FILTERS.topik);
    router.replace(`?${params.toString()}`);
    onReset();
    setOpen(false);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <>
      {isMobile ? (
        <>
          <Button
            variant="outline"
            onClick={() => setOpen(true)}
            aria-label="Buka filter insight"
            className="w-full"
          >
            Filter
          </Button>
          <Modal
            open={open}
            onOpenChange={setOpen}
            title="Filter insight"
            description="Pilih wilayah, fokus daerah, periode, dan topik untuk menyaring insight."
          >
            <FilterControls
              filters={filters}
              onApply={handleApply}
              onReset={handleReset}
            />
          </Modal>
        </>
      ) : (
        <FilterControls
          filters={filters}
          onApply={onApply}
          onReset={onReset}
        />
      )}
    </>
  );
}
