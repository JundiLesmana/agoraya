import type { Metadata } from 'next';
import Link from 'next/link';
import { DownloadButton } from './_components/download-button';
import { ProyekData } from './_components/proyek-data';

export const metadata: Metadata = {
  title: 'Pantau proyek daerah | Agoraya',
  description:
    'Pantau progres, anggaran, dan tahapan pembangunan proyek pemerintah di Jawa Barat secara transparan dan terukur.',
};

const BREADCRUMB_ITEMS = [
  { label: 'Beranda', href: '/', current: false },
  { label: 'Data Pemerintah', href: '/data-pemerintah', current: false },
  { label: 'Proyek', href: undefined, current: true },
] as const;

export default function ProyekPage() {
  return (
    <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
      >
        <ol className="flex flex-wrap items-center gap-1">
          {BREADCRUMB_ITEMS.flatMap((item, index) => [
            index > 0 ? (
              <li
                key={`breadcrumb-separator-${index}`}
                aria-hidden="true"
                className="select-none"
              >
                {'>'}
              </li>
            ) : null,
            item.current ? (
              <li
                key={`breadcrumb-item-${index}`}
                aria-current="page"
                className="font-medium text-foreground"
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

      <section>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 lg:gap-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Pantau proyek daerah
            </h1>
            <p className="text-base leading-7 text-muted-foreground max-w-lg">
              Telusuri progres, anggaran, dan tahapan pembangunan di Jawa Barat.
            </p>
          </div>
          <div className="flex items-end lg:items-start">
            <DownloadButton />
          </div>
        </div>
      </section>

      <ProyekData />
    </div>
  );
}
