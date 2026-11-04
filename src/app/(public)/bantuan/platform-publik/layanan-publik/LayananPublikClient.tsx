"use client";
import { HelpSearch } from "@/app/(public)/bantuan/_components/HelpSearch";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  Database,
  FileText,
  Home,
  Lightbulb,
  Megaphone,

  ArrowRight,
} from "lucide-react";
import { TableOfContents } from "./_components/TableOfContents";
import { MobileDrawer } from "./_components/MobileDrawer";

type Step = {
  n: number;
  text: string;
};

type CaraKerjaItem = {
  id: string;
  title: string;
  siapkan: string;
  steps: Step[];
  hasil: string;
};

type MasalahItem = {
  id: string;
  title: string;
  check: string;
  contact: string;
};

const CARA_KERJA: CaraKerjaItem[] = [
  {
    id: "ruang-warga-instansi-statistik",
    title: "Ruang warga, instansi & statistik",
    siapkan: "Tujuan akses: mengajukan, mengetahui instansi, atau membaca ringkasan.",
    steps: [
      {
        n: 1,
        text: "Pilih Ruang warga untuk melihat pengajuan sendiri, memulai layanan, dan membuka pelacakan sesuai akses akun.",
      },
      {
        n: 2,
        text: "Gunakan Ruang instansi untuk memahami informasi penyelenggara yang ditampilkan. Untuk pengelolaan antrean oleh petugas, ikuti panduan CMS Layanan Publik.",
      },
      {
        n: 3,
        text: "Buka Ruang statistik untuk melihat ringkasan layanan. Baca cakupan dan periode; angka agregat bukan status pengajuan pribadi.",
      },
    ],
    hasil: "Anda memilih ruang yang sesuai, tanpa menyamakan ringkasan dengan keputusan atas pengajuan.",
  },
  {
    id: "pengajuan-layanan",
    title: "Pengajuan layanan",
    siapkan: "Jenis layanan dan persyaratan perizinan, bantuan sosial, atau pendidikan.",
    steps: [
      {
        n: 1,
        text: "Pilih Ajukan layanan, tentukan jenis layanan, dan baca persyaratan serta target yang tercantum. Periksa kelayakan sebelum melanjutkan.",
      },
      {
        n: 2,
        text: "Isi detail sesuai fakta. Unggah lampiran pada tempatnya dengan format, ukuran, dan jumlah yang diizinkan oleh formulir layanan tersebut.",
      },
      {
        n: 3,
        text: "Pada Tinjau & kirim, periksa isian dan lampiran. Kirim setelah benar, lalu simpan nomor pelacakan dan unduh bukti pengajuan bila tersedia.",
      },
    ],
    hasil: "Pengajuan tercatat dan bukti tersimpan; keputusan tetap menunggu pemeriksaan instansi.",
  },
  {
    id: "pelacakan-dokumen",
    title: "Pelacakan & dokumen",
    siapkan: "Nomor pada bukti pengajuan dan akses akun pemohon bila diperlukan.",
    steps: [
      {
        n: 1,
        text: "Masukkan nomor lengkap pada pelacakan atau buka Pengajuan saya. Cocokkan layanan dan instansi agar tidak membuka pengajuan yang keliru.",
      },
      {
        n: 2,
        text: "Baca status, riwayat, dan target sesuai layanan. Jika Perlu dokumen, buka permintaan petugas dan catat dokumen serta batas yang ditampilkan.",
      },
      {
        n: 3,
        text: "Lengkapi dokumen melalui jalur yang tersedia, tinjau, dan kirim. Periksa riwayat untuk memastikan tambahan sudah tercatat; jangan mengirim data pribadi di pesan publik.",
      },
    ],
    hasil: "Anda mengetahui tindakan berikutnya dan dapat memeriksa bukti pengiriman dokumen.",
  },
  {
    id: "hasil-peninjauan",
    title: "Hasil & peninjauan",
    siapkan: "Detail pengajuan dan pembaruan hasil dari instansi.",
    steps: [
      {
        n: 1,
        text: "Saat hasil tersedia, buka detail Selesai. Baca keputusan, bukti tindak lanjut, dan lampiran hasil yang dapat diakses.",
      },
      {
        n: 2,
        text: "Bandingkan hasil dengan permohonan dan baca riwayatnya. Unduh bukti pengajuan atau hasil sesuai tombol yang tersedia.",
      },
      {
        n: 3,
        text: "Jika ada ketidaksesuaian, gunakan Hubungi instansi atau peninjauan resolusi bila tersedia. Jelaskan bagian yang belum sesuai dan sertakan bukti relevan tanpa membuka data pribadi.",
      },
    ],
    hasil: "Hasil dipahami, atau permintaan peninjauan disampaikan melalui jalur yang sesuai.",
  },
];

