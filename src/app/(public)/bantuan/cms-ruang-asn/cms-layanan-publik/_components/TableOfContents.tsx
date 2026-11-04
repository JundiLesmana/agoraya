"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type TocItem = {
  id: string;
  label: string;
  level: 1 | 2;
};

const ITEMS: TocItem[] = [
  { id: "sebelum-mulai", label: "Sebelum mulai", level: 1 },
  { id: "cara-kerja", label: "Cara kerja", level: 1 },
  { id: "antrean-pengajuan", label: "Antrean Pengajuan", level: 2 },
  { id: "standar-formulir-layanan", label: "Standar & Formulir Layanan", level: 2 },
  { id: "penanganan-pengaduan", label: "Penanganan Pengaduan", level: 2 },
  { id: "hasil-riwayat", label: "Hasil & riwayat", level: 2 },
  { id: "pemecahan-masalah", label: "Pemecahan masalah", level: 1 },
  { id: "antrean-kosong", label: "Antrean kosong", level: 2 },
  { id: "gagal-asignasi", label: "Gagal asignasi", level: 2 },
  { id: "sla-terlewati", label: "SLA terlewati", level: 2 },
  { id: "perubahan-status-gagal", label: "Perubahan status gagal", level: 2 },
  { id: "dokumen-tidak-lengkap", label: "Dokumen tidak lengkap", level: 2 },
  { id: "bantuan-lanjutan", label: "Bantuan lanjutan", level: 1 },
];

export function TableOfContents() {
  const [activeId, setActiveId] = React.useState<string | null>(
    "sebelum-mulai",
  );
  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let active: string | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            active = (entry.target as HTMLElement).id;
            break;
          }
        }
        if (active) setActiveId(active);
      },
      { rootMargin: "-120px 0% -70% 0%", threshold: 0 },
    );

    ITEMS.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const base = `${pathname}?${searchParams.toString()}`;

  return (
    <aside
      aria-label="Di halaman ini"
      className="hidden w-[260px] flex-shrink-0 flex-col xl:flex"
    >
      <div className="sticky top-[80px] pt-[6px]">
        <h2 className="mb-[14px] text-xs font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
          DI HALAMAN INI
        </h2>
        <nav className="space-y-[2px] text-xs">
          {ITEMS.map((item) => {
            const isActive = activeId === item.id;
            const isParent = item.level === 1;
            return (
              <Link
                key={item.id}
                href={`${base}#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(item.id);
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  setActiveId(item.id);
                }}
                className={`block rounded-md px-[10px] py-[5px] text-slate-600 dark:text-slate-300 transition-colors ${
                  isActive
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : "hover:bg-slate-50 dark:bg-slate-900 hover:text-slate-800 dark:text-slate-100"
                } ${isParent ? "pr-2 pl-0" : "pr-2 pl-[20px]"}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
