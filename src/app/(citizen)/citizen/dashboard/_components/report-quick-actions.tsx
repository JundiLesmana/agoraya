"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Check,
  CircleAlert,
  Construction,
  FileText,
  Leaf,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportForm } from "../../reporting/_components/report-form";
import { ReportTrackingSection } from "@/app/(public)/_components/report-tracking-section";

const REPORT_CATEGORIES = [
  {
    label: "Infrastruktur Rusak",
    category: "Infrastruktur",
    description: "Jalan, trotoar, atau fasilitas umum.",
    icon: Construction,
  },
  {
    label: "Dugaan Penyimpangan",
    category: "Dugaan korupsi",
    description: "Dugaan yang perlu pemeriksaan. Gunakan jalur rahasia.",
    icon: CircleAlert,
  },
  {
    label: "Isu Lingkungan",
    category: "Lingkungan",
    description: "Sampah, pencemaran, atau drainase.",
    icon: Leaf,
  },
] as const satisfies readonly {
  label: string;
  category: string;
  description: string;
  icon: LucideIcon;
}[];

const REPORTING_STEPS = [
  {
    title: "Kirim laporan",
    description: "Ceritakan masalah, lokasi, dan bukti yang relevan.",
    icon: FileText,
  },
  {
    title: "Verifikasi",
    description: "Petugas memeriksa kelengkapan dan kebenaran laporan.",
    icon: CircleAlert,
  },
  {
    title: "Tindak lanjut",
    description: "Instansi terkait menangani masalah dan memperbarui progres.",
    icon: Construction,
  },
  {
    title: "Konfirmasi hasil",
    description: "Hasil penanganan dicatat agar progres dapat dipantau.",
    icon: Check,
  },
] as const;

function reportHref(category?: string) {
  return category
    ? `/citizen/dashboard?category=${encodeURIComponent(category)}#report-form`
    : "#report-form";
}

