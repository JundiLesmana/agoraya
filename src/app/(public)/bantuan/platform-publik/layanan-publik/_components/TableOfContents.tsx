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
  { id: "ruang-warga-instansi-statistik", label: "Ruang warga, instansi & statistik", level: 2 },
  { id: "pengajuan-layanan", label: "Pengajuan layanan", level: 2 },
  { id: "pelacakan-dokumen", label: "Pelacakan & dokumen", level: 2 },
  { id: "hasil-peninjauan", label: "Hasil & peninjauan", level: 2 },
  { id: "pemecahan-masalah", label: "Pemecahan masalah", level: 1 },
  { id: "nomor-tidak-ditemukan", label: "Nomor tidak ditemukan", level: 2 },
  { id: "dokumen-ditolak-gagal-unggah", label: "Dokumen ditolak / gagal unggah", level: 2 },
  { id: "status-belum-berubah", label: "Status belum berubah", level: 2 },
  { id: "hasil-perlu-ditinjau", label: "Hasil perlu ditinjau", level: 2 },
  { id: "bantuan-lanjutan", label: "Bantuan lanjutan", level: 1 },
];

export function TableOfContents() {
  const [activeId, setActiveId] = React.useState<string | null>("sebelum-mulai");
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
      className="hidden xl:flex flex-col w-[260px] flex-shrink-0"
    >
      <div className="sticky top-[80px] pt-[6px]">
        <h2 className="mb-[14px] text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          DI HALAMAN INI
        </h2>
        <nav className="space-y-[2px] text-[10px]">
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
                className={`block px-[10px] py-[5px] rounded-md text-slate-600 transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "hover:bg-slate-50 hover:text-slate-800"
                } ${isParent ? "pl-0 pr-2" : "pl-[20px] pr-2"} `}
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
