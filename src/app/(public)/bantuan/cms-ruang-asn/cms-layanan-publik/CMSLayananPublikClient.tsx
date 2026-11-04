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
    id: "antrean-pengajuan",
    title: "Antrean Pengajuan",
    siapkan: "Unit kerja dan jenis layanan dalam cakupan akun.",
    steps: [
      {
        n: 1,
        text: "Buka Antrean Pengajuan. Cari nomor tiket atau gunakan filter status, jenis layanan, tanggal, dan prioritas SLA yang tersedia; periksa cakupan unit aktif.",
      },
      {
        n: 2,
        text: "Buka detail sebelum Ambil, Asignasikan, atau Alihkan petugas. Periksa kesesuaian tugas, petugas tujuan, dan kewenangan akun; tambahkan instruksi internal yang relevan.",
      },
      {
        n: 3,
        text: "Konfirmasikan penugasan melalui kontrol layar. Periksa penanggung jawab dan riwayat, lalu pantau target per jenis layanan untuk menentukan tindak lanjut.",
      },
    ],
    hasil:
      "Pengajuan berada pada petugas yang tepat dengan perubahan penugasan yang dapat ditelusuri.",
  },
  {
    id: "standar-formulir-layanan",
    title: "Standar & Formulir Layanan",
    siapkan: "Persyaratan dan standar waktu yang disahkan untuk layanan terkait.",
    steps: [
      {
        n: 1,
        text: "Buka Standar & Formulir Layanan, lalu pilih jenis layanan. Periksa persyaratan, kolom formulir, lampiran, dan standar waktu yang berlaku.",
      },
      {
        n: 2,
        text: "Jika diizinkan menyunting, sesuaikan isian berdasarkan rujukan instansi. Tetapkan petunjuk serta batas dokumen secara jelas sesuai kontrol yang tersedia.",
      },
      {
        n: 3,
        text: "Tinjau formulir dari sudut pandang pemohon. Simpan atau ajukan pemeriksaan sesuai alur instansi sebelum perubahan diterapkan ke publik.",
      },
    ],
    hasil:
      "Pemohon mendapat persyaratan yang konsisten dengan standar layanan tersebut.",
  },
  {
    id: "penanganan-pengaduan",
    title: "Penanganan Pengaduan",
    siapkan: "Pengajuan yang sudah ditugaskan dan bukti/dokumen dalam akses Anda.",
    steps: [
      {
        n: 1,
        text: "Buka detail pada Penanganan Pengaduan. Periksa uraian, dokumen, dan riwayat; bedakan informasi pemohon dari catatan internal petugas.",
      },
      {
        n: 2,
        text: "Verifikasi kelengkapan sesuai layanan. Jika kurang, minta dokumen tambahan secara spesifik melalui jalur yang tersedia; jelaskan apa yang perlu diperbaiki.",
      },
      {
        n: 3,
        text: "Catat pemeriksaan dan tindak lanjut internal. Sampaikan pembaruan publik yang ringkas dan aman, lalu ubah status sesuai kondisi nyata dan kewenangan.",
      },
    ],
    hasil:
      "Pemeriksaan memiliki jejak yang jelas dan pemohon memahami tindakan berikutnya.",
  },
  {
    id: "hasil-riwayat",
    title: "Hasil & riwayat",
    siapkan: "Pemeriksaan selesai dan hasil yang sudah diperiksa pejabat berwenang.",
    steps: [
      {
        n: 1,
        text: "Periksa keputusan, bukti penanganan, dan dokumen hasil. Jangan menandai persetujuan jika akun Anda tidak berwenang; teruskan ke peran yang sesuai.",
      },
      {
        n: 2,
        text: "Sampaikan ringkasan hasil melalui pembaruan publik tanpa membuka data pribadi. Gunakan penutupan atau status akhir hanya setelah syarat pada layar terpenuhi.",
      },
      {
        n: 3,
        text: "Tinjau riwayat perubahan dan tanggapan pemohon. Bila ada peninjauan resolusi, evaluasi alasan serta bukti sesuai alur instansi, bukan menghapus jejak penanganan.",
      },
    ],
    hasil:
      "Hasil dapat ditelusuri dan pemohon memperoleh penjelasan atas penutupan pengajuan.",
  },
];

