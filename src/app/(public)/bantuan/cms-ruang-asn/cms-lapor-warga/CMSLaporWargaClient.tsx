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
  Key,
  Lightbulb,
  Megaphone,
  Search,
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
    id: "antrean-laporan",
    title: "Antrean Laporan",
    siapkan: "Cakupan unit, kategori, dan periode laporan yang akan diperiksa.",
    steps: [
      {
        n: 1,
        text: "Buka Antrean Laporan. Cari ID atau terapkan filter status, kategori, dan rentang tanggal yang tersedia; periksa cakupan unit terlebih dahulu.",
      },
      {
        n: 2,
        text: "Buka detail laporan dan baca kronologi, lokasi, bukti, serta pilihan perlindungan identitas. Akses data pribadi hanya bila berwenang dan diperlukan.",
      },
      {
        n: 3,
        text: "Periksa riwayat serta penanggung jawab sebelum bertindak. Catat kebutuhan verifikasi atau dugaan duplikasi untuk pemeriksaan lebih lanjut.",
      },
    ],
    hasil:
      "Laporan yang benar dipilih dengan konteks penanganan dan privasi yang dipahami.",
  },
  {
    id: "verifikasi-moderasi",
    title: "Verifikasi & Moderasi",
    siapkan: "Detail fakta, pin lokasi, dan berkas bukti yang bisa diperiksa.",
    steps: [
      {
        n: 1,
        text: "Cocokkan kronologi dengan bukti dan lokasi. Jika informasi belum cukup, minta kelengkapan yang spesifik melalui alur yang tersedia.",
      },
      {
        n: 2,
        text: "Tinjau data pribadi dalam uraian dan bukti sebelum publikasi. Periksa dugaan duplikat atau spam berdasarkan isi dan riwayat, bukan sekadar kesamaan kategori.",
      },
      {
        n: 3,
        text: "Tetapkan kategori final dan hasil pemeriksaan sesuai kewenangan. Berikan alasan yang jelas untuk koreksi, penolakan, atau moderasi; pertahankan jejak audit.",
      },
    ],
    hasil:
      "Laporan siap diarahkan, diminta kelengkapan, atau dimoderasi dengan alasan yang dapat ditelusuri.",
  },
  {
    id: "disposisi-opd",
    title: "Disposisi ke OPD",
    siapkan: "Kategori final, wilayah kejadian, dan kewenangan OPD tujuan.",
    steps: [
      {
        n: 1,
        text: "Dari detail yang telah diperiksa, tentukan OPD teknis sesuai masalah dan lokasi. Verifikasi cakupannya sebelum memilih penerima disposisi.",
      },
      {
        n: 2,
        text: "Isi prioritas dan instruksi teknis pada kontrol yang tersedia berdasarkan kondisi nyata serta arahan instansi. Pisahkan catatan internal dari tanggapan publik.",
      },
      {
        n: 3,
        text: "Tinjau tujuan dan alasan, lalu kirim disposisi jika akun berwenang atau teruskan untuk persetujuan. Periksa penerima serta hasilnya pada riwayat.",
      },
    ],
    hasil:
      "Laporan diteruskan kepada unit teknis yang relevan tanpa kehilangan jejak pengalihan.",
  },
  {
    id: "tindak-lanjut-penutupan",
    title: "Tindak Lanjut & Penutupan",
    siapkan: "Petugas penanggung jawab dan rencana atau bukti penanganan.",
    steps: [
      {
        n: 1,
        text: "Buka Tindak Lanjut & Penanganan. Catat pemeriksaan lapangan, tindakan, dan bukti yang relevan; simpan koordinasi petugas sebagai catatan internal.",
      },
      {
        n: 2,
        text: "Sampaikan pembaruan publik yang menjelaskan tindakan dan kondisi terkini tanpa informasi pribadi. Cocokkan bukti penanganan dengan masalah dan lokasi awal.",
      },
      {
        n: 3,
        text: "Sebelum menutup, periksa syarat penutupan di layar dan tanggapan warga. Bila hasil ditolak atau perlu peninjauan, evaluasi alasannya dan lanjutkan penanganan sesuai kewenangan.",
      },
    ],
    hasil:
      "Penanganan dan alasan penutupan dapat ditinjau, termasuk tanggapan warga serta jejak audit.",
  },
];

