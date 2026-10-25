import type { Metadata } from "next";
import Link from "next/link";
import { DatasetInformation } from "./_components/dataset-information";
import { ProyekData } from "./_components/proyek-data";

export const metadata: Metadata = {
  title: "Pantau proyek daerah | Agoraya",
  description:
    "Pantau progres, anggaran, dan tahapan pembangunan proyek pemerintah di Jawa Barat secara transparan dan terukur.",
};

const BREADCRUMB_ITEMS = [
  { label: "Beranda", href: "/", current: false },
  { label: "Data Pemerintah", href: "/data-pemerintah", current: false },
  { label: "Proyek", href: undefined, current: true },
] as const;

export default function ProyekPage() {
  return (
    <main className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground mb-6 flex flex-wrap items-center gap-1 text-sm"
      >
        <ol className="flex flex-wrap items-center gap-1">
          {BREADCRUMB_ITEMS.flatMap((item, index) => [
            index > 0 ? (
              <li
                key={`breadcrumb-separator-${index}`}
                aria-hidden="true"
                className="select-none"
              >
                {">"}
              </li>
            ) : null,
            item.current ? (
              <li
                key={`breadcrumb-item-${index}`}
                aria-current="page"
                className="text-foreground font-medium"
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

      <DatasetInformation />
      <ProyekData />
    </main>
  );
}