const MASALAH: MasalahItem[] = [
  {
    id: "nomor-tidak-ditemukan",
    title: "Nomor tidak ditemukan",
    check:
      "Salin nomor dari bukti tanpa spasi tambahan. Pastikan Anda memakai pelacakan Layanan Publik, bukan kode Lapor Warga. Periksa Pengajuan saya dengan akun yang digunakan saat mengajukan.",
    contact:
      "nomor pada bukti tetap tidak dikenali; sertakan nomor, jenis layanan, dan waktu pengiriman melalui kanal bantuan yang tersedia.",
  },
  {
    id: "dokumen-ditolak-gagal-unggah",
    title: "Dokumen ditolak / gagal unggah",
    check:
      "Baca alasan penolakan dan batas pada formulir layanan. Periksa format, ukuran, keterbacaan, masa berlaku bila diminta, serta koneksi. Perbaiki lampiran lalu kirim ulang dari permintaan dokumen.",
    contact:
      "berkas sudah sesuai tetapi tetap gagal, atau alasan penolakan belum jelas; sertakan pesan kesalahan, bukan dokumen pribadi di kanal publik.",
  },
  {
    id: "status-belum-berubah",
    title: "Status belum berubah",
    check:
      "Baca pembaruan terakhir dan pastikan tidak ada permintaan dokumen yang belum ditanggapi. Cocokkan target yang tercantum pada layanan, bukan patokan waktu umum.",
    contact:
      "target layanan terlampaui atau tindakan Anda belum tercatat; sertakan nomor, waktu, dan riwayat terkait kepada instansi.",
  },
  {
    id: "hasil-perlu-ditinjau",
    title: "Hasil perlu ditinjau",
    check:
      "Periksa keputusan serta alasan di detail hasil. Tuliskan ketidaksesuaian secara spesifik, lalu gunakan peninjauan atau Hubungi instansi jika tersedia. Hindari membuat pengajuan duplikat sebelum arahan jelas.",
    contact:
      "jalur peninjauan tidak tersedia atau penjelasan hasil belum menjawab persoalan; sertakan nomor pengajuan dan bukti relevan yang disamarkan.",
  },
];

const sidebarItems = [
  { title: "Data Pemerintah", icon: Database, href: "/bantuan/platform-publik/data-pemerintah" },
  { title: "Layanan Publik", icon: FileText, href: "/bantuan/platform-publik/layanan-publik" },
  { title: "Lapor Warga", icon: Megaphone, href: "/bantuan/platform-publik/lapor-warga" },
  { title: "Insight", icon: Lightbulb, href: "/bantuan/platform-publik/insight" },
];

function SearchBox({ compact = false }: { compact?: boolean }) {
  return <HelpSearch compact={compact} />;
}

function StepBadge({ n }: { n: number }) {
  return (
    <span
      className="inline-flex items-center justify-center h-[18px] min-w-[18px] rounded-full bg-blue-50 px-1 text-sm font-semibold text-blue-700 shrink-0"
    >
      {n}
    </span>
  );
}

