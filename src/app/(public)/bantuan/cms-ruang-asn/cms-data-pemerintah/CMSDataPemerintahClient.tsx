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
  Key,
  Lightbulb,
  Megaphone,

  ArrowRight,
  Wrench,
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
    id: "dataset-metadata",
    title: "Dataset & Metadata",
    siapkan: "Sumber data, definisi, cakupan, serta template bila akan impor.",
    steps: [
      {
        n: 1,
        text: "Buka Dataset & Metadata lalu tambah dataset atau pilih data yang akan diperbaiki. Isi judul, uraian, sumber, wilayah, periode, dan satuan sesuai kolom yang tersedia.",
      },
      {
        n: 2,
        text: "Jika impor CSV/JSON tersedia, gunakan template pada layar. Ikuti nama kolom, tipe nilai, dan kode yang ditentukan template; jangan mengubah struktur secara bebas.",
      },
      {
        n: 3,
        text: "Tinjau hasil input/impor dan pesan validasi. Periksa sampel nilai, lalu simpan dan teruskan untuk verifikasi sesuai kewenangan.",
      },
    ],
    hasil:
      "Dataset tersimpan dengan metadata dan struktur yang dapat diperiksa.",
  },
  {
    id: "anggaran-apbd",
    title: "Anggaran APBD",
    siapkan:
      "Dokumen sumber pagu dan realisasi untuk tahun serta periode yang sama.",
    steps: [
      {
        n: 1,
        text: "Buka Anggaran APBD. Pilih wilayah, tahun anggaran, dan periode pelaporan yang benar sebelum mengisi nilai.",
      },
      {
        n: 2,
        text: "Masukkan pagu serta realisasi sesuai satuan layar. Periksa rincian dan total; bedakan realisasi periode tunggal dari realisasi kumulatif.",
      },
      {
        n: 3,
        text: "Cocokkan angka dengan sumber. Jika ada revisi anggaran, jelaskan konteks pada kolom yang tersedia, lalu simpan untuk diperiksa.",
      },
    ],
    hasil:
      "Nilai APBD dapat ditelusuri ke sumber tanpa pencampuran satuan atau periode.",
  },
  {
    id: "proyek-pembangunan",
    title: "Proyek Pembangunan",
    siapkan:
      "Identitas proyek, penanggung jawab, lokasi, jadwal, dan bukti progres.",
    steps: [
      {
        n: 1,
        text: "Buka Proyek Pembangunan dan tambah atau sunting proyek. Periksa identitas, wilayah, instansi, anggaran, dan jadwal pada formulir.",
      },
      {
        n: 2,
        text: "Perbarui progres fisik dan realisasi keuangan secara terpisah berdasarkan bukti periode tersebut. Jangan menyalin persentase belanja menjadi progres pekerjaan.",
      },
      {
        n: 3,
        text: "Tinjau status, tahapan, tanggal pembaruan, serta sumber/bukti yang tersedia. Simpan perubahan dan ajukan pemeriksaan sesuai alur layar.",
      },
    ],
    hasil:
      "Progres proyek menggambarkan pekerjaan dan belanja sebagai dua ukuran berbeda.",
  },
  {
    id: "statistik-daerah",
    title: "Statistik Daerah",
    siapkan: "Definisi indikator, satuan, wilayah, periode, dan sumber.",
    steps: [
      {
        n: 1,
        text: "Buka Statistik Daerah. Pilih indikator yang sesuai atau isi definisinya pada kontrol yang tersedia agar tidak membuat indikator duplikat.",
      },
      {
        n: 2,
        text: "Isi nilai untuk kode wilayah dan periode yang benar. Pastikan skala, satuan, dan cara hitung konsisten dengan seri sebelumnya.",
      },
      {
        n: 3,
        text: "Cocokkan dengan sumber dan jelaskan perubahan definisi bila tersedia kolom catatan. Tinjau seri sebelum menyimpan untuk verifikasi.",
      },
    ],
    hasil:
      "Seri statistik konsisten dan perubahan metodologi tidak tersembunyi.",
  },
  {
    id: "verifikasi-publikasi",
    title: "Verifikasi & publikasi",
    siapkan:
      "Draf lengkap dan akun dengan peran pemeriksaan/persetujuan yang sesuai.",
    steps: [
      {
        n: 1,
        text: "Operator memeriksa ulang kelengkapan, sumber, satuan, kode wilayah, dan periode, lalu mengajukan pemeriksaan melalui kontrol layar.",
      },
      {
        n: 2,
        text: "Verifikator mencocokkan nilai serta metadata dengan sumber. Jika perlu koreksi, kembalikan dengan alasan yang spesifik melalui alur yang tersedia.",
      },
      {
        n: 3,
        text: "Approver meninjau hasil verifikasi dan pratinjau, lalu menyetujui publikasi sesuai kewenangan. Periksa tampilan publik dengan cakupan filter yang sama setelah terbit.",
      },
    ],
    hasil:
      "Data yang tampil publik telah melalui tahapan yang diizinkan oleh instansi.",
  },
];

