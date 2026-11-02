"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  PERMIT_SERVICES,
  type PermitApplicationPayload,
  type PermitServiceOption,
} from "@/lib/permit-applications/types";

type PermitDetails = {
  namaPemohon: string;
  kontakNotifikasi: string;
  kecamatan: string;
  kelurahan: string;
  judulPermohonan: string;
  uraian: string;
  namaUsaha: string;
  bidangUsaha: string;
  alamatUsaha: string;
  statusKepemilikanTempat: string;
  namaKegiatan: string;
  jenisKegiatan: string;
  tanggalKegiatan: string;
  lokasiKegiatan: string;
  jenisIzin: string;
  tujuanIzin: string;
};

const INITIAL_DETAILS: PermitDetails = {
  namaPemohon: "",
  kontakNotifikasi: "",
  kecamatan: "",
  kelurahan: "",
  judulPermohonan: "",
  uraian: "",
  namaUsaha: "",
  bidangUsaha: "",
  alamatUsaha: "",
  statusKepemilikanTempat: "",
  namaKegiatan: "",
  jenisKegiatan: "",
  tanggalKegiatan: "",
  lokasiKegiatan: "",
  jenisIzin: "",
  tujuanIzin: "",
};

const STEP_LABELS = [
  "Pilih layanan",
  "Isi detail",
  "Lampiran",
  "Tinjau & kirim",
] as const;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getDetailsError(
  service: PermitServiceOption,
  details: PermitDetails,
): string | null {
  if (!details.namaPemohon.trim()) return "Nama pemohon wajib diisi.";
  if (!isValidEmail(details.kontakNotifikasi)) {
    return "Masukkan alamat email dengan format yang benar.";
  }
  if (!details.kecamatan) return "Kecamatan domisili wajib dipilih.";
  if (!details.kelurahan) return "Kelurahan / desa wajib dipilih.";
  if (!details.judulPermohonan.trim()) return "Judul permohonan wajib diisi.";
  if (!details.uraian.trim()) return "Ceritakan kebutuhan permohonan Anda.";

  if (service.type === "NibUsahaMikro") {
    if (!details.namaUsaha.trim()) return "Nama usaha wajib diisi.";
    if (!details.bidangUsaha) return "Bidang usaha wajib dipilih.";
    if (!details.alamatUsaha.trim())
      return "Alamat kegiatan usaha wajib diisi.";
    if (!details.statusKepemilikanTempat) {
      return "Status kepemilikan tempat wajib dipilih.";
    }
  } else if (service.type === "IzinKegiatan") {
    if (!details.namaKegiatan.trim()) return "Nama kegiatan wajib diisi.";
    if (!details.jenisKegiatan) return "Jenis kegiatan wajib dipilih.";
    if (!details.tanggalKegiatan) return "Tanggal kegiatan wajib diisi.";
    if (!details.lokasiKegiatan.trim()) return "Lokasi kegiatan wajib diisi.";
  } else {
    if (!details.jenisIzin.trim()) return "Jenis izin wajib diisi.";
    if (!details.namaUsaha.trim()) return "Nama usaha wajib diisi.";
    if (!details.alamatUsaha.trim()) return "Alamat usaha wajib diisi.";
    if (!details.tujuanIzin.trim()) return "Tujuan izin wajib diisi.";
  }
  return null;
}

function createPayload(
  service: PermitServiceOption,
  details: PermitDetails,
): PermitApplicationPayload {
  const commonData = {
    namaPemohon: details.namaPemohon.trim(),
    kontakNotifikasi: details.kontakNotifikasi.trim(),
    kecamatan: details.kecamatan,
    kelurahan: details.kelurahan,
    judulPermohonan: details.judulPermohonan.trim(),
    uraian: details.uraian.trim(),
  };

  if (service.type === "NibUsahaMikro") {
    return {
      category: "permit",
      serviceType: service.type,
      serviceId: "nib-usaha-mikro",
      data: {
        ...commonData,
        namaUsaha: details.namaUsaha.trim(),
        bidangUsaha: details.bidangUsaha,
        alamatUsaha: details.alamatUsaha.trim(),
        statusKepemilikanTempat: details.statusKepemilikanTempat,
      },
    };
  }

  if (service.type === "IzinKegiatan") {
    return {
      category: "permit",
      serviceType: service.type,
      serviceId: "izin-kegiatan",
      data: {
        ...commonData,
        namaKegiatan: details.namaKegiatan.trim(),
        jenisKegiatan: details.jenisKegiatan,
        tanggalKegiatan: details.tanggalKegiatan,
        lokasiKegiatan: details.lokasiKegiatan.trim(),
      },
    };
  }

  return {
    category: "permit",
    serviceType: service.type,
    serviceId: "perizinan-lainnya",
    data: {
      ...commonData,
      jenisIzin: details.jenisIzin.trim(),
      namaUsaha: details.namaUsaha.trim(),
      alamatUsaha: details.alamatUsaha.trim(),
      tujuanIzin: details.tujuanIzin.trim(),
    },
  };
}

