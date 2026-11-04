"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { HelpSearch } from "./HelpSearch";

type HelpNavigationProps = {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
};

const publicGuides = [
  { title: "Data Pemerintah", href: "/bantuan/platform-publik/data-pemerintah" },
  { title: "Layanan Publik", href: "/bantuan/platform-publik/layanan-publik" },
  { title: "Lapor Warga", href: "/bantuan/platform-publik/lapor-warga" },
  { title: "Insight", href: "/bantuan/platform-publik/insight" },
];

const asnGuides = [
  { title: "Data Pemerintah", href: "/bantuan/cms-ruang-asn/cms-data-pemerintah" },
  { title: "Layanan Publik", href: "/bantuan/cms-ruang-asn/cms-layanan-publik" },
  { title: "Lapor Warga", href: "/bantuan/cms-ruang-asn/cms-lapor-warga" },
  { title: "Insight", href: "/bantuan/cms-ruang-asn/cms-insight" },
];

const articleSections: Record<
  string,
  { heading: string; links: { title: string; id: string }[] }[]
> = {
  "/bantuan/platform-publik/data-pemerintah": [
    {
      heading: "Cara kerja",
      links: [
        { title: "Ringkasan & filter", id: "ringkasan-filter" },
        { title: "Anggaran APBD", id: "anggaran-apbd" },
        { title: "Proyek pembangunan", id: "proyek-pembangunan" },
        { title: "Statistik daerah", id: "statistik-daerah" },
        { title: "Dataset & unduhan", id: "dataset-unduhan" },
      ],
    },
    {
      heading: "Pemecahan masalah",
      links: [
        { title: "Data kosong", id: "data-kosong" },
        { title: "Angka berbeda", id: "angka-berbeda" },
        { title: "Unduhan gagal", id: "unduhan-gagal" },
      ],
    },
  ],
  "/bantuan/platform-publik/layanan-publik": [
    {
      heading: "Cara kerja",
      links: [
        { title: "Ruang warga, instansi & statistik", id: "ruang-warga-instansi-statistik" },
        { title: "Pengajuan layanan", id: "pengajuan-layanan" },
        { title: "Pelacakan & dokumen", id: "pelacakan-dokumen" },
        { title: "Hasil & peninjauan", id: "hasil-peninjauan" },
      ],
    },
    {
      heading: "Pemecahan masalah",
      links: [
        { title: "Nomor tidak ditemukan", id: "nomor-tidak-ditemukan" },
        { title: "Dokumen ditolak / gagal unggah", id: "dokumen-ditolak-gagal-unggah" },
        { title: "Status belum berubah", id: "status-belum-berubah" },
        { title: "Hasil perlu ditinjau", id: "hasil-perlu-ditinjau" },
      ],
    },
  ],
  "/bantuan/platform-publik/lapor-warga": [
    {
      heading: "Cara kerja",
      links: [
        { title: "Kategori & kronologi", id: "kategori-kronologi" },
        { title: "Lokasi & bukti", id: "lokasi-bukti" },
        { title: "Perlindungan identitas", id: "perlindungan-identitas" },
        { title: "Kirim & lacak", id: "kirim-lacak" },
        { title: "Konfirmasi hasil", id: "konfirmasi-hasil" },
      ],
    },
    {
      heading: "Pemecahan masalah",
      links: [
        { title: "Lokasi salah / izin lokasi", id: "lokasi-salah-izin-lokasi" },
        { title: "Bukti gagal diunggah", id: "bukti-gagal-diunggah" },
        { title: "Kode hilang / tidak dikenali", id: "kode-hilang-tidak-dikenali" },
        { title: "Perlu kelengkapan / ditolak", id: "perlu-kelengkapan-ditolak" },
        { title: "Hasil belum sesuai", id: "hasil-belum-sesuai" },
      ],
    },
  ],
  "/bantuan/platform-publik/insight": [
    {
      heading: "Cara kerja",
      links: [
        { title: "Filter perbandingan", id: "filter-perbandingan" },
        { title: "Ketepatan layanan", id: "ketepatan-layanan" },
        { title: "Tren anggaran", id: "tren-anggaran" },
        { title: "Indikator kesejahteraan", id: "indikator-kesejahteraan" },
        { title: "Sumber & metodologi", id: "sumber-metodologi" },
      ],
    },
    {
      heading: "Pemecahan masalah",
      links: [
        { title: "Grafik kosong", id: "grafik-kosong" },
        { title: "Perbandingan tidak setara", id: "perbandingan-tidak-setara" },
        { title: "Angka beda dari Data Pemerintah", id: "angka-beda-data-pemerintah" },
        { title: "Persen vs poin persentase", id: "persen-vs-poin-persentase" },
      ],
    },
  ],
  "/bantuan/cms-ruang-asn/cms-data-pemerintah": [
    {
      heading: "Cara kerja",
      links: [
        { title: "Dataset & Metadata", id: "dataset-metadata" },
        { title: "Anggaran APBD", id: "anggaran-apbd" },
        { title: "Proyek Pembangunan", id: "proyek-pembangunan" },
        { title: "Statistik Daerah", id: "statistik-daerah" },
        { title: "Verifikasi & publikasi", id: "verifikasi-publikasi" },
      ],
    },
    {
      heading: "Pemecahan masalah",
      links: [
        { title: "Impor gagal", id: "impor-gagal" },
        { title: "Metadata belum lengkap", id: "metadata-belum-lengkap" },
        { title: "Total/realisasi tidak konsisten", id: "total-realisasi-tidak-konsisten" },
        { title: "Belum tampil publik", id: "belum-tampil-publik" },
        { title: "Akses ditolak", id: "akses-ditolak" },
      ],
    },
  ],
  "/bantuan/cms-ruang-asn/cms-layanan-publik": [
    {
      heading: "Cara kerja",
      links: [
        { title: "Antrean Pengajuan", id: "antrean-pengajuan" },
        { title: "Standar & Formulir Layanan", id: "standar-formulir-layanan" },
        { title: "Penanganan Pengaduan", id: "penanganan-pengaduan" },
        { title: "Hasil & riwayat", id: "hasil-riwayat" },
      ],
    },
    {
      heading: "Pemecahan masalah",
      links: [
        { title: "Antrean kosong", id: "antrean-kosong" },
        { title: "Gagal asignasi", id: "gagal-asignasi" },
        { title: "SLA terlewati", id: "sla-terlewati" },
        { title: "Perubahan status gagal", id: "perubahan-status-gagal" },
        { title: "Dokumen tidak lengkap", id: "dokumen-tidak-lengkap" },
      ],
    },
  ],
  "/bantuan/cms-ruang-asn/cms-lapor-warga": [
    {
      heading: "Cara kerja",
      links: [
        { title: "Antrean Laporan", id: "antrean-laporan" },
        { title: "Verifikasi & Moderasi", id: "verifikasi-moderasi" },
        { title: "Disposisi ke OPD", id: "disposisi-opd" },
        { title: "Tindak Lanjut & Penutupan", id: "tindak-lanjut-penutupan" },
      ],
    },
    {
      heading: "Pemecahan masalah",
      links: [
        { title: "Salah OPD", id: "salah-opd" },
        { title: "Bukti sensitif", id: "bukti-sensitif" },
        { title: "Informasi kurang", id: "informasi-kurang" },
        { title: "Disposisi gagal/akses", id: "disposisi-gagal-akses" },
        { title: "Belum bisa ditutup/hasil ditolak", id: "belum-bisa-ditutup-hasil-ditolak" },
      ],
    },
  ],
  "/bantuan/cms-ruang-asn/cms-insight": [
    {
      heading: "Dalam panduan ini",
      links: [
        { title: "Sumber & validasi analisis", id: "sumber-validasi" },
        { title: "Identitas & SEO", id: "identitas-seo" },
        { title: "Widget data", id: "widget-data" },
        { title: "Draf & pratinjau", id: "draf-pratinjau" },
        { title: "Penerbitan & publikasi", id: "penerbitan-publikasi" },
        { title: "Pemecahan masalah", id: "pemecahan-masalah" },
      ],
    },
  ],
};