const MASALAH: MasalahItem[] = [
  {
    id: "impor-gagal",
    title: "Impor gagal",
    check:
      "Unduh kembali template yang tersedia. Cocokkan format CSV/JSON, struktur, tipe nilai, dan kode dengan template. Periksa pesan validasi dan perbaiki baris yang ditandai sebelum mencoba ulang.",
    contact:
      "berkas sudah sesuai template namun tetap gagal; sertakan ID dataset, pesan/baris kesalahan, dan contoh yang bebas data sensitif.",
  },
  {
    id: "metadata-belum-lengkap",
    title: "Metadata belum lengkap",
    check:
      "Baca kolom wajib yang ditandai. Lengkapi definisi, satuan, sumber, periode, dan cakupan wilayah sesuai formulir; gunakan rujukan yang bisa diperiksa, bukan isian sekadar untuk melewati validasi.",
    contact:
      "metadata wajib sudah terisi tetapi belum lolos; kirim ID dataset dan kolom yang masih ditandai.",
  },
  {
    id: "total-realisasi-tidak-konsisten",
    title: "Total/realisasi tidak konsisten",
    check:
      "Periksa satuan, desimal, periode kumulatif, rincian dan total, serta versi pagu. Jangan mengubah angka hanya agar cocok; rekonsiliasi dengan sumber dan dokumentasikan koreksinya.",
    contact:
      "sumber/rincian tetap bertentangan atau validasi menolak angka terkonfirmasi; libatkan verifikator dengan ID dan periode terkait.",
  },
  {
    id: "belum-tampil-publik",
    title: "Belum tampil publik",
    check:
      "Periksa apakah data masih draf, dikembalikan, menunggu verifikasi, atau persetujuan. Setelah publikasi yang diizinkan, samakan filter publik, wilayah, periode, dan cakupan dataset.",
    contact:
      "data berstatus terbit tetapi tidak ditemukan pada cakupan yang sesuai; sertakan ID, waktu publikasi, dan filter publik.",
  },
  {
    id: "akses-ditolak",
    title: "Akses ditolak",
    check:
      "Pastikan akun, peran, dan cakupan instansi benar. Tombol pemeriksaan atau persetujuan hanya tersedia sesuai kewenangan; jangan memakai akun petugas lain.",
    contact:
      "tugas resmi membutuhkan akses yang belum diberikan; minta administrator meninjau peran dengan nama modul dan tindakan yang diperlukan.",
  },
];

const sidebarItems = [
  {
    title: "Data Pemerintah",
    icon: Database,
    href: "/bantuan/platform-publik/data-pemerintah",
  },
  {
    title: "Layanan Publik",
    icon: FileText,
    href: "/bantuan/platform-publik/layanan-publik",
  },
  {
    title: "Lapor Warga",
    icon: Megaphone,
    href: "/bantuan/platform-publik/lapor-warga",
  },
  {
    title: "Insight",
    icon: Lightbulb,
    href: "/bantuan/platform-publik/insight",
  },
];

function SearchBox({ compact = false }: { compact?: boolean }) {
  return <HelpSearch compact={compact} />;
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-blue-50 px-1 text-sm font-semibold text-blue-700">
      {n}
    </span>
  );
}

