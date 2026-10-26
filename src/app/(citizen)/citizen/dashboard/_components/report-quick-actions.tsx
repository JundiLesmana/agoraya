"use client";

import { useState } from "react";
import {
  CircleAlert,
  Construction,
  Leaf,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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

type ReportCategory = (typeof REPORT_CATEGORIES)[number]["label"];

function isReportCategory(value: string): value is ReportCategory {
  return REPORT_CATEGORIES.some((category) => category.label === value);
}

export function ReportQuickActions() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | "">(
    "",
  );

  function openReportForm(category?: ReportCategory) {
    setSelectedCategory(category ?? "");
    setFormOpen(true);
  }

  return (
    <div className="-mx-4 -my-8">
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
            Anda pantau.
          </p>
          <div className="mt-6">
            <Button
              className="h-12 px-6 text-base"
              onClick={() => openReportForm()}
              aria-label="Buat laporan"
            >
              Buat laporan
            </Button>
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
              <button
                key={category.label}
                type="button"
                aria-label={`Buat laporan kategori ${category.label}`}
                onClick={() => openReportForm(category.label)}
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
              </button>
            );
          })}
        </div>

        <Modal
          open={formOpen}
          onOpenChange={setFormOpen}
          title="Buat laporan"
          description="Isi informasi awal laporan Anda. Laporan akan melalui proses verifikasi dan tindak lanjut."
          contentClassName="max-h-[90vh] overflow-y-auto"
          footer={
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Tutup
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-category">Kategori laporan</Label>
              <Select
                id="report-category"
                aria-label="Kategori laporan"
                value={selectedCategory}
                onChange={(event) => {
                  if (isReportCategory(event.target.value)) {
                    setSelectedCategory(event.target.value);
                  } else if (event.target.value === "") {
                    setSelectedCategory("");
                  }
                }}
                options={REPORT_CATEGORIES.map(({ label }) => ({
                  value: label,
                  label,
                }))}
                placeholder="Pilih kategori laporan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-title">Judul laporan</Label>
              <Input
                id="report-title"
                name="title"
                placeholder="Contoh: Jalan berlubang di Jalan Melati"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-description">
                Ceritakan masalah yang Anda temui
              </Label>
              <Textarea
                id="report-description"
                name="description"
                placeholder="Jelaskan masalah, lokasi, dan informasi lain yang membantu proses verifikasi."
                rows={4}
              />
            </div>
          </div>
        </Modal>
      </section>
    </div>
  );
}
