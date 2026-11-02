"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  HEALTH_SERVICES,
  type HealthApplicationPayload,
  type HealthServiceOption,
} from "@/lib/health-applications/types";

type HealthDetails = {
  namaPemohon: string;
  kontakNotifikasi: string;
  kecamatan: string;
  kelurahan: string;
  judulPengajuan: string;
  uraian: string;
  topikKonsultasi: string;
  puskesmasTujuan: string;
  jenisLayanan: string;
  namaPasien: string;
  tanggalPilihan: string;
  namaFasilitas: string;
  lokasiFasilitas: string;
  kategoriAduan: string;
};

const INITIAL_DETAILS: HealthDetails = {
  namaPemohon: "",
  kontakNotifikasi: "",
  kecamatan: "",
  kelurahan: "",
  judulPengajuan: "",
  uraian: "",
  topikKonsultasi: "",
  puskesmasTujuan: "",
  jenisLayanan: "",
  namaPasien: "",
  tanggalPilihan: "",
  namaFasilitas: "",
  lokasiFasilitas: "",
  kategoriAduan: "",
};

const STEP_LABELS = [
  "Pilih layanan",
  "Isi detail",
  "Lampiran",
  "Tinjau & kirim",
] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getDetailsError(
  service: HealthServiceOption,
  details: HealthDetails,
): string | null {
  if (!details.namaPemohon.trim()) return "Nama pemohon wajib diisi.";
  if (!isValidEmail(details.kontakNotifikasi)) {
    return "Masukkan email dengan format yang benar.";
  }
  if (!details.kecamatan) return "Kecamatan domisili wajib dipilih.";
  if (!details.kelurahan) return "Kelurahan / desa wajib dipilih.";
  if (!details.judulPengajuan.trim()) return "Judul pengajuan wajib diisi.";
  if (!details.uraian.trim()) return "Uraian pengajuan wajib diisi.";

  if (service.type === "KonsultasiInformasi") {
    if (!details.topikKonsultasi) return "Topik konsultasi wajib dipilih.";
    if (!details.puskesmasTujuan) return "Puskesmas tujuan wajib dipilih.";
  } else if (service.type === "PermohonanLayananPuskesmas") {
    if (!details.jenisLayanan) return "Jenis layanan wajib dipilih.";
    if (!details.namaPasien.trim()) return "Nama pasien wajib diisi.";
    if (!details.tanggalPilihan) return "Tanggal pilihan wajib diisi.";
    if (!details.puskesmasTujuan) return "Puskesmas tujuan wajib dipilih.";
  } else {
    if (!details.namaFasilitas.trim()) return "Nama fasilitas wajib diisi.";
    if (!details.lokasiFasilitas.trim()) return "Lokasi fasilitas wajib diisi.";
    if (!details.kategoriAduan) return "Kategori aduan wajib dipilih.";
  }
  return null;
}

function createPayload(
  service: HealthServiceOption,
  details: HealthDetails,
): HealthApplicationPayload {
  const commonData = {
    namaPemohon: details.namaPemohon.trim(),
    kontakNotifikasi: details.kontakNotifikasi.trim(),
    kecamatan: details.kecamatan,
    kelurahan: details.kelurahan,
    judulPengajuan: details.judulPengajuan.trim(),
    uraian: details.uraian.trim(),
  };

  if (service.type === "KonsultasiInformasi") {
    return {
      category: "health",
      serviceType: service.type,
      serviceId: "konsultasi-informasi",
      data: {
        ...commonData,
        topikKonsultasi: details.topikKonsultasi,
        puskesmasTujuan: details.puskesmasTujuan,
      },
    };
  }

  if (service.type === "PermohonanLayananPuskesmas") {
    return {
      category: "health",
      serviceType: service.type,
      serviceId: "permohonan-layanan-puskesmas",
      data: {
        ...commonData,
        jenisLayanan: details.jenisLayanan,
        namaPasien: details.namaPasien.trim(),
        tanggalPilihan: details.tanggalPilihan,
        puskesmasTujuan: details.puskesmasTujuan,
      },
    };
  }

  return {
    category: "health",
    serviceType: service.type,
    serviceId: "aduan-fasilitas-kesehatan",
    data: {
      ...commonData,
      namaFasilitas: details.namaFasilitas.trim(),
      lokasiFasilitas: details.lokasiFasilitas.trim(),
      kategoriAduan: details.kategoriAduan,
    },
  };
}