export default function CMSDataPemerintahArticlePage() {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Agoraya — Beranda"
          className="flex h-7 w-[110px] shrink-0 items-center border-r border-slate-200 dark:border-slate-800 pr-3"
        >
          <Image
            src="/logo/logo-light.svg"
            alt="Agoraya"
            width={189}
            height={42}
            priority
            className="h-auto w-full"
          />
        </Link>
<span className="ml-3 text-base font-medium text-slate-600 dark:text-slate-300">Pusat bantuan</span>
        <div className="absolute left-[calc(50%+48px)] hidden -translate-x-1/2 md:block">
          <SearchBox compact />
        </div>
        <Link
          href="/"
          className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline"
        >
          <span className="hidden sm:inline">Kembali ke platform</span>{" "}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
        <button
          className="ml-2 flex h-10 w-10 items-center justify-center rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100"
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Buka menu navigasi"
        >
          <span className="relative inline-block h-0.5 w-5 bg-slate-800">
            <span className="absolute -top-1.5 left-0 h-0.5 w-5 bg-slate-800" />
            <span className="absolute top-1.5 left-0 h-0.5 w-5 bg-slate-800" />
          </span>
        </button>
      </header>

      <aside
        className="fixed top-14 bottom-0 left-0 hidden w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 md:block"
        aria-label="Navigasi bantuan"
      >
        <nav className="h-full overflow-y-auto px-4 pt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Dokumentasi
          </p>
          <Link
            href="/bantuan"
            className="flex h-9 items-center gap-2 rounded-md px-2.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            <Home className="h-4 w-4" aria-hidden="true" /> Beranda
          </Link>

          <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Platform publik
          </p>
          <div className="space-y-1">
            {sidebarItems.map(({ title, icon: Icon, href }) => (
              <Link
                key={title}
                href={href}
                className="flex h-9 items-center gap-2 rounded-md px-2.5 text-sm text-slate-700 hover:bg-slate-100"
              >
                <Icon
                  className="h-4 w-4 text-blue-700"
                  aria-hidden="true"
                />
                <span className="flex-1">{title}</span>
                <ChevronRight
                  className="h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>

          <p className="mt-[10px] mb-[5px] text-xs font-semibold tracking-[0.04em] text-slate-500 dark:text-slate-400 uppercase">
            CMS · Ruang ASN
          </p>
          <div className="space-y-[2px]">
            <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-800">
              <Link
                href="/bantuan/cms-ruang-asn/cms-data-pemerintah"
                className="flex h-[22px] items-center gap-[6px] rounded px-[6px] text-xs text-slate-700 hover:bg-slate-100"
              >
                <FileText
                  className="h-[9px] w-[9px] text-blue-700"
                  aria-hidden="true"
                />
                <span className="flex-1">CMS Data Pemerintah</span>
                <ChevronRight
                  className="h-[8px] w-[8px] text-blue-700"
                  aria-hidden="true"
                />
              </Link>
              <div className="border-t border-slate-100 bg-white dark:bg-slate-950/50">
                <div className="space-y-0">
                  <p className="mx-[6px] my-[1px] text-xs font-semibold tracking-tighter text-slate-500 dark:text-slate-400 uppercase">
                    Cara kerja
                  </p>
                  <div className="space-y-[1px]">
                    {CARA_KERJA.map((item, i) => (
                      <Link
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block rounded py-[2px] pr-[6px] pl-[20px] text-xs ${
                          i === 0
                            ? "bg-[#eef4fb] font-semibold text-blue-700"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900 hover:text-slate-800 dark:text-slate-100"
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById(item.id);
                          el?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }}
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                  <p className="mx-[6px] my-[3px] text-xs font-semibold tracking-tighter text-slate-500 dark:text-slate-400 uppercase">
                    Pemecahan masalah
                  </p>
                  <div className="space-y-[1px]">
                    {MASALAH.map((item) => (
                      <Link
                        key={item.id}
                        href={`#${item.id}`}
                        className="block rounded py-[2px] pr-[6px] pl-[20px] text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900 hover:text-slate-800 dark:text-slate-100"
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById(item.id);
                          el?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }}
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-[12px] space-y-[7px] border-t border-slate-200 dark:border-slate-800 pt-[9px]">
            <Link
              href="#akun-privasi"
              className="block text-xs text-slate-500 dark:text-slate-400 hover:text-blue-700"
            >
              Akun & perlindungan privasi
            </Link>
            <Link
              href="#bantuan-lanjutan"
              className="block text-xs text-slate-500 dark:text-slate-400 hover:text-blue-700"
            >
              Menghubungi pengelola
            </Link>
          </div>
        </nav>
      </aside>

      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      <div className="mx-auto max-w-[1120px] px-4 pt-[70px] pb-8 md:ml-64 md:px-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
          <main className="w-full" aria-label="Konten artikel">
            <a href="#main-content" className="sr-only focus:not-sr-only">
              Lompat ke konten utama
            </a>

        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"
        >
              <Link
                href="/bantuan"
                className="hover:text-blue-700 hover:underline"
              >
                Pusat bantuan
              </Link>
              <ChevronRight className="h-4 w-4 text-slate-400" />
              <span className="px-1 text-slate-400">/</span>
              <Link
                href="/bantuan/cms-ruang-asn"
                className="hover:text-blue-700 hover:underline"
              >
                CMS · Ruang ASN
              </Link>
              <span className="px-1 text-slate-400">/</span>
              <span className="font-medium text-slate-700">
                CMS Data Pemerintah
              </span>
            </nav>

            <div className="flex flex-col gap-6" id="main-content">
              <header className="mb-2">
                <p className="text-xs font-bold tracking-widest text-blue-700">
                  CMS · RUANG ASN
                </p>
                <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-slate-800 dark:text-slate-100 sm:text-5xl">
                  CMS Data Pemerintah
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  Panduan pengelolaan Dataset, Anggaran APBD, Proyek Pembangunan, dan
                  Statistik Daerah beserta alur verifikasi dan publikasi.
                </p>
              </header>

              <section
                id="sebelum-mulai"
                className="rounded-md border-l-2 border-[#2563eb] bg-[#eef4fb] px-[12px] py-[10px]"
              >
                <div className="flex gap-[8px]">
                  <div
                    className="flex shrink-0 items-center text-blue-600"
                    aria-hidden="true"
                  >
                    <span role="img" aria-label="Info">
                      ⓘ
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Sebelum mulai
                    </p>
                    <p className="mt-[2px] text-sm leading-[1.55] text-slate-600 dark:text-slate-300">
                      Gunakan akun ASN dengan cakupan instansi yang tepat.
                      Siapkan sumber yang dapat ditelusuri. Operator mengisi;
                      Verifikator memeriksa; Approver menyetujui publikasi
                      sesuai hak akses dan kontrol yang tersedia.
                    </p>
                  </div>
                </div>
              </section>

              <section id="cara-kerja" className="mt-[8px]">
                <div className="mb-[12px] flex items-center gap-[6px]">
                  <Key
                    className="h-[14px] w-[14px] shrink-0 text-blue-600"
                    aria-hidden="true"
                  />
                  <h2 className="text-[14px] font-bold tracking-[-0.02em] text-slate-800 dark:text-slate-100">
                    Cara kerja
                  </h2>
                </div>
                <p className="mb-[16px] text-sm leading-[1.5] text-slate-600 dark:text-slate-300">
                  Ikuti langkah-langkah bernomor untuk setiap fitur. Setiap
                  tahap dilengkapi dengan konteks siapan dan hasil yang dapat
                  diharapkan.
                </p>

                {CARA_KERJA.map((item) => (
                  <article
                    key={item.id}
                    id={item.id}
                    className="mb-[20px] scroll-mt-[90px] border-b border-slate-100 pb-[16px] last:mb-0 last:border-0 last:pb-0"
                  >
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                      {item.title}
                    </h3>
                    <p className="mt-[3px] text-sm text-slate-500 dark:text-slate-400">
                      Siapkan: {item.siapkan}
                    </p>
                    <ol className="mt-[8px] list-none space-y-[5px] pl-0">
                      {item.steps.map((step) => (
                        <li
                          key={step.n}
                          className="flex gap-[8px] text-sm leading-[1.5] text-slate-600 dark:text-slate-300"
                        >
                          <StepBadge n={step.n} />
                          <span>{step.text}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-[8px] inline-flex items-center gap-[2px] text-sm font-semibold text-blue-600">
                      Hasil <span className="text-blue-600">→</span>{" "}
                      {item.hasil}
                    </p>
                  </article>
                ))}
              </section>

              <section className="rounded-md border-l-2 border-[#2563eb] bg-[#eef4fb] px-[12px] py-[10px]">
                <div className="flex gap-[8px]">
                  <div
                    className="flex shrink-0 items-center text-blue-600"
                    aria-hidden="true"
                  >
                    <span role="img" aria-label="Info">
                      ⓘ
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Penting untuk dipahami
                    </p>
                    <p className="mt-[2px] text-sm leading-[1.55] text-slate-600 dark:text-slate-300">
                      Periksa satuan, kode wilayah, periode, dan sumber sebelum
                      meneruskan data. Simpan perubahan sebagai draf sesuai
                      kontrol layar; penyimpanan atau verifikasi tidak otomatis
                      berarti data sudah terbit ke publik.
                    </p>
                  </div>
                </div>
              </section>

              <section id="pemecahan-masalah" className="mt-[8px]">
                <div className="mb-[12px] flex items-center gap-[6px]">
                  <Wrench
                    className="h-[14px] w-[14px] shrink-0 text-blue-600"
                    aria-hidden="true"
                  />
                  <h2 className="text-[14px] font-bold tracking-[-0.02em] text-slate-800 dark:text-slate-100">
                    Pemecahan masalah
                  </h2>
                </div>
                <p className="mb-[16px] text-sm leading-[1.5] text-slate-600 dark:text-slate-300">
                  Mulai dari gejala yang Anda temui, periksa penyebabnya, lalu
                  eskalasi bila kendala tetap terjadi.
                </p>

                {MASALAH.map((item) => (
                  <article
                    key={item.id}
                    id={item.id}
                    className="mb-[20px] scroll-mt-[90px] border-b border-slate-100 pb-[16px] last:mb-0 last:border-0 last:pb-0"
                  >
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                      {item.title}
                    </h3>
                    <p className="mt-[4px] text-sm leading-[1.55] text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        Periksa &amp; atasi.
                      </span>{" "}
                      {item.check}
                    </p>
                    <p className="mt-[6px] text-sm leading-[1.55] text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        Hubungi pengelola jika:
                      </span>{" "}
                      {item.contact}
                    </p>
                  </article>
                ))}
              </section>

              <section
                id="bantuan-lanjutan"
                className="mt-[8px] rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-[16px] py-[18px] shadow-sm"
              >
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  Masih membutuhkan bantuan?
                </h3>
                <p className="mt-[4px] text-sm leading-[1.6] text-slate-600 dark:text-slate-300">
                  Gunakan kanal bantuan yang tersedia di platform atau instansi.
                  Sertakan ID laporan, pengajuan, dataset, atau artikel yang
                  terkait; waktu kejadian, filter dan periode; serta tangkapan
                  layar yang sudah disamarkan.
                </p>
                <p className="mt-[4px] text-sm leading-[1.6] text-slate-600 dark:text-slate-300">
                  Jangan kirim kata sandi, OTP, NIK penuh, atau dokumen pribadi
                  melalui saluran publik.
                </p>
              </section>

              <div className="mt-[20px]">
                <Link
                  href="/bantuan/platform-publik/data-pemerintah"
                  className="inline-flex items-center gap-[2px] text-sm font-medium text-blue-700 hover:underline"
                >
                  Panduan terkait: Data Pemerintah{" "}
                  <ArrowRight className="h-[10px] w-[10px]" />
                </Link>
              </div>

              <nav
                aria-label="Navigasi artikel sebelumnya dan berikutnya"
                className="mt-[24px] grid grid-cols-2 gap-[12px]"
              >
                <Link
                  href="/bantuan/platform-publik/insight"
                  className="group flex flex-col gap-[2px] rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-[10px] py-[12px] transition-colors hover:bg-slate-50 dark:bg-slate-900"
                >
                  <span className="text-xs font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 uppercase group-hover:text-blue-700">
                    Sebelumnya
                  </span>
                  <span className="flex items-center gap-[2px] text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-700">
                    ← Insight
                    <span className="rounded-md bg-blue-50 px-[6px] py-[0.5] text-xs font-semibold text-blue-700">
                      Platform Publik
                    </span>
                  </span>
                </Link>
                <Link
                  href="/bantuan/cms-ruang-asn/cms-layanan-publik"
                  className="group flex flex-col gap-[2px] rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-[10px] py-[12px] transition-colors hover:bg-slate-50 dark:bg-slate-900"
                >
                  <span className="text-xs font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 uppercase group-hover:text-blue-700">
                    Berikutnya
                  </span>
                  <span className="flex items-center gap-[2px] text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-700">
                    CMS Layanan Publik{" "}
                    <ArrowRight className="h-[10px] w-[10px]" />
                  </span>
                </Link>
              </nav>

              <footer className="mt-10 border-t border-slate-200 dark:border-slate-800 pt-6">
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Panduan mengikuti rancangan platform dan ketersediaan fitur/hak
                  akses instansi, bukan layanan operasional. Ini adalah tampilan
                  dokumentasi panduan; navigasi antarhalaman dan pencarian panduan tersedia.
                </p>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">
                    Agoraya · Pusat bantuan
                  </span>
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
