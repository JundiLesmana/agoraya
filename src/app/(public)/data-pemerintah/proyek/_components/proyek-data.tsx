'use client';

import { useSearchParams } from 'next/navigation';
import { MobileFilterDrawer } from './mobile-filter-drawer';
import { InfoBanner, formatInfoBanner } from './info-banner';
import { filterProjects, MOCK_PROJECTS, type Project } from '@/lib/projects';
import { SourceBadge } from '@/components/source-badges';
import { cn } from '@/lib/utils';

const CURRENCY = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return CURRENCY.format(value);
}

function StatusBadge({ status }: { status: Project['status'] }) {
  const variants: Record<Project['status'], string> = {
    Selesai: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Berjalan: 'bg-blue-100 text-blue-800 border-blue-200',
    Tertunda: 'bg-amber-100 text-amber-800 border-amber-200',
  };
  // eslint-disable-next-line security/detect-object-injection
  const variant = variants[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold',
        variant,
      )}
    >
      {status}
    </span>
  );
}

export function ProyekData() {
  const searchParams = useSearchParams();
  const wilayah = searchParams.get('wilayah') ?? 'Provinsi Jawa Barat';
  const periode = searchParams.get('periode') ?? '2025 · s.d. TW III';
  const sektor = searchParams.get('sektor') ?? 'Semua sektor';
  const status = searchParams.get('status') ?? 'Semua status';

  const filters = { wilayah, periode, sektor, status };
  const projects = filterProjects([...MOCK_PROJECTS], filters);
  const banner = formatInfoBanner(wilayah, periode, '30 Sep 2025, 16.00 WIB');

  return (
    <>
      <MobileFilterDrawer
        filters={filters}
        onApply={() => {}}
        onReset={() => {}}
      />
      <InfoBanner {...banner} />

      <section aria-label="Daftar proyek">
        <h2 className="sr-only">Daftar proyek</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.length > 0 ? (
            projects.map((project) => (
              <article
                key={project.id}
                className="border border-border rounded-lg bg-card p-4 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-foreground">
                  {project.nama_proyek}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {project.kabupaten}, {project.wilayah}
                </p>
                <dl className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <dt className="text-muted-foreground">Sektor</dt>
                  <dd className="text-foreground">{project.sektor}</dd>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <StatusBadge status={project.status} />
                  </dd>
                  <dt className="text-muted-foreground">Tahun / Triwulan</dt>
                  <dd className="text-foreground">
                    {project.tahun} / {project.triwulan}
                  </dd>
                  <dt className="text-muted-foreground">Anggaran</dt>
                  <dd className="text-foreground">
                    {formatCurrency(project.anggaran)}
                  </dd>
                  <dt className="text-muted-foreground">Realisasi</dt>
                  <dd className="text-foreground">
                    {formatCurrency(project.realisasi)}
                  </dd>
                </dl>
                <SourceBadge source="SIMULATED" />
              </article>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Tidak ada proyek yang sesuai dengan filter yang dipilih.
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Total proyek ditampilkan: {projects.length}
        </p>
      </section>
    </>
  );
}
