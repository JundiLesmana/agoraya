"use client";

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
  Search,
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
    id: "ringkasan-filter",
    title: "Ringkasan & filter",
    siapkan: "Wilayah, tahun anggaran, dan periode kumulatif yang ingin dipilih.",
    steps: [
      {
        n: 1,
        text: "Buka Data Pemerintah dan mulai dari Ringkasan. Pilih wilayah, tahun anggaran, serta periode kumulatif sesuai kebutuhan.",
      },
      {
        n: 2,
        text: "Pilih terapan filter. Periksa kontes filter yang tampil sebelum membaca kartu ringkasan dan grafik.",
      },
      {
        n: 3,
        text: "Jika cakupan terlalu sempit, gunakan Reset filter lalu terapkan pilihan yang lebih luas. Catat tanggal pembaruan dan sumbernya.",
      },
    ],
    hasil: "Ringkasan dicapai dalam cakupan wilayah dan waktu yang jelas.",
  },
  {
    id: "anggaran-apbd",
    title: "Anggaran APBD",
    siapkan: "Cakupan filter yang sudah diterapkan dan satuan nilai anggaran.",
    steps: [
      {
        n: 1,
        text: "Buka bagian Anggaran. Bedakan pagu APBD tahun berjalan dengan realisasi sampai periode yang dipilih.",
      },
      {
        n: 2,
        text: "Baca legenda, sumbu, dan satuan: ribuan, juta, miliar, atau triliun. Pastikan grafik bersifat bulanan atau kumulatif sebelum membandingkannya.",
      },
      {
        n: 3,
        text: "Bandingkan sektor dan periode yang sejenis. Buka sumber atau metadata untuk memahami definisi angka dan tanggal pembaruannya.",
      },
    ],
    hasil: "Pagu, realisasi, dan persentase pencapaian tidak tertukar.",
  },
  {
    id: "proyek-pembangunan",
    title: "Proyek pembangunan",
    siapkan: "Nama proyek, instansi, atau wilayah yang ingin ditelusuri.",
    steps: [
      {
        n: 1,
        text: "Buka Proyek dan gunakan pencarian atau filter status yang tersedia. Pilih Detail pada proyek yang sesuai.",
      },
      {
        n: 2,
        text: "Periksa instansi penanggung jawab, lokasi, jadwal, anggaran, dan realisasi keuangan. Baca progres fisik secara terpisah.",
      },
      {
        n: 3,
        text: "Baca tahapan pelaksanaan serta waktu pembaruan. Bila ada tautan dataset proyek, cek cakupan dan periodenya dengan detail proyek.",
      },
    ],
    hasil: "Anda memahami kemajuan pekerjaan tanpa menyarankan dengan presentase belanja.",
  },
  {
    id: "statistik-daerah",
    title: "Statistik daerah",
    siapkan: "Indikator yang sama untuk wilayah atau tahun pembanding.",
    steps: [
      {
        n: 1,
        text: "Buka Statistik daerah dan pilih indikator yang tersedia. Perhatikan definisi, satuan, serta periode rujukan.",
      },
      {
        n: 2,
        text: "Bandingkan nilai dalam indikator yang sama. Jangan membandingkan panjang grafik dari indikator yang berbeda skala.",
      },
      {
        n: 3,
        text: "Baca sumber dan catatan metodologi. Statistik tahunan tidak selalu memiliki periode yang sama dengan ringkasan APBD kumulatif.",
      },
    ],
    hasil: "Perbandingan indikator memiliki dasar pengukuran yang setara.",
  },
  {
    id: "dataset-unduhan",
    title: "Dataset & unduhan",
    siapkan: "Dataset yang sesuai dengan kebutuhan analisis.",
    steps: [
      {
        n: 1,
        text: "Buka katalog atau tautan dataset terkait. Periksa judul, cakupan wilayah, periode, sumber, satuan, dan tanggal pembaruan metadata.",
      },
      {
        n: 2,
        text: "Pilih format unduhan yang memang ditawarkan pada dataset tersebut. Jangan menganggap CSV, JSON, PDF, atau API selalu tersedia.",
      },
      {
        n: 3,
        text: "Unduh, buka berkas, lalu cek cakupan judul dan periode dengan metadata. Simpan informasi sumber saat mengutip atau mengolah data.",
      },
    ],
    hasil: "Berkas dan kontes sumber tersedia untuk analisis lanjutan.",
  },
];

