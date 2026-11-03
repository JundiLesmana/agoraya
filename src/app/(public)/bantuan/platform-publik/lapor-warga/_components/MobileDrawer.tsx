"use client";

import * as React from "react";
import { ChevronRight, X, Home, Megaphone, Info } from "lucide-react";
import Link from "next/link";

const sidebarItems = [
  { title: "Lapor Warga", icon: Megaphone, href: "#", expanded: true },
];

const laporWargaSubItems = [
  {
    section: "Cara kerja",
    items: [
      "Kategori & kronologi",
      "Lokasi & bukti",
      "Perlindungan identitas",
      "Kirim & lacak",
      "Konfirmasi hasil",
    ],
  },
  {
    section: "Pemecahan masalah",
    items: [
      "Lokasi salah / izin lokasi",
      "Bukti gagal diunggah",
      "Kode hilang / tidak dikenali",
      "Perlu kelengkapan / ditolak",
      "Hasil belum sesuai",
    ],
  },
];

export function MobileDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Navigasi bantuan"
    >
      <div className="flex-1 overflow-y-auto bg-slate-50 border-r border-slate-200 w-[280px]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <button
            onClick={onClose}
            aria-label="Tutup menu navigasi"
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav aria-label="Navigasi bantuan" className="px-4 pt-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Dokumentasi
          </p>
          <Link
            href="/bantuan"
            className="flex h-6 items-center gap-2 rounded bg-blue-100 px-2 text-[11px] font-medium text-blue-800"
          >
            <Home className="size-3.5" aria-hidden="true" />
            Beranda
          </Link>

          <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Platform publik
          </p>
          <div className="space-y-1">
            {sidebarItems.map(({ title, icon: Icon, expanded }) => (
              <div key={title} className="border border-slate-200 rounded-md overflow-hidden">
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-slate-700 hover:bg-slate-100"
                  onClick={() => {}}
                >
                  <Icon className="size-3.5 text-blue-700" aria-hidden="true" />
                  <span className="flex-1">{title}</span>
                  <ChevronRight className="size-3.5 text-blue-700" aria-hidden="true" />
                </button>
                {expanded && (
                  <div className="border-t border-slate-100 bg-white/50">
                    {laporWargaSubItems.map((group) => (
                      <div key={group.section}>
                        <p className="mx-2 my-1 text-[9px] font-semibold text-slate-500 uppercase tracking-tighter">
                          {group.section}
                        </p>
                        <div className="space-y-0.5">
                          {group.items.map((item, i) => (
                            <Link
                              key={item}
                              href="#"
                              className={`block pl-8 pr-3 py-1.5 rounded text-[10px] ${
                                i === 0
                                  ? "bg-blue-50 text-blue-700 font-semibold"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                              }`}
                            >
                              {item}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            CMS · Ruang ASN
          </p>
          <div className="space-y-1">
            <Link
              href="#"
              className="flex items-center gap-2 px-3 py-2 rounded text-[11px] text-slate-700 hover:bg-slate-100"
            >
              <Info className="size-3.5 text-blue-700" aria-hidden="true" />
              <span className="flex-1">CMS Lapor Warga</span>
            </Link>
          </div>

          <div className="mt-4 space-y-1 border-t border-slate-200 pt-3">
            <Link
              href="#akun-privasi"
              className="block px-3 py-1.5 rounded text-[10px] text-slate-600 hover:bg-slate-50 hover:text-blue-700"
            >
              Akun & perlindungan privasi
            </Link>
            <Link
              href="#bantuan-lanjutan"
              className="block px-3 py-1.5 rounded text-[10px] text-slate-600 hover:bg-slate-50 hover:text-blue-700"
            >
              Menghubungi pengelola
            </Link>
          </div>
        </nav>
      </div>
      <div className="fixed inset-y-0 right-0 z-40 flex items-center justify-end pr-2">
        <button
          onClick={onClose}
          className="rounded-full p-1 text-slate-400 hover:bg-black/10 hover:text-white"
          aria-hidden="true"
        >
          <span className="absolute -inset-0.5" />
          <span className="inline relative rounded-full p-1.5">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