export default function LayananPublikArticlePage() {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Agoraya — Beranda"
          className="flex h-[24px] w-[94px] shrink-0 items-center border-r border-slate-200 dark:border-slate-800 pr-2"
        >
          <Image src="/logo/logo-light.svg" alt="Agoraya" width={189} height={42} priority className="h-auto w-full" />
        </Link>
<span className="ml-3 text-base font-medium text-slate-600 dark:text-slate-300">Pusat bantuan</span>
        <div className="absolute left-[calc(50%+40px)] hidden -translate-x-1/2 md:block">
          <SearchBox compact />
        </div>
        <Link
          href="/"
          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
        >
          <span className="hidden sm:inline">Kembali ke platform</span>{" "}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
        <button
          className="ml-2 flex h-10 w-10 items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100"
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Buka menu navigasi"
        >
          <span className="relative inline-block h-[3px] w-[20px] bg-slate-800">
            <span className="absolute left-0 top-[-7px] h-[3px] w-[20px] bg-slate-800" />
            <span className="absolute left-0 top-[7px] h-[3px] w-[20px] bg-slate-800" />
          </span>
        </button>
      </header>

      <aside
        className="fixed bottom-0 left-0 top-14 hidden w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 md:block"
        aria-label="Navigasi bantuan"
      >
        <nav className="px-[10px] pt-[14px]">
          <p className="mb-[9px] text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
            Dokumentasi
          </p>
          <Link
            href="/bantuan"
            className="flex h-[20px] items-center gap-[6px] rounded bg-blue-100 px-[6px] text-xs font-medium text-blue-800"
          >
            <Home className="h-[9px] w-[9px]" aria-hidden="true" /> Beranda
          </Link>

          <p className="mb-[5px] mt-[13px] text-xs font-semibold uppercase tracking-[0.06em] text-slate-500 dark:text-slate-400">
            Platform publik
          </p>
          <div className="space-y-[2px]">
            {sidebarItems.map(({ title, icon: Icon, href }) => {
              const isActivePillar = title === "Layanan Publik";
              return (
                <div key={title} className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
                  <Link
                    href={href}
                    className="flex h-[22px] items-center gap-[6px] rounded px-[6px] text-xs text-slate-700 hover:bg-slate-100"
                  >
                    <Icon className="h-[9px] w-[9px] text-blue-700" aria-hidden="true" />
                    <span className="flex-1">{title}</span>
                    <ChevronRight className="h-[8px] w-[8px] text-blue-700" aria-hidden="true" />
                  </Link>
                  {isActivePillar && (
                    <div className="border-t border-slate-100 bg-white dark:bg-slate-950/50">
                      <div className="space-y-0">
                        <p className="mx-[6px] my-[1px] text-xs font-semibold uppercase tracking-tighter text-slate-500 dark:text-slate-400">
                          Cara kerja
                        </p>
                        <div className="space-y-[1px]">
                          {CARA_KERJA.map((item, i) => (
                            <Link
                              key={item.id}
                              href={`#${item.id}`}
                              className={`block pl-[20px] pr-[6px] py-[2px] rounded text-xs ${
                                i === 0
                                  ? "bg-[#eef4fb] text-blue-700 font-semibold"
                                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900 hover:text-slate-800 dark:text-slate-100"
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                const el = document.getElementById(item.id);
                                el?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }}
                            >
                              {item.title}
                            </Link>
                          ))}
                        </div>
                        <p className="mx-[6px] my-[3px] text-xs font-semibold uppercase tracking-tighter text-slate-500 dark:text-slate-400">
                          Pemecahan masalah
                        </p>
                        <div className="space-y-[1px]">
                          {MASALAH.map((item, i) => (
                            <Link
                              key={item.id}
                              href={`#${item.id}`}
                              className={`block pl-[20px] pr-[6px] py-[2px] rounded text-xs ${
                                i === 0
                                  ? "bg-[#eef4fb] text-blue-700 font-semibold"
                                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900 hover:text-slate-800 dark:text-slate-100"
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                const el = document.getElementById(item.id);
                                el?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }}
                            >
                              {item.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mb-[5px] mt-[10px] text-xs font-semibold uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400">
            CMS · Ruang ASN
          </p>
          <div className="space-y-[2px]">
            <Link
              href="/bantuan/cms-ruang-asn/cms-layanan-publik"
              className="flex h-[22px] items-center gap-[6px] rounded px-[6px] text-xs text-slate-700 hover:bg-slate-100"
            >
              <FileText className="h-[9px] w-[9px] text-blue-700" aria-hidden="true" />
              <span className="flex-1">CMS Layanan Publik</span>
              <ChevronRight className="h-[8px] w-[8px] text-blue-700" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-[12px] space-y-[7px] border-t border-slate-200 dark:border-slate-800 pt-[9px]">
            <Link href="#akun-privasi" className="block text-xs text-slate-500 dark:text-slate-400 hover:text-blue-700">
              Akun & perlindungan privasi
            </Link>
            <Link href="#bantuan-lanjutan" className="block text-xs text-slate-500 dark:text-slate-400 hover:text-blue-700">
              Menghubungi pengelola
            </Link>
          </div>
        </nav>
      </aside>

      <MobileDrawer isOpen={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />

      <div className="mx-auto max-w-[1120px] px-4 pb-8 pt-[70px] md:ml-64 md:px-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
          <main className="w-full" aria-label="Konten artikel">
            <a href="#main-content" className="sr-only focus:not-sr-only">
              Lompat ke konten utama
            </a>

            <nav aria-label="Breadcrumb" className="mb-[16px] text-sm text-slate-500 dark:text-slate-400">
              <Link href="/bantuan" className="hover:text-blue-700 hover:underline">
                Pusat bantuan
              </Link>
              <span className="px-1 text-slate-400">/</span>
              <Link href="/bantuan/platform-publik" className="hover:text-blue-700 hover:underline">
                Platform publik
              </Link>
              <span className="px-1 text-slate-400">/</span>
              <span className="font-medium text-slate-700">Layanan Publik</span>
            </nav>

            <div className="flex flex-col gap-[20px]" id="main-content">
              <div className="flex flex-col gap-[6px]">
                <span className="inline-flex items-center gap-[4px] rounded-md bg-[#eef4fb] px-[10px] py-[4px] text-sm font-semibold tracking-[0.12em] text-blue-700 uppercase">
                  PANDUAN WARGA
                </span>
                <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-slate-800 dark:text-slate-100 sm:text-5xl">
                  Layanan Publik
                </h1>
                <p className="mt-[10px] max-w-[700px] text-[15px] leading-[1.7] text-slate-600 dark:text-slate-300">
                  Ajukan perizinan, bantuan sosial, atau pendidikan; simpan bukti dan ikuti
                  perkembangan pengajuan sampai hasil tersedia.
                </p>
                <p className="mt-[8px] text-[12px] leading-[1.5] text-slate-500 dark:text-slate-400">
                  4 topik cara kerja · 4 pemecahan masalah
                </p>
              </div>

              <section id="sebelum-mulai" className="rounded-md border-l-2 border-[#2563eb] bg-[#eef4fb] px-[12px] py-[10px]">
                <div className="flex gap-[8px]">
                  <div className="flex shrink-0 items-center text-blue-600" aria-hidden="true">
                    <span role="img" aria-label="Info">ⓘ</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Sebelum mulai</p>
                    <p className="mt-[2px] text-sm leading-[1.55] text-slate-600 dark:text-slate-300">
                      Baca persyaratan layanan yang dipilih dan siapkan lampiran sesuai formulirnya. Gunakan akun pemohon bila diminta. Persyaratan, format dokumen, dan target waktu mengikuti setiap layanan.
                    </p>
                  </div>
                </div>
              </section>

              <section id="cara-kerja" className="mt-[8px]">
                <div className="mb-[12px] flex items-center gap-[6px]">
                  <h2 className="text-[14px] font-bold tracking-[-0.02em] text-slate-800 dark:text-slate-100">
                    Cara kerja
                  </h2>
                </div>
                <p className="mb-[16px] text-sm leading-[1.5] text-slate-600 dark:text-slate-300">
                  Ikuti langkah-langkah bernomor untuk setiap fitur. Setiap tahap dilengkapi
                  dengan konteks siapan dan hasil yang dapat diharapkan.
                </p>

                {CARA_KERJA.map((item) => (
                  <article
                    key={item.id}
                    id={item.id}
                    className="scroll-mt-[90px] mb-[20px] border-b border-slate-100 pb-[16px] last:mb-0 last:border-0 last:pb-0"
                  >
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{item.title}</h3>
                    <p className="mt-[3px] text-sm text-slate-500 dark:text-slate-400">Siapkan: {item.siapkan}</p>
                    <ol className="mt-[8px] list-none space-y-[5px] pl-0">
                      {item.steps.map((step) => (
                        <li key={step.n} className="flex gap-[8px] text-sm leading-[1.5] text-slate-600 dark:text-slate-300">
                          <StepBadge n={step.n} />
                          <span>{step.text}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-[8px] inline-flex items-center gap-[2px] text-sm font-semibold text-blue-600">
                      Hasil <span className="text-blue-600">→</span> {item.hasil}
                    </p>
                  </article>
                ))}
              </section>

              <section className="rounded-md border-l-2 border-[#2563eb] bg-[#eef4fb] px-[12px] py-[10px]">
                <div className="flex gap-[8px]">
                  <div className="flex shrink-0 items-center text-blue-600" aria-hidden="true">
                    <span role="img" aria-label="Info">ⓘ</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Penting untuk dipahami</p>
                    <p className="mt-[2px] text-sm leading-[1.55] text-slate-600 dark:text-slate-300">
                      Diterima berarti pengajuan tercatat, bukan disetujui. Diverifikasi berarti kelengkapan diperiksa; Diproses berarti ditindaklanjuti; Perlu dokumen meminta tindakan Anda; Selesai berarti hasil penanganan tersedia.
                    </p>
                  </div>
                </div>
              </section>

              <section id="pemecahan-masalah" className="mt-[8px]">
                <div className="mb-[12px] flex items-center gap-[6px]">
                  <h2 className="text-[14px] font-bold tracking-[-0.02em] text-slate-800 dark:text-slate-100">
                    Pemecahan masalah
                  </h2>
                </div>
                <p className="mb-[16px] text-sm leading-[1.5] text-slate-600 dark:text-slate-300">
                  Mulai dari gejala yang Anda temui, periksa penyebabnya, lalu eskalasi bila
                  kendala tetap terjadi.
                </p>

                {MASALAH.map((item) => (
                  <article
                    key={item.id}
                    id={item.id}
                    className="scroll-mt-[90px] mb-[20px] border-b border-slate-100 pb-[16px] last:mb-0 last:border-0 last:pb-0"
                  >
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{item.title}</h3>
                    <p className="mt-[4px] text-sm leading-[1.55] text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">Periksa &amp; atasi.</span>{" "}
                      {item.check}
                    </p>
                    <p className="mt-[6px] text-sm leading-[1.55] text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">Hubungi pengelola jika:</span>{" "}
                      {item.contact}
                    </p>
                  </article>
                ))}
              </section>

              <section id="bantuan-lanjutan" className="mt-[8px] rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-[16px] py-[18px] shadow-sm">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Masih membutuhkan bantuan?</h3>
                <p className="mt-[4px] text-sm leading-[1.6] text-slate-600 dark:text-slate-300">
                  Gunakan kanal bantuan yang tersedia di platform atau instansi. Sertakan ID
                  laporan, pengajuan, dataset, atau artikel yang terkait; waktu kejadian,
                  filter dan periode; serta tangkapan layar yang sudah disamarkan.
                </p>
                <p className="mt-[4px] text-sm leading-[1.6] text-slate-600 dark:text-slate-300">
                  Jangan kirim kata sandi, OTP, NIK penuh, atau dokumen pribadi melalui
                  saluran publik.
                </p>
              </section>

              <div className="mt-[20px]">
                <Link
                  href="/bantuan/cms-ruang-asn/cms-layanan-publik"
                  className="inline-flex items-center gap-[2px] text-sm font-medium text-blue-700 hover:underline"
                >
                  Panduan terkait: CMS Layanan Publik <ArrowRight className="h-[10px] w-[10px]" />
                </Link>
              </div>

              <nav aria-label="Navigasi artikel sebelumnya dan berikutnya" className="mt-[24px] grid grid-cols-2 gap-[12px]">
                <Link href="/bantuan/platform-publik/data-pemerintah" className="group flex flex-col gap-[2px] rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-[10px] py-[12px] transition-colors hover:bg-slate-50 dark:bg-slate-900">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 group-hover:text-blue-700">
                    Sebelumnya
                  </span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-700">
                    ← Data Pemerintah
                  </span>
                </Link>
                <Link href="/bantuan/platform-publik/lapor-warga" className="group flex flex-col gap-[2px] rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-[10px] py-[12px] transition-colors hover:bg-slate-50 dark:bg-slate-900">
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 group-hover:text-blue-700">
                    Berikutnya
                  </span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-700">
                    Lapor Warga →
                  </span>
                </Link>
              </nav>

              <footer className="mt-[30px] border-t border-slate-200 dark:border-slate-800 pt-[12px]">
                <p className="text-xs leading-[1.5] text-slate-500 dark:text-slate-400">
                  Panduan mengikuti rancangan platform dan ketersediaan fitur/hak akses
                  instansi, bukan layanan operasional. Ini adalah tampilan dokumentasi statis;
                  navigasi antarhalaman dan pencarian panduan tersedia.
                </p>
                <div className="mt-[10px] flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Agoraya · Pusat bantuan / Data Publik, Untuk Semua</span>
                  <span>Bahasa Indonesia</span>
                </div>
              </footer>
            </div>
          </main>

          <aside className="hidden xl:block">
            <TableOfContents />
          </aside>
        </div>
      </div>
    </div>
  );
}