export function HelpMobileDrawer({
  isOpen,
  onClose,
  currentPath,
}: HelpNavigationProps) {
  if (!isOpen) return null;
  const currentSections =
    Object.entries(articleSections).find(([path]) => path === currentPath)?.[1] ?? [];

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Navigasi bantuan">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45"
        onClick={onClose}
        aria-label="Tutup menu navigasi"
      />
      <nav className="relative flex h-full w-[min(21rem,88vw)] flex-col overflow-y-auto border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Pusat bantuan</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Panduan Agoraya</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
            aria-label="Tutup menu navigasi"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="px-5 pt-4">
          <HelpSearch />
        </div>
        <div className="space-y-7 px-4 py-5">
          <section aria-label="Panduan saat ini" className="space-y-4">
            {currentSections.map((group) => (
              <div key={group.heading}>
                <h2 className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {group.heading}
                </h2>
                <ul className="space-y-0.5">
                  {group.links.map(({ title, id }) => (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        onClick={onClose}
                        className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
                      >
                        {title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
          <NavigationGroup
            title="Platform publik"
            overviewHref="/bantuan/platform-publik"
            items={publicGuides}
            currentPath={currentPath}
            onNavigate={onClose}
          />
          <NavigationGroup
            title="CMS · Ruang ASN"
            overviewHref="/bantuan/cms-ruang-asn"
            items={asnGuides}
            currentPath={currentPath}
            onNavigate={onClose}
          />
        </div>
        <div className="mt-auto border-t border-slate-200 dark:border-slate-800 px-5 py-4">
          {currentPath !== "/bantuan/cms-ruang-asn/cms-insight" && (
            <div className="mb-4 space-y-1">
              <a
                href="#akun-privasi"
                onClick={onClose}
                className="block rounded px-2 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900 hover:text-blue-800"
              >
                Akun & perlindungan privasi
              </a>
              <a
                href="#bantuan-lanjutan"
                onClick={onClose}
                className="block rounded px-2 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900 hover:text-blue-800"
              >
                Menghubungi pengelola
              </a>
            </div>
          )}
          <Link
            href="/bantuan"
            onClick={onClose}
            className="text-sm font-medium text-blue-800 hover:underline"
          >
            ← Kembali ke beranda bantuan
          </Link>
        </div>
      </nav>
    </div>
  );
}

function NavigationGroup({
  title,
  overviewHref,
  items,
  currentPath,
  onNavigate,
}: {
  title: string;
  overviewHref: string;
  items: { title: string; href: string }[];
  currentPath: string;
  onNavigate: () => void;
}) {
  return (
    <section aria-label={title}>
      <Link
        href={overviewHref}
        onClick={onNavigate}
        className="mb-2 block px-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 hover:text-blue-800"
      >
        {title}
      </Link>
      <ul className="space-y-1">
        {items.map(({ title: itemTitle, href }) => {
          const active = currentPath === href;
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`block rounded-md px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700 ${
                  active
                    ? "bg-blue-50 font-semibold text-blue-900"
                    : "text-slate-700 hover:bg-slate-50 dark:bg-slate-900 hover:text-blue-800"
                }`}
              >
                {itemTitle}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