const MASALAH: MasalahItem[] = [
  {
    id: "data-kosong",
    title: "Data kosong",
    check:
      "Periksa wilayah, tahun, dan periode aktif. Reset filter lalu pilih satu pilihan secara bertahap dan terapkan filter. Data kosong tidak berarti nilai nol.",
    contact:
      "Cakupan yang dicantumkan pada metadata seharusnya tersedia tetapi hasil tetap kosong; sertakan nama dataset dan filter yang digunakan.",
  },
  {
    id: "angka-berbeda",
    title: "Angka berbeda",
    check:
      "Samakan periode kumulatif atau bulanan, satuan, wilayah, sumber, dan tanggal pembaruan. Pastikan yang dibandingkan sama-sama pagu, realisasi, atau indikator yang sejenis.",
    contact:
      "Perbedaan tetap ada setelah seluruh definisi dan cakupan disamakan; lampirkan tangkapan layar sumbernya.",
  },
  {
    id: "unduhan-gagal",
    title: "Unduhan gagal",
    check:
      "Pastikan format dipilih dari opsi yang tersedia, koneksi stabil, dan unduhan tidak diblokir peramban. Coba ulang dari detail dataset, lalu periksa apakah berkas dapat dibuka.",
    contact:
      "Berkas tetap gagal diunduh atau rusak; sertakan ID dataset, format, waktu percobaan, dan pesan kesalahan.",
  },
];
const sidebarItems = [
  { title: "Data Pemerintah", icon: Database, href: "/bantuan/platform-publik/data-pemerintah" },
  { title: "Layanan Publik", icon: FileText, href: "/bantuan/layanan-publik" },
  { title: "Lapor Warga", icon: Megaphone, href: "/bantuan/lapor-warga" },
  { title: "Insight", icon: Lightbulb, href: "/bantuan/insight" },
];