export function ReportQuickActions({
  initialCategory,
}: {
  initialCategory?: string;
}) {
  return (
    <div className="bg-background text-foreground [--primary-foreground:#ffffff] [--primary:#1769e0]">
      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground mx-auto max-w-7xl px-4 py-3 text-xs sm:px-6 lg:px-8"
      >
        Beranda <span className="mx-2">›</span>{" "}
        <span className="font-medium text-blue-700 dark:text-blue-400">
          Lapor Warga
        </span>
      </nav>
      <section
        aria-labelledby="reporting-hero-title"
        className="bg-sky-50 px-4 py-10 sm:px-6 sm:py-12 lg:px-8 dark:bg-slate-950/70"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-3 text-xs font-bold tracking-wide text-blue-700 uppercase dark:text-blue-400">
              Lapor warga
            </p>
            <h1
              id="reporting-hero-title"
              className="text-foreground max-w-2xl text-3xl leading-tight font-bold tracking-tight sm:text-4xl"
            >
              Suara Anda,{" "}
              <span className="text-blue-700 dark:text-blue-400">
                langkah awal perubahan.
              </span>
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl leading-7">
              Laporkan masalah di sekitar Anda. Dari infrastruktur rusak hingga
              dugaan penyimpangan, setiap laporan melalui verifikasi dan dapat
              dipantau tindak lanjutnya.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild className="h-11 px-5">
                <Link href="#report-form" aria-label="Buat laporan">
                  Buat laporan
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11">
                <Link href="/tracking">Lacak laporan</Link>
              </Button>
            </div>
            <p className="text-muted-foreground mt-3 text-xs">
              Setiap laporan diverifikasi. Pilihan privasi tersedia saat mengisi
              formulir.
            </p>
          </div>
          <div
            aria-label="Ilustrasi lokasi laporan warga"
            className="relative mx-auto h-52 w-full max-w-md overflow-hidden rounded-2xl border-4 border-white bg-emerald-50 shadow-md sm:h-60 dark:border-slate-800 dark:bg-emerald-950"
          >
            <div className="absolute inset-0 bg-[linear-gradient(25deg,transparent_43%,white_44%,white_49%,transparent_50%),linear-gradient(155deg,transparent_33%,white_34%,white_39%,transparent_40%),linear-gradient(75deg,transparent_61%,white_62%,white_67%,transparent_68%)]" />
            <div className="absolute top-4 -left-6 h-16 w-36 rotate-12 rounded-full bg-emerald-100 dark:bg-emerald-900" />
            <div className="absolute right-2 bottom-2 h-20 w-36 -rotate-12 rounded-full bg-emerald-100 dark:bg-emerald-900" />
            <div className="absolute inset-x-8 top-1/2 border-t-2 border-dashed border-blue-500" />
            <span className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg">
              <MapPin aria-hidden="true" className="size-6" />
            </span>
            <span className="bg-card text-card-foreground absolute top-4 left-4 rounded-full px-3 py-2 text-xs font-medium shadow">
              Lokasi laporan warga
            </span>
            <span className="bg-card text-card-foreground absolute right-4 bottom-4 rounded-lg px-3 py-2 text-xs font-semibold shadow">
              Jalan berlubang di Jl. Melati
            </span>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="report-categories-title"
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      >
        <p className="text-primary text-xs font-semibold tracking-wide uppercase">
          Mulai dari sekitar Anda
        </p>
        <h2
          id="report-categories-title"
          className="text-foreground mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
        >
          Apa yang ingin Anda laporkan?
        </h2>
        <p className="text-muted-foreground mt-2">
          Pilih kategori yang paling sesuai agar laporan diteruskan ke pihak
          yang tepat.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          {REPORT_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.label}
                href={reportHref(category.category)}
                aria-label={`Buat laporan kategori ${category.label}`}
                className="group focus-visible:ring-primary flex min-h-28 items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:items-center sm:p-5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800"
              >
                <span className="text-primary flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/60">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="text-foreground block font-semibold">
                    {category.label}
                  </span>
                  <span className="text-muted-foreground mt-1 block text-sm leading-5">
                    {category.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="reporting-steps-title"
        className="border-y border-slate-100 bg-slate-50 px-4 py-10 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-950/60"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-primary text-xs font-semibold tracking-wide uppercase">
                Alur pelaporan
              </p>
              <h2
                id="reporting-steps-title"
                className="text-foreground mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
              >
                Dari laporan hingga penyelesaian
              </h2>
            </div>
            <p className="text-muted-foreground max-w-xl text-sm leading-6">
              Status diperbarui oleh petugas. Contoh progres dan waktu
              penanganan dapat dilihat sebelum membuat laporan.
            </p>
          </div>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REPORTING_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className="text-primary flex size-9 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/60">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <h3 className="text-foreground mt-3 font-semibold">
                    <span className="text-primary mr-2 text-xs">
                      {String(index + 1).padStart(2, "0")}
                    </span>{" "}
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm leading-5">
                    {step.description}
                  </p>
                </li>
              );
            })}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={reportHref()}>Buat laporan</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tracking">Lihat contoh pelacakan</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/#recent-reports">Lihat laporan terbaru</Link>
            </Button>
          </div>
        </div>
      </section>

      <section
        id="report-form"
        aria-labelledby="report-form-title"
        className="bg-slate-50/60 px-4 py-12 sm:px-6 lg:px-8 dark:bg-slate-950/60"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold tracking-wide text-blue-700 uppercase dark:text-blue-400">
            Sampaikan laporan
          </p>
          <h2
            id="report-form-title"
            className="text-foreground mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Bantu kami memahami masalahnya
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Isi informasi selengkap mungkin. Kolom bertanda * wajib diisi.
          </p>
          <div className="mt-6">
            <ReportForm
              key={initialCategory ?? "default"}
              initialCategory={initialCategory}
            />
          </div>
        </div>
      </section>

      <div id="report-examples" className="scroll-mt-24">
        <ReportTrackingSection />
      </div>

      <section
        aria-labelledby="report-examples-title"
        className="bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 dark:bg-slate-950/60"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold tracking-wide text-blue-700 uppercase dark:text-blue-400">
            Transparansi dalam aksi
          </p>
          <h2
            id="report-examples-title"
            className="text-foreground mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Kenali laporan dan progresnya
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Contoh berikut membantu memahami informasi yang dapat dipantau
            setelah laporan dikirim.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                category: "Infrastruktur",
                title: "Jalan berlubang di Jl. Melati",
                status: "Ditindaklanjuti",
                image: "/lapor-warga/jalan-rusak.png",
                place: "Kota Bandung",
              },
              {
                category: "Lingkungan",
                title: "Sampah menumpuk di tepi saluran",
                status: "Menunggu verifikasi",
                image: "/lapor-warga/sampah-serakan.png",
                place: "Kota Bogor",
              },
              {
                category: "Infrastruktur",
                title: "Lampu jalan kembali menyala",
                status: "Selesai",
                image: "/lapor-warga/lampu-jalan.png",
                place: "Kota Semarang",
              },
            ].map((report) => (
              <article
                key={report.title}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="relative h-36">
                  <Image
                    src={report.image}
                    alt={report.title}
                    fill
                    sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {report.category}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2 py-1 font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {report.status}
                    </span>
                  </div>
                  <h3 className="text-foreground mt-3 font-semibold">
                    {report.title}
                  </h3>
                  <p className="text-muted-foreground mt-2 flex items-center gap-1 text-sm">
                    <MapPin aria-hidden="true" className="size-4" />
                    {report.place}
                  </p>
                  <p className="text-muted-foreground mt-3 text-xs">
                    Contoh laporan · data ilustrasi
                  </p>
                </div>
              </article>
            ))}
          </div>
          <p className="text-muted-foreground mt-5 text-xs">
            Contoh ini bersifat ilustratif dan tidak menampilkan data pribadi.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="report-faq-title"
        className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8"
      >
        <div>
          <p className="text-xs font-bold tracking-wide text-blue-700 uppercase dark:text-blue-400">
            Perlu diketahui
          </p>
          <h2
            id="report-faq-title"
            className="text-foreground mt-2 text-2xl font-bold tracking-tight"
          >
            Melapor dengan lebih tenang
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-6">
            Pahami proses dan pilihan Anda sebelum menyampaikan laporan.
          </p>
          <Link
            href="#report-form"
            className="mt-4 inline-block text-sm font-semibold text-blue-700 underline underline-offset-4 dark:text-blue-400"
          >
            Kunjungi pusat bantuan
          </Link>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {[
            [
              "Apakah nama saya akan terlihat oleh publik?",
              "Tidak. Anda dapat memilih laporan anonim saat mengisi formulir. Identitas tidak ditampilkan pada laporan publik.",
            ],
            [
              "Bagaimana jika laporan saya belum dilengkapi?",
              "Petugas dapat meminta informasi tambahan agar laporan dapat diverifikasi dan diteruskan ke pihak yang tepat.",
            ],
            [
              "Apa yang dilakukan jika masalah belum selesai?",
              "Progres tindak lanjut dan pembaruan status dapat dipantau melalui halaman pelacakan laporan.",
            ],
          ].map(([question, answer]) => (
            <details key={question} className="group py-4">
              <summary className="text-foreground cursor-pointer list-none font-semibold marker:hidden">
                {question}
                <span className="float-right text-blue-700 group-open:hidden dark:text-blue-400">
                  +
                </span>
                <span className="float-right hidden text-blue-700 group-open:inline dark:text-blue-400">
                  −
                </span>
              </summary>
              <p className="text-muted-foreground mt-3 text-sm leading-6">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
