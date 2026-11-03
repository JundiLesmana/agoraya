"use client";

import * as React from "react";
import {
  ChevronRight,
  X,
  Home,
  Database,
  FileText,
  Lightbulb,
  Megaphone,
} from "lucide-react";
import Link from "next/link";

const cmsDataPemerintahSubItems = [
  {
    section: "Cara kerja",
    items: [
      "Dataset & Metadata",
      "Anggaran APBD",
      "Proyek Pembangunan",
      "Statistik Daerah",
      "Verifikasi & publikasi",
    ],
  },
  {
    section: "Pemecahan masalah",
    items: [
      "Impor gagal",
      "Metadata belum lengkap",
      "Total/realisasi tidak konsisten",
      "Belum tampil publik",
      "Akses ditolak",
    ],
  },
];

export function MobileDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Navigasi bantuan"
    >
      <div className="w-[280px] flex-1 overflow-y-auto border-r border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <button
            onClick={onClose}
            aria-label="Tutup menu navigasi"
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav aria-label="Navigasi bantuan" className="px-4 pt-4">
          <p className="mb-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Dokumentasi
          </p>
          <Link
            href="/bantuan"
            className="flex h-6 items-center gap-2 rounded bg-blue-100 px-2 text-[11px] font-medium text-blue-800"
          >
            <Home className="size-3.5" aria-hidden="true" />
            Beranda
          </Link>

          <p className="mt-4 mb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Platform publik
          </p>
          <div className="space-y-1">
            <Link
              href="#"
              className="flex items-center gap-2 rounded px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-100"
            >
              <Database className="size-3.5 text-blue-700" aria-hidden="true" />
              <span className="flex-1">Data Pemerintah</span>
            </Link>
            <Link
              href="#"
              className="flex items-center gap-2 rounded px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-100"
            >
              <FileText className="size-3.5 text-blue-700" aria-hidden="true" />
              <span className="flex-1">Layanan Publik</span>
            </Link>
            <Link
              href="#"
              className="flex items-center gap-2 rounded px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-100"
            >
              <Megaphone
                className="size-3.5 text-blue-700"
                aria-hidden="true"
              />
              <span className="flex-1">Lapor Warga</span>
            </Link>
            <Link
              href="#"
              className="flex items-center gap-2 rounded px-3 py-2 text-[11px] text-slate-700 hover:bg-slate-100"
            >
              <Lightbulb
                className="size-3.5 text-blue-700"
                aria-hidden="true"
              />
              <span className="flex-1">Insight</span>
            </Link>
          </div>

          <p className="mt-4 mb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            CMS · Ruang ASN
          </p>
          <div className="space-y-1">
            <div className="overflow-hidden rounded-md border border-slate-200">
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-slate-700 hover:bg-slate-100"
                onClick={() => {}}
              >
                <FileText
                  className="size-3.5 text-blue-700"
                  aria-hidden="true"
                />
                <span className="flex-1">CMS Data Pemerintah</span>
                <ChevronRight
                  className="size-3.5 text-blue-700"
                  aria-hidden="true"
                />
              </button>
              <div className="border-t border-slate-100 bg-white/50">
                {cmsDataPemerintahSubItems.map((group) => (
                  <div key={group.section}>
                    <p className="mx-2 my-1 text-[9px] font-semibold tracking-tighter text-slate-500 uppercase">
                      {group.section}
                    </p>
                    <div className="space-y-0.5">
                      {group.items.map((item, i) => (
                        <Link
                          key={item}
                          href="#"
                          className={`block rounded py-1.5 pr-3 pl-8 text-[10px] ${
                            i === 0 && group.section === "Cara kerja"
                              ? "bg-blue-50 font-semibold text-blue-700"
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
            </div>
          </div>

          <div className="mt-4 space-y-1 border-t border-slate-200 pt-3">
            <Link
              href="#akun-privasi"
              className="block rounded px-3 py-1.5 text-[10px] text-slate-600 hover:bg-slate-50 hover:text-blue-700"
            >
              Akun & perlindungan privasi
            </Link>
            <Link
              href="#bantuan-lanjutan"
              className="block rounded px-3 py-1.5 text-[10px] text-slate-600 hover:bg-slate-50 hover:text-blue-700"
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
          <span className="relative inline rounded-full p-1.5">
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