function SearchBox({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative flex h-[30px] items-center rounded-md border border-slate-200 bg-white ${
        compact ? "w-[245px]" : "w-full"
      }`}
    >
      <Search className="ml-2 h-[11px] w-[11px] shrink-0 text-blue-600" aria-hidden="true" />
      <input
        aria-label="Cari panduan"
        className="h-full min-w-0 flex-1 border-0 bg-transparent px-2 text-[8px] text-slate-700 outline-none placeholder:text-slate-400"
        placeholder="Cari panduan, topik, atau kendala..."
      />
      <button className="h-full px-2 text-[7px] text-slate-500 hover:text-blue-700" type="button">
        Cari
      </button>
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span
      className="inline-flex items-center justify-center h-[18px] min-w-[18px] rounded-full bg-blue-50 px-1 text-[10px] font-semibold text-blue-700 shrink-0"
    >
      {n}
    </span>
  );
}

export default function DataPemerintahArticlePage() {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="fixed inset-x-0 top-0 z-30 flex h-[47px] items-center border-b border-slate-200 bg-white px-4">
        <Link
          href="/"
          aria-label="Agoraya — Beranda"
          className="flex h-[24px] w-[94px] shrink-0 items-center border-r border-slate-200 pr-2"
        >
          <Image src="/logo/logo-light.svg" alt="Agoraya" width={189} height={42} priority className="h-auto w-full" />
        </Link>
        <span className="ml-3 text-[8px] text-slate-600">Pusat bantuan</span>
        <div className="absolute left-[calc(50%+40px)] hidden -translate-x-1/2 md:block">
          <SearchBox compact />
        </div>
        <Link
          href="/"
          className="ml-auto inline-flex items-center gap-1 text-[8px] font-medium text-blue-700 hover:underline"
        >
          Kembali ke platform <ArrowUpRight className="h-[9px] w-[9px]" />
        </Link>
        <button
          className="ml-4 hidden md:flex items-center justify-center h-[47px] w-[47px] rounded-full text-slate-600 hover:bg-slate-100"
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
        className="fixed bottom-0 left-0 top-[47px] hidden w-36 border-r border-slate-200 bg-slate-50 md:block"
        aria-label="Navigasi bantuan"
      >
        <nav className="px-[10px] pt-[14px]">
          <p className="mb-[9px] text-[6px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Dokumentasi
          </p>
          <Link
            href="/bantuan"
            className="flex h-[20px] items-center gap-[6px] rounded bg-blue-100 px-[6px] text-[8px] font-medium text-blue-800"
          >
            <Home className="h-[9px] w-[9px]" aria-hidden="true" /> Beranda
          </Link>

          <p className="mb-[5px] mt-[13px] text-[6px] font-semibold uppercase tracking-[0.06em] text-slate-500">
            Platform publik
          </p>
          <div className="space-y-[2px]">
            {sidebarItems.map(({ title, icon: Icon, href }) => {
              const isActivePillar = title === "Data Pemerintah";
              return (
                <div key={title} className="border border-slate-200 rounded-md overflow-hidden">
                  <Link
                    href={href}
                    className="flex h-[22px] items-center gap-[6px] rounded px-[6px] text-[7px] text-slate-700 hover:bg-slate-100"
                  >
                    <Icon className="h-[9px] w-[9px] text-blue-700" aria-hidden="true" />
                    <span className="flex-1">{title}</span>
                    <ChevronRight className="h-[8px] w-[8px] text-blue-700" aria-hidden="true" />
                  </Link>
                  {isActivePillar && (
                    <div className="border-t border-slate-100 bg-white/50">
                      <div className="space-y-0">
                        <p className="mx-[6px] my-[1px] text-[6px] font-semibold uppercase tracking-tighter text-slate-500">
                          Cara kerja
                        </p>
                        <div className="space-y-[1px]">
                          {CARA_KERJA.map((item, i) => (
                            <Link
                              key={item.id}
                              href={`#${item.id}`}
                              className={`block pl-[20px] pr-[6px] py-[2px] rounded text-[7px] ${
                                i === 0
                                  ? "bg-[#eef4fb] text-blue-700 font-semibold"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
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
                        <p className="mx-[6px] my-[3px] text-[6px] font-semibold uppercase tracking-tighter text-slate-500">
                          Pemecahan masalah
                        </p>
                        <div className="space-y-[1px]">
                          {MASALAH.map((item, i) => (
                            <Link
                              key={item.id}
                              href={`#${item.id}`}
                              className={`block pl-[20px] pr-[6px] py-[2px] rounded text-[7px] ${
                                i === 0
                                  ? "bg-[#eef4fb] text-blue-700 font-semibold"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
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

          <p className="mb-[5px] mt-[10px] text-[6px] font-semibold uppercase tracking-[0.04em] text-slate-500">
            CMS · Ruang ASN
          </p>
          <div className="space-y-[2px]">
            <Link
              href="/bantuan/cms-data-pemerintah"
              className="flex h-[22px] items-center gap-[6px] rounded px-[6px] text-[7px] text-slate-700 hover:bg-slate-100"
            >
              <FileText className="h-[9px] w-[9px] text-blue-700" aria-hidden="true" />
              <span className="flex-1">CMS Data Pemerintah</span>
              <ChevronRight className="h-[8px] w-[8px] text-blue-700" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-[12px] space-y-[7px] border-t border-slate-200 pt-[9px]">
            <Link href="#akun-privasi" className="block text-[7px] text-slate-500 hover:text-blue-700">
              Akun & perlindungan privasi
            </Link>
            <Link href="#bantuan-lanjutan" className="block text-[7px] text-slate-500 hover:text-blue-700">
              Menghubungi pengelola
            </Link>
          </div>
        </nav>
      </aside>

      <MobileDrawer isOpen={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />

      <div className="mx-auto max-w-[1120px] px-4 pb-8 pt-[70px] md:ml-36 md:px-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
          <main className="w-full" aria-label="Konten artikel">
            <a href="#main-content" className="sr-only focus:not-sr-only">
              Lompat ke konten utama
            </a>

            <nav aria-label="Breadcrumb" className="mb-[16px] text-[10px] text-slate-500">
              <Link href="/bantuan" className="hover:text-blue-700 hover:underline">
                Pusat bantuan
              </Link>
              <span className="px-1 text-slate-400">/</span>
              <Link href="/bantuan/platform-publik" className="hover:text-blue-700 hover:underline">
                Platform publik
              </Link>
              <span className="px-1 text-slate-400">/</span>
              <span className="font-medium text-slate-700">Data Pemerintah</span>
            </nav>

            <div className="flex flex-col gap-[20px]" id="main-content">
              <div className="flex flex-col gap-[6px]">
                <span className="inline-flex items-center gap-[4px] rounded-md bg-[#eef4fb] px-[10px] py-[4px] text-[10px] font-semibold tracking-[0.12em] text-blue-700 uppercase">
                  PANDUAN WARGA
                </span>
                <h1 className="mt-[4px] text-[42px] font-bold leading-[0.96] tracking-[-0.04em] text-slate-800">
                  Data Pemerintah
                </h1>
                <p className="mt-[10px] max-w-[700px] text-[15px] leading-[1.7] text-slate-600">
                  Temukan data yang relevan, baca konteks anggaran dan proyek, lalu gunakan
                  dataset dengan satu seta periode yang tepat. Halaman ini menjelaskan cara
                  kerja setiap fitur Data Pemerintah, langkah pemecahan masalah umum, dan
                  konteks penting sebelum mulai.
                </p>
                <p className="mt-[8px] text-[12px] leading-[1.5] text-slate-500">
                  5 topik cara kerja · 3 pemecahan masalah
                </p>
              </div>

              <section id="sebelum-mulai" className="rounded-md border-l-2 border-[#2563eb] bg-[#eef4fb] px-[12px] py-[10px]">
                <div className="flex gap-[8px]">
                  <div className="flex shrink-0 items-center text-blue-600" aria-hidden="true">
                    <span role="img" aria-label="Info">ⓘ</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold text-slate-800">Sebelum mulai</p>
                    <p className="mt-[2px] text-[9px] leading-[1.55] text-slate-600">
                      Tentukan wilayah dan periode yang ingin dilihat. Data yang tersedia
                      dapat berbeda antarwilayah dan sumber; tidak semua dataset menyediakan
                      format unduhan yang sama.
                    </p>
                  </div>
                </div>
              </section>

              <section id="cara-kerja" className="mt-[8px]">
                <div className="mb-[12px] flex items-center gap-[6px]">
                  <h2 className="text-[14px] font-bold tracking-[-0.02em] text-slate-800">
                    Cara kerja
                  </h2>
                </div>
                <p className="mb-[16px] text-[10px] leading-[1.5] text-slate-600">
                  Ikuti langkah-langkah bernomor untuk setiap fitur. Setiap tahap dilengkapi
                  dengan konteks siapan dan hasil yang dapat diharapkan.
                </p>

                {CARA_KERJA.map((item) => (
                  <article
                    key={item.id}
                    id={item.id}
                    className="scroll-mt-[90px] mb-[20px] border-b border-slate-100 pb-[16px] last:mb-0 last:border-0 last:pb-0"
                  >
                    <h3 className="text-[11px] font-semibold text-slate-800">{item.title}</h3>
                    <p className="mt-[3px] text-[9px] text-slate-500">Siapkan: {item.siapkan}</p>
                    <ol className="mt-[8px] list-none space-y-[5px] pl-0">
                      {item.steps.map((step) => (
                        <li key={step.n} className="flex gap-[8px] text-[9px] leading-[1.5] text-slate-600">
                          <StepBadge n={step.n} />
                          <span>{step.text}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-[8px] inline-flex items-center gap-[2px] text-[9px] font-semibold text-blue-600">
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
                    <p className="text-[9px] font-semibold text-slate-800">Penting untuk dipahami</p>
                    <p className="mt-[2px] text-[9px] leading-[1.55] text-slate-600">
                      Pagu adalah anggaran yang disetujui; realisasi adalah nilai yang telah
                      dicairkan pada periode tertentu. Progres fisik proyek bukanlah realisasi
                      keuangan. Angka contoh pada rancangan bukan data riil aktual.
                    </p>
                  </div>
                </div>
              </section>

              <section id="pemecahan-masalah" className="mt-[8px]">
                <div className="mb-[12px] flex items-center gap-[6px]">
                  <h2 className="text-[14px] font-bold tracking-[-0.02em] text-slate-800">
                    Pemecahan masalah
                  </h2>
                </div>
                <p className="mb-[16px] text-[10px] leading-[1.5] text-slate-600">
                  Mulai dari gejala yang Anda temui, periksa penyebabnya, lalu eskalasi bila
                  kendala tetap terjadi.
                </p>

                {MASALAH.map((item) => (
                  <article
                    key={item.id}
                    id={item.id}
                    className="scroll-mt-[90px] mb-[20px] border-b border-slate-100 pb-[16px] last:mb-0 last:border-0 last:pb-0"
                  >
                    <h3 className="text-[11px] font-semibold text-slate-800">{item.title}</h3>
                    <p className="mt-[4px] text-[10px] leading-[1.55] text-slate-600">
                      <span className="font-semibold text-slate-800">Periksa &amp; atasi.</span>{" "}
                      {item.check}
                    </p>
                    <p className="mt-[6px] text-[10px] leading-[1.55] text-slate-600">
                      <span className="font-semibold text-slate-800">Hubungi pengelola jika:</span>{" "}
                      {item.contact}
                    </p>
                  </article>
                ))}
              </section>

              <section id="bantuan-lanjutan" className="mt-[8px] rounded-md border border-slate-200 bg-white px-[16px] py-[18px] shadow-sm">
                <h3 className="text-[11px] font-semibold text-slate-800">Masih membutuhkan bantuan?</h3>
                <p className="mt-[4px] text-[10px] leading-[1.6] text-slate-600">
                  Gunakan kanal bantuan yang tersedia di platform atau instansi. Sertakan ID
                  laporan, pengajuan, dataset, atau artikel yang terkait; waktu kejadian,
                  filter dan periode; serta tangkapan layar yang sudah disamarkan.
                </p>
                <p className="mt-[4px] text-[10px] leading-[1.6] text-slate-600">
                  Jangan kirim kata sandi, OTP, NIK penuh, atau dokumen pribadi melalui
                  saluran publik.
                </p>
              </section>

              <div className="mt-[20px]">
                <Link
                  href="/bantuan/cms-data-pemerintah"
                  className="inline-flex items-center gap-[2px] text-[10px] font-medium text-blue-700 hover:underline"
                >
                  Panduan terkait: CMS Data Pemerintah <ArrowRight className="h-[10px] w-[10px]" />
                </Link>
              </div>

              <nav aria-label="Navigasi artikel sebelumnya dan berikutnya" className="mt-[24px] grid grid-cols-2 gap-[12px]">
                <Link href="/bantuan" className="group flex flex-col gap-[2px] rounded-md border border-slate-200 bg-white px-[10px] py-[12px] transition-colors hover:bg-slate-50">
                  <span className="text-[8px] font-semibold uppercase tracking-[0.08em] text-slate-500 group-hover:text-blue-700">
                    Sebelumnya
                  </span>
                  <span className="text-[10px] font-semibold text-slate-800 group-hover:text-blue-700">
                    ← Beranda
                  </span>
                </Link>
                <Link href="/bantuan/layanan-publik" className="group flex flex-col gap-[2px] rounded-md border border-slate-200 bg-white px-[10px] py-[12px] transition-colors hover:bg-slate-50">
                  <span className="text-[8px] font-semibold uppercase tracking-[0.08em] text-slate-500 group-hover:text-blue-700">
                    Berikutnya
                  </span>
                  <span className="text-[10px] font-semibold text-slate-800 group-hover:text-blue-700">
                    Layanan Publik →
                  </span>
                </Link>
              </nav>

              <footer className="mt-[30px] border-t border-slate-200 pt-[12px]">
                <p className="text-[8px] leading-[1.5] text-slate-500">
                  Panduan mengikuti rancangan platform dan ketersediaan fitur/hak akses
                  instansi, bukan layanan operasional. Ini adalah tampilan dokumentasi statis;
                  navigasi dan pencarian tidak diaktifkan.
                </p>
                <div className="mt-[10px] flex items-center justify-between text-[8px] text-slate-600">
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