const MASALAH: MasalahItem[] = [
  {
    id: "salah-opd",
    title: "Salah OPD",
    check:
      "Periksa kategori final, wilayah, dan kewenangan unit tujuan. Koordinasikan koreksi melalui alur pengalihan/disposisi yang tersedia, beri alasan, dan pertahankan riwayat sebelumnya.",
    contact:
      "OPD tujuan tidak tersedia atau kewenangan lintas unit belum jelas; sertakan ID serta alasan usulan pengalihan kepada koordinator.",
  },
  {
    id: "bukti-sensitif",
    title: "Bukti sensitif",
    check:
      "Jangan terbitkan lampiran yang memuat identitas, kontak, atau informasi pribadi. Batasi akses sesuai kontrol layar dan lakukan penyamaran bila fasilitas serta kewenangannya tersedia.",
    contact:
      "tidak ada kontrol untuk membatasi bukti atau bukti sudah terbuka; koordinasikan penanganan kepada pengelola tanpa menyebarkannya lagi.",
  },
  {
    id: "informasi-kurang",
    title: "Informasi kurang",
    check:
      "Tuliskan fakta yang belum dapat diverifikasi, misalnya patokan lokasi atau waktu kejadian. Minta kelengkapan melalui jalur laporan. Untuk anonim, gunakan pembaruan yang dapat dibaca melalui pelacakan; jangan mengarang kontak.",
    contact:
      "laporan tidak dapat diverifikasi dan jalur kelengkapan tidak memadai; mintakan arahan dengan ID serta ringkasan kekurangan yang aman.",
  },
  {
    id: "disposisi-gagal-akses",
    title: "Disposisi gagal/akses",
    check:
      "Periksa peran, cakupan unit, OPD penerima, serta prasyarat verifikasi. Lihat apakah persetujuan diperlukan. Baca riwayat untuk memastikan disposisi belum tercatat sebelum mengulangi.",
    contact:
      "tujuan dan hak akses sesuai tetapi tetap gagal; sertakan ID, OPD, waktu, dan pesan kesalahan.",
  },
  {
    id: "belum-bisa-ditutup-hasil-ditolak",
    title: "Belum bisa ditutup/hasil ditolak",
    check:
      "Periksa kelengkapan bukti, tahap proses, dan izin penutupan. Baca tanggapan warga, cocokkan dengan kondisi awal, lalu catat tindak lanjut atau peninjauan yang diperlukan; jangan memaksakan status selesai.",
    contact:
      "syarat penutupan tidak jelas atau peninjauan melampaui kewenangan petugas; sertakan ID serta riwayat dan bukti yang disamarkan.",
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
  return (
    <div
      className={`relative flex h-[30px] items-center rounded-md border border-slate-200 bg-white ${
        compact ? "w-[245px]" : "w-full"
      }`}
    >
      <Search
        className="ml-2 h-[11px] w-[11px] shrink-0 text-blue-600"
        aria-hidden="true"
      />
      <input
        aria-label="Cari panduan"
        className="h-full min-w-0 flex-1 border-0 bg-transparent px-2 text-[8px] text-slate-700 outline-none placeholder:text-slate-400"
        placeholder="Cari panduan, topik, atau kendala..."
      />
      <button
        className="h-full px-2 text-[7px] text-slate-500 hover:text-blue-700"
        type="button"
      >
        Cari
      </button>
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-blue-50 px-1 text-[10px] font-semibold text-blue-700">
      {n}
    </span>
  );
}

export default function CMSLaporWargaArticlePage() {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="fixed inset-x-0 top-0 z-30 flex h-[47px] items-center border-b border-slate-200 bg-white px-4">
        <Link
          href="/"
          aria-label="Agoraya — Beranda"
          className="flex h-[24px] w-[94px] shrink-0 items-center border-r border-slate-200 pr-2"
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
          className="ml-4 hidden h-[47px] w-[47px] items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 md:flex"
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
        className="fixed top-[47px] bottom-0 left-0 hidden w-36 border-r border-slate-200 bg-slate-50 md:block"
        aria-label="Navigasi bantuan"
      >
        <nav className="px-[10px] pt-[14px]">
          <p className="mb-[9px] text-[6px] font-semibold tracking-[0.08em] text-slate-500 uppercase">
            Dokumentasi
          </p>
          <Link
            href="/bantuan"
            className="flex h-[20px] items-center gap-[6px] rounded bg-blue-100 px-[6px] text-[8px] font-medium text-blue-800"
          >
            <Home className="h-[9px] w-[9px]" aria-hidden="true" /> Beranda
          </Link>

          <p className="mt-[13px] mb-[5px] text-[6px] font-semibold tracking-[0.06em] text-slate-500 uppercase">
            Platform publik
          </p>
          <div className="space-y-[2px]">
            {sidebarItems.map(({ title, icon: Icon, href }) => (
              <Link
                key={title}
                href={href}
                className="flex h-[22px] items-center gap-[6px] rounded px-[6px] text-[7px] text-slate-700 hover:bg-slate-100"
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

          <p className="mt-[10px] mb-[5px] text-[6px] font-semibold tracking-[0.04em] text-slate-500 uppercase">
            CMS · Ruang ASN
          </p>
          <div className="space-y-[2px]">
            <div className="overflow-hidden rounded-md border border-slate-200">
              <Link
                href="/bantuan/cms-ruang-asn/cms-lapor-warga"
                className="flex h-[22px] items-center gap-[6px] rounded px-[6px] text-[7px] text-slate-700 hover:bg-slate-100"
              >
                <FileText
                  className="h-[9px] w-[9px] text-blue-700"
                  aria-hidden="true"
                />
                <span className="flex-1">CMS Lapor Warga</span>
                <ChevronRight
                  className="h-[8px] w-[8px] text-blue-700"
                  aria-hidden="true"
                />
              </Link>
              <div className="border-t border-slate-100 bg-white/50">
                <div className="space-y-0">
                  <p className="mx-[6px] my-[1px] text-[6px] font-semibold tracking-tighter text-slate-500 uppercase">
                    Cara kerja
                  </p>
                  <div className="space-y-[1px]">
                    {CARA_KERJA.map((item, i) => (
                      <Link
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block rounded py-[2px] pr-[6px] pl-[20px] text-[7px] ${
                          i === 0
                            ? "bg-[#eef4fb] font-semibold text-blue-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
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
                  <p className="mx-[6px] my-[3px] text-[6px] font-semibold tracking-tighter text-slate-500 uppercase">
                    Pemecahan masalah
                  </p>
                  <div className="space-y-[1px]">
                    {MASALAH.map((item) => (
                      <Link
                        key={item.id}
                        href={`#${item.id}`}
                        className="block rounded py-[2px] pr-[6px] pl-[20px] text-[7px] text-slate-600 hover:bg-slate-50 hover:text-slate-800"
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

          <div className="mt-[12px] space-y-[7px] border-t border-slate-200 pt-[9px]">
            <Link
              href="#akun-privasi"
              className="block text-[7px] text-slate-500 hover:text-blue-700"
            >
              Akun & perlindungan privasi
            </Link>
            <Link
              href="#bantuan-lanjutan"
              className="block text-[7px] text-slate-500 hover:text-blue-700"
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

      <div className="mx-auto max-w-[1120px] px-4 pt-[70px] pb-8 md:ml-36 md:px-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
          <main className="w-full" aria-label="Konten artikel">
            <a href="#main-content" className="sr-only focus:not-sr-only">
              Lompat ke konten utama
            </a>

            <nav
              aria-label="Breadcrumb"
              className="mb-[16px] text-[10px] text-slate-500"
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
                CMS Lapor Warga
              </span>
            </nav>

            <div className="flex flex-col gap-[20px]" id="main-content">
              <div className="flex flex-col gap-[6px]">
                <span className="inline-flex items-center gap-[4px] rounded-md bg-[#eef4fb] px-[10px] py-[4px] text-[10px] font-semibold tracking-[0.12em] text-blue-700 uppercase">
                  PANDUAN PENGELOLA
                </span>
                <h1 className="mt-[4px] text-[42px] leading-[0.96] font-bold tracking-[-0.04em] text-slate-800">
                  CMS Lapor Warga
                </h1>
                <p className="mt-[10px] max-w-[700px] text-[15px] leading-[1.7] text-slate-600">
                  Periksa fakta, moderasi informasi sensitif, dan arahkan
                  laporan kepada OPD yang tepat sampai penanganan dapat
                  ditinjau warga.
                </p>
                <p className="mt-[8px] text-[12px] leading-[1.5] text-slate-500">
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
                    <p className="text-[9px] font-semibold text-slate-800">
                      Sebelum mulai
                    </p>
                    <p className="mt-[2px] text-[9px] leading-[1.55] text-slate-600">
                      Gunakan akun ASN yang memiliki akses ke unit pengelola
                      laporan. Pastikan kewenangan verifikasi, moderasi,
                      disposisi, dan penutupan sebelum bertindak; persetujuan
                      mengikuti peran serta pengaturan instansi.
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
                  <h2 className="text-[14px] font-bold tracking-[-0.02em] text-slate-800">
                    Cara kerja
                  </h2>
                </div>
                <p className="mb-[16px] text-[10px] leading-[1.5] text-slate-600">
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
                    <h3 className="text-[11px] font-semibold text-slate-800">
                      {item.title}
                    </h3>
                    <p className="mt-[3px] text-[9px] text-slate-500">
                      Siapkan: {item.siapkan}
                    </p>
                    <ol className="mt-[8px] list-none space-y-[5px] pl-0">
                      {item.steps.map((step) => (
                        <li
                          key={step.n}
                          className="flex gap-[8px] text-[9px] leading-[1.5] text-slate-600"
                        >
                          <StepBadge n={step.n} />
                          <span>{step.text}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-[8px] inline-flex items-center gap-[2px] text-[9px] font-semibold text-blue-600">
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
                    <p className="text-[9px] font-semibold text-slate-800">
                      Penting untuk dipahami
                    </p>
                    <p className="mt-[2px] text-[9px] leading-[1.55] text-slate-600">
                      Lindungi pelapor: identitas rahasia hanya untuk petugas
                      berwenang, sedangkan anonim tidak menyertakan nama/kontak.
                      Jangan mengungkap identitas melalui uraian, lampiran,
                      tanggapan publik, atau catatan yang ikut dipublikasikan.
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
                  <h2 className="text-[14px] font-bold tracking-[-0.02em] text-slate-800">
                    Pemecahan masalah
                  </h2>
                </div>
                <p className="mb-[16px] text-[10px] leading-[1.5] text-slate-600">
                  Mulai dari gejala yang Anda temui, periksa penyebabnya, lalu
                  eskalasi bila kendala tetap terjadi.
                </p>

                {MASALAH.map((item) => (
                  <article
                    key={item.id}
                    id={item.id}
                    className="mb-[20px] scroll-mt-[90px] border-b border-slate-100 pb-[16px] last:mb-0 last:border-0 last:pb-0"
                  >
                    <h3 className="text-[11px] font-semibold text-slate-800">
                      {item.title}
                    </h3>
                    <p className="mt-[4px] text-[10px] leading-[1.55] text-slate-600">
                      <span className="font-semibold text-slate-800">
                        Periksa &amp; atasi.
                      </span>{" "}
                      {item.check}
                    </p>
                    <p className="mt-[6px] text-[10px] leading-[1.55] text-slate-600">
                      <span className="font-semibold text-slate-800">
                        Hubungi pengelola jika:
                      </span>{" "}
                      {item.contact}
                    </p>
                  </article>
                ))}
              </section>

              <section
                id="bantuan-lanjutan"
                className="mt-[8px] rounded-md border border-slate-200 bg-white px-[16px] py-[18px] shadow-sm"
              >
                <h3 className="text-[11px] font-semibold text-slate-800">
                  Masih membutuhkan bantuan?
                </h3>
                <p className="mt-[4px] text-[10px] leading-[1.6] text-slate-600">
                  Gunakan kanal bantuan yang tersedia di platform atau
                  instansi. Sertakan ID laporan, pengajuan, dataset, atau
                  artikel yang terkait; waktu kejadian, filter dan periode;
                  serta tangkapan layar yang sudah disamarkan.
                </p>
                <p className="mt-[4px] text-[10px] leading-[1.6] text-slate-600">
                  Jangan kirim kata sandi, OTP, NIK penuh, atau dokumen pribadi
                  melalui saluran publik.
                </p>
              </section>

              <div className="mt-[20px]">
                <Link
                  href="/bantuan/platform-publik/lapor-warga"
                  className="inline-flex items-center gap-[2px] text-[10px] font-medium text-blue-700 hover:underline"
                >
                  Panduan terkait: Lapor Warga{" "}
                  <ArrowRight className="h-[10px] w-[10px]" />
                </Link>
              </div>

              <nav
                aria-label="Navigasi artikel sebelumnya dan berikutnya"
                className="mt-[24px] grid grid-cols-2 gap-[12px]"
              >
                <Link
                  href="/bantuan/cms-ruang-asn/cms-layanan-publik"
                  className="group flex flex-col gap-[2px] rounded-md border border-slate-200 bg-white px-[10px] py-[12px] transition-colors hover:bg-slate-50"
                >
                  <span className="text-[8px] font-semibold tracking-[0.08em] text-slate-500 uppercase group-hover:text-blue-700">
                    Sebelumnya
                  </span>
                  <span className="flex items-center gap-[2px] text-[10px] font-semibold text-slate-800 group-hover:text-blue-700">
                    ← CMS Layanan Publik
                  </span>
                </Link>
                <Link
                  href="/bantuan/cms-ruang-asn/cms-insight"
                  className="group flex flex-col gap-[2px] rounded-md border border-slate-200 bg-white px-[10px] py-[12px] transition-colors hover:bg-slate-50"
                >
                  <span className="text-[8px] font-semibold tracking-[0.08em] text-slate-500 uppercase group-hover:text-blue-700">
                    Berikutnya
                  </span>
                  <span className="flex items-center gap-[2px] text-[10px] font-semibold text-slate-800 group-hover:text-blue-700">
                    CMS Insight{" "}
                    <ArrowRight className="h-[10px] w-[10px]" />
                  </span>
                </Link>
              </nav>

              <footer className="mt-[30px] border-t border-slate-200 pt-[12px]">
                <p className="text-[8px] leading-[1.5] text-slate-500">
                  Panduan mengikuti rancangan platform dan ketersediaan
                  fitur/hak akses instansi, bukan layanan operasional. Ini
                  adalah tampilan dokumentasi statis; navigasi dan pencarian
                  tidak diaktifkan.
                </p>
                <div className="mt-[10px] flex items-center justify-between text-[8px] text-slate-600">
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