function ServiceSelection({
  selectedService,
  onSelect,
}: {
  selectedService: HealthServiceOption | null;
  onSelect: (service: HealthServiceOption) => void;
}) {
  return (
    <fieldset
      aria-label="Pilih jenis layanan kesehatan"
      className="grid gap-3 md:grid-cols-3"
    >
      {HEALTH_SERVICES.map((service) => {
        const selected = selectedService?.id === service.id;

        return (
          <label key={service.id} className="block cursor-pointer">
            <input
              type="radio"
              name="health-service"
              value={service.id}
              checked={selected}
              onChange={() => onSelect(service)}
              className="peer sr-only"
            />
            <span
              className={`flex min-h-32 flex-col rounded-xl border p-4 transition-colors ${
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="font-medium">{label} *</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
      >
        <option value="">Pilih {label.toLocaleLowerCase("id")}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function HealthApplicationPage() {
  const [selectedService, setSelectedService] =
    useState<HealthServiceOption | null>(null);
  const [details, setDetails] = useState<HealthDetails>(INITIAL_DETAILS);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRoute, setSubmittedRoute] = useState("");

  function updateDetail(key: keyof HealthDetails, value: string) {
    setDetails((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function addAttachments(files: FileList | null) {
    if (!files) return;
    const accepted: File[] = [];
    for (const file of Array.from(files)) {
      const extension = file.name.split(".").pop()?.toLowerCase();
      const supported =
        (extension === "pdf" && file.type === "application/pdf") ||
        ((extension === "jpg" || extension === "jpeg") &&
          file.type === "image/jpeg") ||
        (extension === "png" && file.type === "image/png");
      if (!supported) {
        setError("Lampiran harus berupa PDF, JPG, atau PNG.");
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("Ukuran setiap lampiran maksimal 10 MB.");
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length) {
      setAttachments((current) => [...current, ...accepted]);
      setError("");
    }
  }

  function goToAttachments() {
    if (!selectedService) {
      setError("Pilih jenis layanan kesehatan terlebih dahulu.");
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

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedService) {
      setError("Pilih jenis layanan kesehatan terlebih dahulu.");
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
      const response = await fetch("/api/health-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload(selectedService, details)),
      });
      const result: { error?: string; valid?: boolean; routeKey?: string } =
        await response.json();
      const expectedRouteKey = `health:${selectedService.id}`;
      if (
        !response.ok ||
        !result.valid ||
        result.routeKey !== expectedRouteKey
      ) {
        setError(
          result.error ??
            "Pengajuan layanan kesehatan gagal divalidasi. Periksa kembali data Anda.",
        );
        return;
      }
      setSubmittedRoute(result.routeKey);
    } catch {
      setError(
        "Layanan pengajuan kesehatan tidak dapat dihubungi. Periksa koneksi lalu coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const commonFields = (
    <>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium">Nama pemohon *</span>
        <Input
          value={details.namaPemohon}
          onChange={(event) => updateDetail("namaPemohon", event.target.value)}
        />
      </label>
      <label className="space-y-1.5 text-sm">
        <span className="font-medium">Kontak notifikasi (email) *</span>
        <Input
          type="email"
          value={details.kontakNotifikasi}
          onChange={(event) =>
            updateDetail("kontakNotifikasi", event.target.value)
          }
        />
      </label>
      <SelectField
        label="Kecamatan domisili"
        value={details.kecamatan}
        onChange={(value) => updateDetail("kecamatan", value)}
        options={["Kecamatan Melati"]}
      />
      <SelectField
        label="Kelurahan / desa"
        value={details.kelurahan}
        onChange={(value) => updateDetail("kelurahan", value)}
        options={["Kelurahan Melati"]}
      />
      <label className="space-y-1.5 text-sm sm:col-span-2">
        <span className="font-medium">Judul pengajuan *</span>
        <Input
          value={details.judulPengajuan}
          onChange={(event) =>
            updateDetail("judulPengajuan", event.target.value)
          }
        />
      </label>
    </>
  );

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
                <Link href="/citizen/apply">Layanan Publik</Link>
              </li>
              <li aria-hidden="true">›</li>
              <li aria-current="page">Kesehatan</li>
            </ol>
          </nav>
          <div className="mt-5">
            <p className="text-primary text-xs font-semibold tracking-wide uppercase">
              Ruang warga · Kesehatan
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Ajukan Layanan Kesehatan
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
              Pilih layanan kesehatan pemerintah yang sesuai, lengkapi informasi
              yang diperlukan, lalu tinjau sebelum mengirim.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] lg:px-8">
        {submittedRoute ? (
          <section className="border-border bg-card rounded-xl border p-6 lg:col-span-2">
            <div className="flex items-start gap-3">
              <CheckCircle2
                className="text-primary mt-0.5 size-6 shrink-0"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-xl font-semibold">
                  Payload layanan tervalidasi
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Jenis layanan dipisahkan untuk diteruskan ke Dinas Kesehatan.
                </p>
                <p className="bg-muted mt-3 rounded-lg p-3 font-mono text-sm">
                  {submittedRoute}
                </p>
                <p className="text-muted-foreground mt-3 text-xs">
                  Endpoint saat ini memvalidasi payload. Pengiriman atau
                  penyimpanan ke CMS produksi dan unggahan lampiran memerlukan
                  integrasi backend yang dikonfigurasi.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <>
            <form onSubmit={submitApplication} className="space-y-4">
              <div className="border-border bg-card rounded-xl border p-4">
                <p className="font-medium">
                  Pilih layanan untuk menampilkan formulir yang sesuai.
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Jangan masukkan rincian diagnosis atau informasi medis
                  sensitif yang tidak dibutuhkan. Formulir ini bukan layanan
                  darurat.
                </p>
              </div>

              <ol
                aria-label="Tahapan pengajuan layanan kesehatan"
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
                      Tiga kategori layanan Kesehatan untuk kebutuhan informasi,
                      permohonan, dan penyampaian aduan fasilitas.
                    </p>
                    <div className="mt-4">
                      <ServiceSelection
                        selectedService={selectedService}
                        onSelect={(service) => {
                          setSelectedService(service);
                          setDetails((current) => ({
                            ...current,
                            judulPengajuan: service.name,
                          }));
                        }}
                      />
                    </div>
                  </>
                ) : null}

                {step === 2 && selectedService ? (
                  <>
                    <h2 className="text-lg font-semibold">
                      Data pemohon & detail
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Layanan terpilih: <strong>{selectedService.name}</strong>
                    </p>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {commonFields}

                      {selectedService.type === "KonsultasiInformasi" ? (
                        <>
                          <SelectField
                            label="Topik konsultasi"
                            value={details.topikKonsultasi}
                            onChange={(value) =>
                              updateDetail("topikKonsultasi", value)
                            }
                            options={[
                              "Jadwal dan lokasi layanan",
                              "Alur administrasi",
                              "Program kesehatan masyarakat",
                              "Informasi layanan lainnya",
                            ]}
                          />
                          <SelectField
                            label="Puskesmas tujuan"
                            value={details.puskesmasTujuan}
                            onChange={(value) =>
                              updateDetail("puskesmasTujuan", value)
                            }
                            options={["Puskesmas Melati"]}
                          />
                        </>
                      ) : null}

                      {selectedService.type === "PermohonanLayananPuskesmas" ? (
                        <>
                          <SelectField
                            label="Jenis layanan"
                            value={details.jenisLayanan}
                            onChange={(value) =>
                              updateDetail("jenisLayanan", value)
                            }
                            options={[
                              "Pendaftaran / jadwal layanan",
                              "Administrasi kesehatan",
                              "Layanan kesehatan masyarakat",
                              "Layanan lainnya",
                            ]}
                          />
                          <label className="space-y-1.5 text-sm">
                            <span className="font-medium">Nama pasien *</span>
                            <Input
                              value={details.namaPasien}
                              onChange={(event) =>
                                updateDetail("namaPasien", event.target.value)
                              }
                            />
                          </label>
                          <label className="space-y-1.5 text-sm">
                            <span className="font-medium">
                              Tanggal pilihan *
                            </span>
                            <Input
                              type="date"
                              value={details.tanggalPilihan}
                              onChange={(event) =>
                                updateDetail(
                                  "tanggalPilihan",
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                          <SelectField
                            label="Puskesmas tujuan"
                            value={details.puskesmasTujuan}
                            onChange={(value) =>
                              updateDetail("puskesmasTujuan", value)
                            }
                            options={["Puskesmas Melati"]}
                          />
                        </>
                      ) : null}

                      {selectedService.type === "AduanFasilitasKesehatan" ? (
                        <>
                          <label className="space-y-1.5 text-sm">
                            <span className="font-medium">
                              Nama fasilitas kesehatan *
                            </span>
                            <Input
                              value={details.namaFasilitas}
                              onChange={(event) =>
                                updateDetail(
                                  "namaFasilitas",
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                          <label className="space-y-1.5 text-sm">
                            <span className="font-medium">
                              Lokasi fasilitas *
                            </span>
                            <Input
                              value={details.lokasiFasilitas}
                              onChange={(event) =>
                                updateDetail(
                                  "lokasiFasilitas",
                                  event.target.value,
                                )
                              }
                            />
                          </label>
                          <SelectField
                            label="Kategori aduan"
                            value={details.kategoriAduan}
                            onChange={(value) =>
                              updateDetail("kategoriAduan", value)
                            }
                            options={[
                              "Sarana dan prasarana",
                              "Informasi layanan",
                              "Administrasi",
                              "Lainnya",
                            ]}
                          />
                        </>
                      ) : null}

                      <label className="space-y-1.5 text-sm sm:col-span-2">
                        <span className="font-medium">
                          Uraian kebutuhan / pertanyaan *
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
                      {selectedService.attachmentGuidance} Format PDF, JPG, atau
                      PNG; maksimal 10 MB per berkas.
                    </p>
                    <label className="border-border bg-background mt-4 flex cursor-pointer flex-col gap-3 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="flex items-center gap-3">
                        <FileText
                          className="text-primary size-5"
                          aria-hidden="true"
                        />
                        <span>
                          <span className="block font-medium">
                            Pilih dokumen pendukung
                          </span>
                          <span className="text-muted-foreground block text-xs">
                            Lampiran disimpan sementara di halaman ini.
                          </span>
                        </span>
                      </span>
                      <Input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                        className="max-w-xs"
                        aria-label="Pilih lampiran layanan kesehatan"
                        onChange={(event) => {
                          addAttachments(event.currentTarget.files);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                    {attachments.length ? (
                      <ul className="mt-3 space-y-2 text-sm">
                        {attachments.map((file, index) => (
                          <li
                            key={`${file.name}-${index}`}
                            className="border-border flex items-center justify-between rounded-lg border p-3"
                          >
                            <span>{file.name}</span>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                setAttachments((current) =>
                                  current.filter(
                                    (_, fileIndex) => fileIndex !== index,
                                  ),
                                )
                              }
                            >
                              Hapus
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground mt-3 text-sm">
                        Belum ada lampiran. Anda dapat melanjutkan tanpa dokumen
                        jika tidak diperlukan.
                      </p>
                    )}
                    <p className="mt-4 rounded-lg bg-sky-50 p-3 text-xs text-sky-950">
                      Catatan: file belum diunggah atau dikirim ke CMS;
                      integrasi penyimpanan lampiran memerlukan endpoint unggah
                      tersendiri.
                    </p>
                  </>
                ) : null}

                {step === 4 && selectedService ? (
                  <>
                    <h2 className="text-lg font-semibold">Tinjau & kirim</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Pastikan layanan dan informasi pengajuan sudah benar.
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
                        <dd className="mt-1 font-medium">Dinas Kesehatan</dd>
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
                          Judul pengajuan
                        </dt>
                        <dd className="mt-1 font-medium">
                          {details.judulPengajuan}
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
                      <div className="sm:col-span-2">
                        <dt className="text-muted-foreground text-xs">
                          Lampiran
                        </dt>
                        <dd className="mt-1 font-medium">
                          {attachments.length
                            ? attachments.map((file) => file.name).join(", ")
                            : "Tidak ada"}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
                      Jangan gunakan formulir ini untuk kondisi darurat medis.
                      Hubungi layanan darurat atau fasilitas kesehatan terdekat.
                    </p>
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
                      Isi detail
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                  {step === 2 ? (
                    <Button type="button" onClick={goToAttachments}>
                      Lanjut ke lampiran
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                  {step === 3 ? (
                    <Button type="button" onClick={() => setStep(4)}>
                      Tinjau pengajuan
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
                    <dt className="text-muted-foreground text-xs">Instansi</dt>
                    <dd className="mt-1 font-medium">Dinas Kesehatan</dd>
                  </div>
                  <div className="border-border rounded-lg border p-3">
                    <dt className="text-muted-foreground text-xs">Status</dt>
                    <dd className="mt-1 font-medium">Draft · belum dikirim</dd>
                  </div>
                </dl>
              </section>
              <section className="rounded-xl bg-sky-50 p-5 text-sm dark:bg-sky-950/30">
                <h2 className="font-semibold">Perlindungan informasi</h2>
                <p className="text-muted-foreground mt-2">
                  Sampaikan informasi secukupnya. Jangan menuliskan NIK, nomor
                  rekam medis, atau rincian diagnosis di uraian bebas.
                </p>
              </section>
            </aside>
          </>
        )}
      </main>
    </div>
  );
}
