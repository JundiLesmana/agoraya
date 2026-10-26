"use client";

import Link from "next/link";
import {
  Check,
  CircleAlert,
  Construction,
  FileText,
  Leaf,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const REPORT_CATEGORIES = [
  {
    label: "Infrastruktur",
    description: "Jalan rusak, lampu jalan, jembatan, dan fasilitas umum.",
    icon: Construction,
    cardClassName:
      "border-blue-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100",
    iconClassName: "text-blue-700",
  },
  {
    label: "Dugaan korupsi",
    description:
      "Dugaan penyalahgunaan anggaran, pungutan liar, atau wewenang.",
    icon: CircleAlert,
    cardClassName:
      "border-orange-200 bg-orange-50 hover:border-orange-300 hover:bg-orange-100",
    iconClassName: "text-orange-700",
  },
  {
    label: "Lingkungan",
    description: "Sampah menumpuk, pencemaran, dan saluran tersumbat.",
    icon: Leaf,
    cardClassName:
      "border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100",
    iconClassName: "text-emerald-700",
  },
  {
    label: "Layanan lainnya",
    description: "Kendala layanan publik dan masalah lain di sekitar Anda.",
    icon: MessagesSquare,
    cardClassName:
      "border-violet-200 bg-violet-50 hover:border-violet-300 hover:bg-violet-100",
    iconClassName: "text-violet-700",
  },
] as const satisfies readonly {
  label: string;
  description: string;
  icon: LucideIcon;
  cardClassName: string;
  iconClassName: string;
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
    ? `/citizen/reporting?category=${encodeURIComponent(category)}`
    : "/citizen/reporting";
}

export function ReportQuickActions() {
  return (
    <div className="-mx-4 -my-8 bg-white text-slate-900">
      <section
        aria-labelledby="reporting-hero-title"
        className="bg-blue-50 px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-primary mb-3 text-sm font-semibold tracking-wide uppercase">
            Layanan pelaporan warga
          </p>
          <h1
            id="reporting-hero-title"
            className="text-4xl font-bold tracking-tight text-slate-900 uppercase sm:text-5xl"
          >
            LAPOR WARGA
          </h1>
          <p className="text-muted-foreground mt-3 text-xl font-semibold sm:text-2xl">
            Suara Anda, langkah awal perubahan
          </p>
          <p className="mt-4 max-w-3xl leading-7 text-slate-600">
            Laporkan masalah infrastruktur, dugaan korupsi, atau layanan publik.
            Setiap laporan akan melalui verifikasi dan tindak lanjut yang dapat
            Anda pantau. Saat ini halaman ini masih berupa pratinjau dan
            pengiriman laporan belum aktif.
          </p>
          <div className="mt-6">
            <Button asChild className="h-12 px-6 text-base">
              <Link href={reportHref()} aria-label="Buat laporan">
                Buat laporan
              </Link>
            </Button>
            <p className="mt-3 max-w-2xl text-sm text-slate-600">
              Alur: pilih kategori, jelaskan masalah, lampirkan bukti, lalu
              tentukan pilihan privasi Anda.
            </p>
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
          className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
        >
          Apa yang ingin Anda laporkan?
        </h2>
        <p className="text-muted-foreground mt-2">
          Pilih kategori yang paling sesuai agar laporan diteruskan ke pihak
          yang tepat.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REPORT_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.label}
                href={reportHref(category.label)}
                aria-label={`Buat laporan kategori ${category.label}`}
                className={`group focus-visible:ring-primary min-h-40 rounded-xl border p-5 text-left shadow-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${category.cardClassName}`}
              >
                <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-white">
                  <Icon
                    aria-hidden="true"
                    className={`size-6 ${category.iconClassName}`}
                  />
                </span>
                <span className="block font-semibold text-slate-900">
                  {category.label}
                </span>
                <span className="mt-1 block text-sm leading-5 text-slate-600">
                  {category.description}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="reporting-steps-title"
        className="border-y border-slate-100 bg-slate-50 px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-primary text-xs font-semibold tracking-wide uppercase">
                Alur pelaporan
              </p>
              <h2
                id="reporting-steps-title"
                className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
              >
                Dari laporan hingga penyelesaian
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
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
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <span className="text-primary flex size-9 items-center justify-center rounded-full bg-blue-50">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <h3 className="mt-3 font-semibold text-slate-900">
                    <span className="text-primary mr-2 text-xs">
                      {String(index + 1).padStart(2, "0")}
                    </span>{" "}
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-slate-600">
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
            <Button asChild variant="ghost">
              <Link href="/#recent-reports">Lihat laporan terbaru</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