const MASALAH: MasalahItem[] = [
  {
    id: "antrean-kosong",
    title: "Antrean kosong",
    check:
      "Periksa cakupan unit dan peran, lalu reset filter status, tanggal, serta jenis layanan satu per satu. Antrean kosong setelah filter tidak membuktikan semua pengajuan selesai.",
    contact:
      "nomor yang seharusnya berada dalam cakupan tetap tidak ditemukan; sertakan nomor, unit, dan filter aktif.",
  },
  {
    id: "gagal-asignasi",
    title: "Gagal asignasi",
    check:
      "Periksa izin Ambil/Asignasikan/Alihkan, kesesuaian petugas tujuan dengan unit dan layanan, serta penanggung jawab terkini. Muat ulang detail bila sudah diubah petugas lain.",
    contact:
      "penugasan tetap gagal pada akun dan petugas yang sesuai; sertakan nomor, tindakan, serta pesan kesalahannya.",
  },
  {
    id: "sla-terlewati",
    title: "SLA terlewati",
    check:
      "Cocokkan target dengan standar waktu jenis layanan dan riwayat kelengkapan. Identifikasi hambatan, koordinasikan tindak lanjut kepada penanggung jawab, dan catat penjelasan yang dapat disampaikan kepada pemohon.",
    contact:
      "hambatan tidak dapat ditangani pada kewenangan unit atau target tetap terlewati; sampaikan nomor dan kronologi kepada koordinator, tanpa mengarang target baru.",
  },
  {
    id: "perubahan-status-gagal",
    title: "Perubahan status gagal",
    check:
      "Baca pesan validasi. Periksa kelengkapan wajib, tahap proses, peran akun, dan perubahan terakhir di riwayat. Jangan melewati verifikasi atau persetujuan hanya untuk memindahkan status.",
    contact:
      "prasyarat terpenuhi namun perubahan tetap ditolak; sertakan nomor, status asal/tujuan, waktu, dan pesan kesalahan.",
  },
  {
    id: "dokumen-tidak-lengkap",
    title: "Dokumen tidak lengkap",
    check:
      "Bandingkan lampiran dengan persyaratan layanan. Minta bagian yang kurang secara spesifik dan arahkan pemohon ke jalur unggah dokumen yang disediakan, bukan pesan publik.",
    contact:
      "dokumen tetap tidak dapat dibaca atau permintaan tidak tersampaikan; sertakan nomor dan jenis kendala, tanpa menyebarkan dokumen pribadi.",
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

export default function CMSLayananPublikArticlePage() {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Agoraya — Beranda"
          className="flex h-[24px] w-[94px] shrink-0 items-center border-r border-slate-200 dark:border-slate-800 pr-2"
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
            <span className="absolute top-[-7px] left-0 h-[3px] w-[20px] bg-slate-800" />
            <span className="absolute top-[7px] left-0 h-[3px] w-[20px] bg-slate-800" />
          </span>
        </button>
      </header>

      <aside
        className="fixed top-14 bottom-0 left-0 hidden w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 md:block"
        aria-label="Navigasi bantuan"
      >
        <nav className="px-[10px] pt-[14px]">
          <p className="mb-[9px] text-xs font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 uppercase">
            Dokumentasi
          </p>
          <Link
            href="/bantuan"
            className="flex h-[20px] items-center gap-[6px] rounded bg-blue-100 px-[6px] text-xs font-medium text-blue-800"
          >
            <Home className="h-[9px] w-[9px]" aria-hidden="true" /> Beranda
          </Link>

          <p className="mt-[13px] mb-[5px] text-xs font-semibold tracking-[0.06em] text-slate-500 dark:text-slate-400 uppercase">
            Platform publik
          </p>
          <div className="space-y-[2px]">
            {sidebarItems.map(({ title, icon: Icon, href }) => (
              <Link
                key={title}
                href={href}
                className="flex h-[22px] items-center gap-[6px] rounded px-[6px] text-xs text-slate-700 hover:bg-slate-100"
              >
                <Icon className="h-[9px] w-[9px] text-blue-700" aria-hidden="true" />
                <span className="flex-1">{title}</span>
                <ChevronRight
                  className="h-[8px] w-[8px] text-blue-700"
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
              className="mb-[16px] text-sm text-slate-500 dark:text-slate-400"
            >
              <Link
                href="/bantuan"
                className="hover:text-blue-700 hover:underline"
              >
                Pusat bantuan
              </Link>
              <span className="px-1 text-slate-400">/</span>
              <Link
                href="/bantuan/cms-ruang-asn"
                className="hover:text-blue-700 hover:underline"
              >
                CMS · Ruang ASN
              </Link>
              <span className="px-1 text-slate-400">/</span>
              <span className="font-medium text-slate-700">
                CMS Layanan Publik
              </span>
            </nav>

            <div className="flex flex-col gap-[20px]" id="main-content">
              <div className="flex flex-col gap-[6px]">
                <span className="inline-flex items-center gap-[4px] rounded-md bg-[#eef4fb] px-[10px] py-[4px] text-sm font-semibold tracking-[0.12em] text-blue-700 uppercase">
                  PANDUAN PENGELOLA
                </span>
                <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-slate-800 dark:text-slate-100 sm:text-5xl">
                  CMS Layanan Publik
                </h1>
                <p className="mt-[10px] max-w-[700px] text-[15px] leading-[1.7] text-slate-600 dark:text-slate-300">
                  Kelola antrean dan standar layanan, tindak lanjuti kelengkapan, serta sampaikan hasil yang jelas kepada pemohon.
                </p>
                <p className="mt-[8px] text-[12px] leading-[1.5] text-slate-500 dark:text-slate-400">
                  4 topik cara kerja · 5 pemecahan masalah
                </p>
              </div>

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
                      Pastikan akun ASN memiliki cakupan unit, jenis layanan, dan peran yang sesuai. Siapkan standar layanan yang berlaku di instansi. Tidak semua petugas berwenang mengubah standar, menyetujui, atau menutup pengajuan.
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
                  Ikuti langkah-langkah bernomor untuk setiap fitur. Setiap tahap dilengkapi dengan konteks siapan dan hasil yang dapat diharapkan.
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
                      Catatan internal hanya untuk koordinasi petugas; pembaruan publik ditujukan kepada pemohon. Jangan menyalin dokumen pribadi, NIK penuh, atau informasi internal ke tanggapan publik. SLA mengikuti jenis layanan, bukan satu batas universal.
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
                  Mulai dari gejala yang Anda temui, periksa penyebabnya, lalu eskalasi bila kendala tetap terjadi.
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
                  Gunakan kanal bantuan yang tersedia di platform atau instansi. Sertakan ID laporan, pengajuan, dataset, atau artikel yang terkait; waktu kejadian, filter dan periode; serta tangkapan layar yang sudah disamarkan.
                </p>
                <p className="mt-[4px] text-sm leading-[1.6] text-slate-600 dark:text-slate-300">
                  Jangan kirim kata sandi, OTP, NIK penuh, atau dokumen pribadi melalui saluran publik.
                </p>
              </section>

              <div className="mt-[20px]">
                <Link
                  href="/bantuan/platform-publik/layanan-publik"
                  className="inline-flex items-center gap-[2px] text-sm font-medium text-blue-700 hover:underline"
                >
                  Panduan terkait: Layanan Publik{" "}
                  <ArrowRight className="h-[10px] w-[10px]" />
                </Link>
              </div>

              <nav
                aria-label="Navigasi artikel sebelumnya dan berikutnya"
                className="mt-[24px] grid grid-cols-2 gap-[12px]"
              >
                <Link
                  href="/bantuan/cms-ruang-asn/cms-data-pemerintah"
                  className="group flex flex-col gap-[2px] rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-[10px] py-[12px] transition-colors hover:bg-slate-50 dark:bg-slate-900"
                >
                  <span className="text-xs font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 uppercase group-hover:text-blue-700">
                    Sebelumnya
                  </span>
                  <span className="flex items-center gap-[2px] text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-700">
                    ← CMS Data Pemerintah
                  </span>
                </Link>
                <Link
                  href="/bantuan/cms-ruang-asn/cms-lapor-warga"
                  className="group flex flex-col gap-[2px] rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-[10px] py-[12px] transition-colors hover:bg-slate-50 dark:bg-slate-900"
                >
                  <span className="text-xs font-semibold tracking-[0.08em] text-slate-500 dark:text-slate-400 uppercase group-hover:text-blue-700">
                    Berikutnya
                  </span>
                  <span className="flex items-center gap-[2px] text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-700">
                    CMS Lapor Warga <ArrowRight className="h-[10px] w-[10px]" />
                  </span>
                </Link>
              </nav>

              <footer className="mt-[30px] border-t border-slate-200 dark:border-slate-800 pt-[12px]">
                <p className="text-xs leading-[1.5] text-slate-500 dark:text-slate-400">
                  Panduan mengikuti rancangan platform dan ketersediaan fitur/hak akses instansi, bukan layanan operasional. Navigasi antarhalaman dan pencarian panduan tersedia.
                </p>
                <div className="mt-[10px] flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">
                    Agoraya · Pusat bantuan / Data Publik, Untuk Semua
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