function ServiceSelection({
  selectedService,
  onSelect,
}: {
  selectedService: PermitServiceOption | null;
  onSelect: (service: PermitServiceOption) => void;
}) {
  return (
    <fieldset
      aria-label="Pilih jenis layanan perizinan"
      className="grid gap-3 md:grid-cols-3"
    >
      {PERMIT_SERVICES.map((service) => {
        const selected = selectedService?.id === service.id;
        return (
          <label key={service.id} className="block cursor-pointer">
            <input
              type="radio"
              name="permit-service"
              value={service.id}
              checked={selected}
              onChange={() => onSelect(service)}
              className="peer sr-only"
            />
            <span
              className={`flex min-h-28 flex-col rounded-xl border p-4 transition-colors ${
                selected
                  ? "border-primary bg-primary/5 ring-primary ring-1"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <span className="font-semibold">{service.name}</span>
              <span className="text-muted-foreground mt-2 text-sm">
                {service.description}
              </span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

export default function PermitApplicationPage() {
  const [selectedService, setSelectedService] =
    useState<PermitServiceOption | null>(null);
  const [details, setDetails] = useState<PermitDetails>(INITIAL_DETAILS);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRoute, setSubmittedRoute] = useState("");

  function updateDetail(key: keyof PermitDetails, value: string) {
    setDetails((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function continueToAttachments() {
    if (!selectedService) {
      setError("Pilih jenis layanan perizinan terlebih dahulu.");
      return;
    }
    const validationError = getDetailsError(selectedService, details);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setStep(3);
  }

  async function submitApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedService) {
      setError("Pilih jenis layanan perizinan terlebih dahulu.");
      return;
    }

    const validationError = getDetailsError(selectedService, details);
    if (validationError) {
      setError(validationError);
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/permit-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload(selectedService, details)),
      });
      const result: { error?: string; valid?: boolean; routeKey?: string } =
        await response.json();
      const expectedRouteKey = `permit:${selectedService.id}`;
      if (
        !response.ok ||
        !result.valid ||
        result.routeKey !== expectedRouteKey
      ) {
        setError(
          result.error ??
            "Pengajuan perizinan gagal divalidasi. Periksa kembali data Anda.",
        );
        return;
      }
      setSubmittedRoute(result.routeKey);
    } catch {
      setError(
        "Layanan pengajuan perizinan tidak dapat dihubungi. Periksa koneksi lalu coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-background min-h-[70vh] pb-12">
      <section className="border-border border-b bg-sky-50 dark:bg-sky-950/30">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="text-muted-foreground text-xs"
          >
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/">Beranda</Link>
              </li>
              <li aria-hidden="true">›</li>
              <li>
                <Link href="/layanan-publik">Layanan Publik</Link>
              </li>
              <li aria-hidden="true">›</li>
              <li aria-current="page">Perizinan</li>
            </ol>
          </nav>
          <div className="mt-5">
            <p className="text-primary text-xs font-semibold tracking-wide uppercase">
              Ruang warga · Perizinan
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Ajukan Layanan Perizinan
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
              Urus kebutuhan izin usaha dan kegiatan dengan panduan yang jelas.
              Pilih jenis layanan agar data permohonan diteruskan ke alur yang
              sesuai.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] lg:px-8">
        {submittedRoute ? (
          <section className="border-border bg-card rounded-xl border p-6 lg:col-span-2">
            <div className="flex items-start gap-3">
              <CheckCircle2
                className="mt-0.5 size-6 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-xl font-semibold">
                  Payload permohonan tervalidasi
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Jenis layanan telah dipisahkan untuk instansi tujuan Dinas
                  Penanaman Modal dan PTSP.
                </p>
                <p className="bg-muted mt-3 rounded-lg p-3 font-mono text-sm">
                  {submittedRoute}
                </p>
                <p className="text-muted-foreground mt-3 text-xs">
                  Endpoint menerima dan memvalidasi payload layanan terpilih.
                  Penerusan atau penyimpanan CMS produksi memerlukan integrasi
                  backend yang dikonfigurasi.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <>
            <form onSubmit={submitApplication} className="space-y-4">
              <div className="border-border bg-card rounded-xl border p-4">
                <p className="font-medium">
                  Pengajuan dibuat oleh warga, bukan petugas.
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Data setiap jenis izin dibatasi pada field yang diperlukan
                  untuk layanannya.
                </p>
              </div>

              <ol
                aria-label="Tahapan pengajuan perizinan"
                className="border-border bg-card grid gap-2 rounded-xl border p-4 sm:grid-cols-4"
              >
                {STEP_LABELS.map((label, index) => {
                  const current = index + 1;
                  return (
                    <li
                      key={label}
                      aria-current={step === current ? "step" : undefined}
                      className={`border-t-2 pt-2 text-xs ${
                        step >= current
                          ? "border-primary text-primary"
                          : "border-muted text-muted-foreground"
                      }`}
                    >
                      {current}. {label}
                    </li>
                  );
                })}
              </ol>

              <section className="border-border bg-card rounded-xl border p-5">
                {step === 1 ? (
                  <>
                    <h2 className="text-lg font-semibold">
                      Pilih jenis layanan
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Setiap jenis memiliki field dan route backend tersendiri.
                    </p>
                    <div className="mt-4">
                      <ServiceSelection
                        selectedService={selectedService}
                        onSelect={(service) => {
                          setSelectedService(service);
                          setDetails((current) => ({
                            ...current,
                            judulPermohonan: service.name,
                          }));
                        }}
                      />
                    </div>
                  </>
                ) : null}

                {step === 2 && selectedService ? (
                  <>
                    <h2 className="text-lg font-semibold">Data permohonan</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Layanan terpilih: <strong>{selectedService.name}</strong>
                    </p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <label className="space-y-1.5 text-sm">
                        <span className="font-medium">Nama pemohon *</span>
                        <Input
                          value={details.namaPemohon}
                          onChange={(event) =>
                            updateDetail("namaPemohon", event.target.value)
                          }
                        />
                      </label>
                      <label className="space-y-1.5 text-sm">
                        <span className="font-medium">Kontak notifikasi *</span>
                        <Input
                          type="email"
                          value={details.kontakNotifikasi}
                          onChange={(event) =>
                            updateDetail("kontakNotifikasi", event.target.value)
                          }
                        />
                      </label>
                      <label className="space-y-1.5 text-sm">
                        <span className="font-medium">
                          Kecamatan domisili *
                        </span>
                        <select
                          aria-label="Kecamatan domisili"
                          value={details.kecamatan}
                          onChange={(event) =>
                            updateDetail("kecamatan", event.target.value)
                          }
                          className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                        >
                          <option value="">Pilih kecamatan</option>
                          <option value="Kecamatan Melati">
                            Kecamatan Melati
                          </option>
                        </select>
                      </label>
                      <label className="space-y-1.5 text-sm">
                        <span className="font-medium">Kelurahan / desa *</span>
                        <select
                          aria-label="Kelurahan / desa"
                          value={details.kelurahan}
                          onChange={(event) =>
                            updateDetail("kelurahan", event.target.value)
                          }
                          className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                        >
                          <option value="">Pilih kelurahan / desa</option>
                          <option value="Kelurahan Melati">
                            Kelurahan Melati
                          </option>
                        </select>
                      </label>
                      <label className="space-y-1.5 text-sm sm:col-span-2">
                        <span className="font-medium">Judul permohonan *</span>
                        <Input
                          value={details.judulPermohonan}
                          onChange={(event) =>
                            updateDetail("judulPermohonan", event.target.value)
                          }
                        />
                      </label>

                      {selectedService.type === "NibUsahaMikro" ? (
                        <>
                          <label className="space-y-1.5 text-sm">
                            <span className="font-medium">Nama usaha *</span>
                            <Input
                              value={details.namaUsaha}
                              onChange={(event) =>
                                updateDetail("namaUsaha", event.target.value)
                              }
                            />
                          </label>
                          <label className="space-y-1.5 text-sm">
                            <span className="font-medium">Bidang usaha *</span>
                            <select
                              aria-label="Bidang usaha"
                              value={details.bidangUsaha}
                              onChange={(event) =>
                                updateDetail("bidangUsaha", event.target.value)
                              }
                              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                            >
                              <option value="">Pilih bidang usaha</option>
                              <option>Makanan dan minuman</option>
                              <option>Perdagangan</option>
                              <option>Jasa</option>
                              <option>Lainnya</option>
                            </select>
                          </label>
                          <label className="space-y-1.5 text-sm sm:col-span-2">
                            <span className="font-medium">
                              Alamat kegiatan usaha *
                            </span>
                            <Input
                              value={details.alamatUsaha}
                              onChange={(event) =>
                                updateDetail("alamatUsaha", event.target.value)
                              }
                            />
                          </label>
                          <label className="space-y-1.5 text-sm sm:col-span-2">
                            <span className="font-medium">
                              Status kepemilikan tempat *
                            </span>
                            <select
                              aria-label="Status kepemilikan tempat"
                              value={details.statusKepemilikanTempat}
                              onChange={(event) =>
                                updateDetail(
                                  "statusKepemilikanTempat",
                                  event.target.value,
                                )
                              }
                              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                            >
                              <option value="">Pilih status</option>
                              <option>Milik sendiri</option>
                              <option>Sewa</option>
                              <option>Menumpang</option>
                            </select>
                          </label>
                        </>
                      ) : null}

                      {selectedService.type === "IzinKegiatan" ? (
                        <>
                          <label className="space-y-1.5 text-sm">
                            <span className="font-medium">Nama kegiatan *</span>
                            <Input
                              value={details.namaKegiatan}
                              onChange={(event) =>
                                updateDetail("namaKegiatan", event.target.value)
                              }
                            />
                          </label>
                          <label className="space-y-1.5 text-sm">
                            <span className="font-medium">
                              Jenis kegiatan *
                            </span>
                            <select
                              aria-label="Jenis kegiatan"
                              value={details.jenisKegiatan}
                              onChange={(event) =>
                                updateDetail(
                                  "jenisKegiatan",
                                  event.target.value,
                                )
                              }
                              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                            >
                              <option value="">Pilih jenis kegiatan</option>
                              <option>Kegiatan warga</option>
                              <option>Kegiatan sosial</option>
                              <option>Kegiatan usaha</option>
                              <option>Lainnya</option>
                            </select>
                          </label>
                          <label className="space-y-1.5 text-sm">
                            <span className="font-medium">
                              Tanggal kegiatan *
                            </span>
                            <Input
                              type="date"
                              value={details.tanggalKegiatan}
                              onChange={(event) =>
                                updateDetail(
                                  "tanggalKegiatan",
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                          <label className="space-y-1.5 text-sm">
                            <span className="font-medium">
                              Lokasi kegiatan *
                            </span>
                            <Input
                              value={details.lokasiKegiatan}
                              onChange={(event) =>
                                updateDetail(
                                  "lokasiKegiatan",
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                        </>
                      ) : null}

                      {selectedService.type === "PerizinanLainnya" ? (
                        <>
                          <label className="space-y-1.5 text-sm">
                            <span className="font-medium">Jenis izin *</span>
                            <Input
                              value={details.jenisIzin}
                              onChange={(event) =>
                                updateDetail("jenisIzin", event.target.value)
                              }
                            />
                          </label>
                          <label className="space-y-1.5 text-sm">
                            <span className="font-medium">Nama usaha *</span>
                            <Input
                              value={details.namaUsaha}
                              onChange={(event) =>
                                updateDetail("namaUsaha", event.target.value)
                              }
                            />
                          </label>
                          <label className="space-y-1.5 text-sm sm:col-span-2">
                            <span className="font-medium">Alamat usaha *</span>
                            <Input
                              value={details.alamatUsaha}
                              onChange={(event) =>
                                updateDetail("alamatUsaha", event.target.value)
                              }
                            />
                          </label>
                          <label className="space-y-1.5 text-sm sm:col-span-2">
                            <span className="font-medium">Tujuan izin *</span>
                            <Textarea
                              rows={3}
                              value={details.tujuanIzin}
                              onChange={(event) =>
                                updateDetail("tujuanIzin", event.target.value)
                              }
                            />
                          </label>
                        </>
                      ) : null}

                      <label className="space-y-1.5 text-sm sm:col-span-2">
                        <span className="font-medium">
                          Ceritakan kebutuhan Anda *
                        </span>
                        <Textarea
                          rows={4}
                          maxLength={5000}
                          value={details.uraian}
                          onChange={(event) =>
                            updateDetail("uraian", event.target.value)
                          }
                        />
                      </label>
                    </div>
                  </>
                ) : null}

                {step === 3 && selectedService ? (
                  <>
                    <h2 className="text-lg font-semibold">
                      Lampiran pendukung
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Siapkan dokumen berikut untuk proses verifikasi. Berkas
                      belum diunggah atau dikirim ke backend pada versi ini.
                    </p>
                    <ul className="mt-4 space-y-3">
                      {selectedService.requiredDocuments.map((document) => (
                        <li
                          key={document}
                          className="border-border flex items-center gap-3 rounded-lg border p-3 text-sm"
                        >
                          <CheckCircle2
                            className="text-primary size-4"
                            aria-hidden="true"
                          />
                          {document}
                        </li>
                      ))}
                    </ul>
                    <p className="text-muted-foreground mt-4 text-xs">
                      Saat integrasi unggah dokumen tersedia, lampiran perlu
                      dihubungkan dengan route layanan{" "}
                      <span className="font-mono">
                        permit:{selectedService.id}
                      </span>
                      .
                    </p>
                  </>
                ) : null}

                {step === 4 && selectedService ? (
                  <>
                    <h2 className="text-lg font-semibold">Tinjau permohonan</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Payload hanya memuat field yang sesuai dengan layanan{" "}
                      <strong>{selectedService.name}</strong>.
                    </p>
                    <dl className="border-border mt-4 grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground text-xs">
                          Jenis layanan
                        </dt>
                        <dd className="mt-1 font-medium">
                          {selectedService.name}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground text-xs">
                          Instansi tujuan
                        </dt>
                        <dd className="mt-1 font-medium">
                          Dinas Penanaman Modal dan PTSP
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground text-xs">
                          Nama pemohon
                        </dt>
                        <dd className="mt-1 font-medium">
                          {details.namaPemohon}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground text-xs">
                          Kontak notifikasi
                        </dt>
                        <dd className="mt-1 font-medium">
                          {details.kontakNotifikasi}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground text-xs">
                          Judul permohonan
                        </dt>
                        <dd className="mt-1 font-medium">
                          {details.judulPermohonan}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-muted-foreground text-xs">
                          Uraian
                        </dt>
                        <dd className="mt-1 font-medium whitespace-pre-wrap">
                          {details.uraian}
                        </dd>
                      </div>
                    </dl>
                  </>
                ) : null}

                {error ? (
                  <p role="alert" className="text-destructive mt-4 text-sm">
                    {error}
                  </p>
                ) : null}

                <div className="border-border mt-5 flex flex-col-reverse justify-between gap-3 border-t pt-4 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={step === 1 || isSubmitting}
                    onClick={() => {
                      setError("");
                      setStep((current) => Math.max(1, current - 1));
                    }}
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Kembali
                  </Button>
                  {step === 1 ? (
                    <Button
                      type="button"
                      disabled={!selectedService}
                      onClick={() => setStep(2)}
                    >
                      Pilih layanan{" "}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                  {step === 2 ? (
                    <Button type="button" onClick={continueToAttachments}>
                      Lanjut ke lampiran{" "}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                  {step === 3 ? (
                    <Button type="button" onClick={() => setStep(4)}>
                      Tinjau pengajuan{" "}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                  {step === 4 ? (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Memvalidasi..." : "Kirim pengajuan"}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </section>
            </form>

            <aside className="space-y-4">
              <section className="border-border bg-card rounded-xl border p-5">
                <h2 className="font-semibold">Ringkasan sebelum kirim</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <div className="border-border rounded-lg border p-3">
                    <dt className="text-muted-foreground text-xs">Layanan</dt>
                    <dd className="mt-1 font-medium">
                      {selectedService?.name ?? "Pilih jenis layanan"}
                    </dd>
                  </div>
                  <div className="border-border rounded-lg border p-3">
                    <dt className="text-muted-foreground text-xs">
                      Instansi tujuan
                    </dt>
                    <dd className="mt-1 font-medium">
                      Dinas Penanaman Modal dan PTSP
                    </dd>
                  </div>
                  <div className="border-border rounded-lg border p-3">
                    <dt className="text-muted-foreground text-xs">Status</dt>
                    <dd className="mt-1 font-medium">Draft · belum dikirim</dd>
                  </div>
                </dl>
              </section>
              <section className="rounded-xl bg-amber-50 p-5 text-sm text-amber-950">
                <h2 className="font-semibold">Perlu Anda ketahui</h2>
                <p className="mt-2">
                  Persyaratan izin mengikuti jenis usaha dan ketentuan instansi.
                  Pengajuan tidak menjamin izin diterbitkan.
                </p>
              </section>
            </aside>
          </>
        )}
      </main>
    </div>
  );
}
