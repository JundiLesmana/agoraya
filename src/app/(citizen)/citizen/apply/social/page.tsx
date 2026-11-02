"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  SOCIAL_SERVICES,
  type SocialApplicationPayload,
  type SocialServiceOption,
} from "@/lib/social-applications/types";

type SocialFormDetails = {
  namaPemohon: string;
  kontakNotifikasi: string;
  nik: string;
  kecamatan: string;
  kelurahan: string;
  judulPengajuan: string;
  detailKebutuhan: string;
  jenisKebutuhan: string;
  jumlahAnggotaKeluarga: string;
  jenisDukungan: string;
  hubunganPemohon: string;
  jenisDarurat: string;
  lokasiKejadian: string;
  tanggalKejadian: string;
};

const INITIAL_DETAILS: SocialFormDetails = {
  namaPemohon: "",
  kontakNotifikasi: "",
  nik: "",
  kecamatan: "",
  kelurahan: "",
  judulPengajuan: "",
  detailKebutuhan: "",
  jenisKebutuhan: "",
  jumlahAnggotaKeluarga: "",
  jenisDukungan: "",
  hubunganPemohon: "",
  jenisDarurat: "",
  lokasiKejadian: "",
  tanggalKejadian: "",
};

const STEPS = ["Pilih layanan", "Isi detail", "Tinjau & kirim"] as const;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getDetailsError(
  service: SocialServiceOption,
  details: SocialFormDetails,
): string | null {
  if (!details.namaPemohon.trim()) return "Nama pemohon wajib diisi.";
  if (!isValidEmail(details.kontakNotifikasi)) {
    return "Masukkan alamat email dengan format yang benar.";
  }
  if (!/^\d{16}$/.test(details.nik)) return "NIK harus terdiri dari 16 angka.";
  if (!details.kecamatan) return "Kecamatan domisili wajib dipilih.";
  if (!details.kelurahan) return "Kelurahan / desa wajib dipilih.";
  if (!details.judulPengajuan.trim()) return "Judul pengajuan wajib diisi.";
  if (!details.detailKebutuhan.trim()) return "Detail kebutuhan wajib diisi.";

  if (service.type === "KebutuhanDasar") {
    if (!details.jenisKebutuhan) return "Jenis kebutuhan wajib dipilih.";
    if (!details.jumlahAnggotaKeluarga.trim()) {
      return "Jumlah anggota keluarga wajib diisi.";
    }
  }

  if (service.type === "DukunganKeluarga") {
    if (!details.jenisDukungan) return "Jenis dukungan wajib dipilih.";
    if (!details.hubunganPemohon) return "Hubungan pemohon wajib dipilih.";
  }

  if (service.type === "BantuanDarurat") {
    if (!details.jenisDarurat) return "Jenis keadaan darurat wajib dipilih.";
    if (!details.lokasiKejadian.trim()) return "Lokasi kejadian wajib diisi.";
    if (!details.tanggalKejadian) return "Tanggal kejadian wajib diisi.";
  }

  return null;
}

function createPayload(
  service: SocialServiceOption,
  details: SocialFormDetails,
): SocialApplicationPayload {
  const baseData = {
    namaPemohon: details.namaPemohon.trim(),
    kontakNotifikasi: details.kontakNotifikasi.trim(),
    nik: details.nik,
    kecamatan: details.kecamatan,
    kelurahan: details.kelurahan,
    judulPengajuan: details.judulPengajuan.trim(),
    detailKebutuhan: details.detailKebutuhan.trim(),
  };

  if (service.type === "KebutuhanDasar") {
    return {
      category: "social",
      serviceType: service.type,
      serviceId: "kebutuhan-dasar",
      data: {
        ...baseData,
        jenisKebutuhan: details.jenisKebutuhan,
        jumlahAnggotaKeluarga: details.jumlahAnggotaKeluarga.trim(),
      },
    };
  }

  if (service.type === "DukunganKeluarga") {
    return {
      category: "social",
      serviceType: service.type,
      serviceId: "dukungan-keluarga",
      data: {
        ...baseData,
        jenisDukungan: details.jenisDukungan,
        hubunganPemohon: details.hubunganPemohon,
      },
    };
  }

  return {
    category: "social",
    serviceType: service.type,
    serviceId: "bantuan-darurat",
    data: {
      ...baseData,
      jenisDarurat: details.jenisDarurat,
      lokasiKejadian: details.lokasiKejadian.trim(),
      tanggalKejadian: details.tanggalKejadian,
    },
  };
}

function ServiceSelector({
  selectedService,
  onSelect,
}: {
  selectedService: SocialServiceOption | null;
  onSelect: (service: SocialServiceOption) => void;
}) {
  return (
    <fieldset
      aria-label="Pilih jenis layanan sosial"
      className="grid gap-3 md:grid-cols-3"
    >
      {SOCIAL_SERVICES.map((service) => {
        const isSelected = selectedService?.id === service.id;

        return (
          <label key={service.id} className="block cursor-pointer">
            <input
              type="radio"
              name="social-service-type"
              value={service.id}
              checked={isSelected}
              onChange={() => onSelect(service)}
              className="peer sr-only"
            />
            <span
              className={`flex min-h-28 flex-col rounded-xl border p-4 transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
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

export default function SocialApplicationPage() {
  const [selectedService, setSelectedService] =
    useState<SocialServiceOption | null>(null);
  const [details, setDetails] = useState<SocialFormDetails>(INITIAL_DETAILS);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRoute, setSubmittedRoute] = useState("");

  function updateDetail(key: keyof SocialFormDetails, value: string) {
    setDetails((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function continueToReview() {
    if (!selectedService) {
      setError("Pilih jenis layanan sosial terlebih dahulu.");
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
      setError("Pilih jenis layanan sosial terlebih dahulu.");
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
      const response = await fetch("/api/social-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload(selectedService, details)),
      });

      const result: { error?: string; valid?: boolean; routeKey?: string } =
        await response.json();

      if (!response.ok || !result.valid || result.routeKey !== `social:${selectedService.id}`) {
        setError(
          result.error ??
            "Pengajuan sosial gagal divalidasi. Periksa kembali data Anda.",
        );
        return;
      }

      setSubmittedRoute(result.routeKey);
    } catch {
      setError(
        "Layanan pengajuan sosial tidak dapat dihubungi. Periksa koneksi lalu coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const showEmergencyFields = selectedService?.type === "BantuanDarurat";
  const showFamilyFields = selectedService?.type === "DukunganKeluarga";
  const showBasicFields = selectedService?.type === "KebutuhanDasar";

  return (
    <div className="bg-background min-h-[70vh] pb-12">
      <section className="border-border border-b bg-sky-50 dark:bg-sky-950/30">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-muted-foreground text-xs">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/">Beranda</Link>
              </li>
              <li aria-hidden="true">›</li>
              <li>
                <Link href="/citizen/apply">Layanan Publik</Link>
              </li>
              <li aria-hidden="true">›</li>
              <li aria-current="page">Bantuan Sosial</li>
            </ol>
          </nav>

          <div className="mt-5">
            <p className="text-primary text-xs font-semibold uppercase tracking-wide">
              Ruang warga · Bantuan sosial
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Ajukan Bantuan Sosial
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
              Sampaikan kebutuhan bantuan untuk diri sendiri atau keluarga Anda.
              Setiap layanan sosial dipisahkan agar data dikirim ke backend sesuai
              jenis layanan yang dipilih.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] lg:px-8">
        {submittedRoute ? (
          <section className="border-border bg-card rounded-xl border p-6 lg:col-span-2">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" aria-hidden="true" />
              <div>
                <h2 className="text-xl font-semibold">Pengajuan sosial tervalidasi</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Data telah dikirim ke route terpisah untuk layanan{" "}
                  <strong>{selectedService?.name}</strong>.
                </p>
                <p className="mt-3 rounded-lg bg-muted p-3 font-mono text-sm">
                  {submittedRoute}
                </p>
              </div>
            </div>
          </section>
        ) : (
          <>
            <form onSubmit={submitApplication} className="space-y-4">
              <div className="border-border bg-card rounded-xl border p-4">
                <p className="font-medium">Pengajuan dibuat oleh warga, bukan petugas.</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Isi dengan data yang benar. Setiap layanan sosial menggunakan
                  payload yang terisolasi agar backend mengirim ke CMS sesuai jenis
                  layanan yang dipilih.
                </p>
              </div>

              <ol
                aria-label="Tahapan pengajuan sosial"
                className="border-border bg-card grid gap-2 rounded-xl border p-4 sm:grid-cols-3"
              >
                {STEPS.map((label, index) => {
                  const current = index + 1;
                  const isActive = current === step;
                  const isDone = current < step;

                  return (
                    <li
                      key={label}
                      aria-current={isActive ? "step" : undefined}
                      className={`border-t-2 pt-2 text-xs ${
                        isDone || isActive
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
                    <h2 className="text-lg font-semibold">Pilih jenis layanan</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Setiap sublayanan dikelola secara terpisah agar backend hanya
                      menerima field yang sesuai untuk layanan tersebut.
                    </p>
                    <div className="mt-4">
                      <ServiceSelector
                        selectedService={selectedService}
                        onSelect={setSelectedService}
                      />
                    </div>
                  </>
                ) : null}

                {step === 2 && selectedService ? (
                  <>
                    <h2 className="text-lg font-semibold">Data pemohon & detail</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Jenis layanan: <strong>{selectedService.name}</strong>
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
                        <span className="font-medium">Email notifikasi *</span>
                        <Input
                          type="email"
                          value={details.kontakNotifikasi}
                          onChange={(event) =>
                            updateDetail("kontakNotifikasi", event.target.value)
                          }
                        />
                      </label>

                      <label className="space-y-1.5 text-sm">
                        <span className="font-medium">NIK *</span>
                        <Input
                          inputMode="numeric"
                          maxLength={16}
                          value={details.nik}
                          onChange={(event) =>
                            updateDetail("nik", event.target.value.replace(/\D/g, ""))
                          }
                        />
                      </label>

                      <label className="space-y-1.5 text-sm">
                        <span className="font-medium">Kecamatan *</span>
                        <select
                          value={details.kecamatan}
                          onChange={(event) =>
                            updateDetail("kecamatan", event.target.value)
                          }
                          className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                        >
                          <option value="">Pilih kecamatan</option>
                          <option value="Kecamatan Melati">Kecamatan Melati</option>
                        </select>
                      </label>

                      <label className="space-y-1.5 text-sm">
                        <span className="font-medium">Kelurahan / Desa *</span>
                        <select
                          value={details.kelurahan}
                          onChange={(event) =>
                            updateDetail("kelurahan", event.target.value)
                          }
                          className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                        >
                          <option value="">Pilih kelurahan / desa</option>
                          <option value="Kelurahan Melati">Kelurahan Melati</option>
                        </select>
                      </label>

                      {showBasicFields ? (
                        <>
                          <label className="space-y-1.5 text-sm">
                            <span className="font-medium">Jenis kebutuhan *</span>
                            <select
                              value={details.jenisKebutuhan}
                              onChange={(event) =>
                                updateDetail("jenisKebutuhan", event.target.value)
                              }
                              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                            >
                              <option value="">Pilih jenis kebutuhan</option>
                              <option>Pangan</option>
                              <option>Perlengkapan dasar</option>
                              <option>Kebutuhan dasar lainnya</option>
                            </select>
                          </label>

                          <label className="space-y-1.5 text-sm">
                            <span className="font-medium">
                              Jumlah anggota keluarga *
                            </span>
                            <Input
                              inputMode="numeric"
                              value={details.jumlahAnggotaKeluarga}
                              onChange={(event) =>
                                updateDetail(
                                  "jumlahAnggotaKeluarga",
                                  event.target.value.replace(/\D/g, ""),
                                )
                              }
                            />
                          </label>
                        </>
                      ) : null}

                      {showFamilyFields ? (
                        <>
                          <label className="space-y-1.5 text-sm">
                            <span className="font-medium">Jenis dukungan *</span>
                            <select
                              value={details.jenisDukungan}
                              onChange={(event) =>
                                updateDetail("jenisDukungan", event.target.value)
                              }
                              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                            >
                              <option value="">Pilih jenis dukungan</option>
                              <option>Pendampingan keluarga</option>
                              <option>Pelatihan dan pemulihan</option>
                              <option>Dukungan keluarga lainnya</option>
                            </select>
                          </label>

                          <label className="space-y-1.5 text-sm">
                            <span className="font-medium">Hubungan pemohon *</span>
                            <select
                              value={details.hubunganPemohon}
                              onChange={(event) =>
                                updateDetail("hubunganPemohon", event.target.value)
                              }
                              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                            >
                              <option value="">Pilih hubungan</option>
                              <option>Diri sendiri</option>
                              <option>Orang tua / wali</option>
                              <option>Anggota keluarga</option>
                            </select>
                          </label>
                        </>
                      ) : null}

                      {showEmergencyFields ? (
                        <>
                          <label className="space-y-1.5 text-sm">
                            <span className="font-medium">Jenis darurat *</span>
                            <select
                              value={details.jenisDarurat}
                              onChange={(event) =>
                                updateDetail("jenisDarurat", event.target.value)
                              }
                              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                            >
                              <option value="">Pilih jenis darurat</option>
                              <option>Bencana alam</option>
                              <option>Kebakaran</option>
                              <option>Kondisi darurat lainnya</option>
                            </select>
                          </label>

                          <label className="space-y-1.5 text-sm">
                            <span className="font-medium">Tanggal kejadian *</span>
                            <Input
                              type="date"
                              value={details.tanggalKejadian}
                              onChange={(event) =>
                                updateDetail("tanggalKejadian", event.target.value)
                              }
                            />
                          </label>

                          <label className="space-y-1.5 text-sm sm:col-span-2">
                            <span className="font-medium">Lokasi kejadian *</span>
                            <Input
                              value={details.lokasiKejadian}
                              onChange={(event) =>
                                updateDetail("lokasiKejadian", event.target.value)
                              }
                            />
                          </label>
                        </>
                      ) : null}

                      <label className="space-y-1.5 text-sm sm:col-span-2">
                        <span className="font-medium">Judul pengajuan *</span>
                        <Input
                          value={details.judulPengajuan}
                          onChange={(event) =>
                            updateDetail("judulPengajuan", event.target.value)
                          }
                        />
                      </label>

                      <label className="space-y-1.5 text-sm sm:col-span-2">
                        <span className="font-medium">Ceritakan kebutuhan Anda *</span>
                        <Textarea
                          rows={4}
                          value={details.detailKebutuhan}
                          onChange={(event) =>
                            updateDetail("detailKebutuhan", event.target.value)
                          }
                        />
                        <span className="text-muted-foreground block text-xs">
                          Jangan tuliskan NIK atau nomor rekening di kolom uraian.
                        </span>
                      </label>
                    </div>
                  </>
                ) : null}

                {step === 3 && selectedService ? (
                  <>
                    <h2 className="text-lg font-semibold">Tinjau sebelum kirim</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Periksa ulang data berikut. Payload yang dikirim akan dibatasi
                      untuk layanan <strong>{selectedService.name}</strong> saja.
                    </p>

                    <dl className="border-border mt-4 grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-muted-foreground text-xs">Jenis layanan</dt>
                        <dd className="mt-1 font-medium">{selectedService.name}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground text-xs">Lembaga tujuan</dt>
                        <dd className="mt-1 font-medium">Dinas Sosial</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground text-xs">Nama pemohon</dt>
                        <dd className="mt-1 font-medium">{details.namaPemohon}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground text-xs">Kontak notifikasi</dt>
                        <dd className="mt-1 font-medium">{details.kontakNotifikasi}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground text-xs">Wilayah</dt>
                        <dd className="mt-1 font-medium">
                          {details.kelurahan}, {details.kecamatan}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground text-xs">Judul pengajuan</dt>
                        <dd className="mt-1 font-medium">{details.judulPengajuan}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-muted-foreground text-xs">Detail kebutuhan</dt>
                        <dd className="mt-1 whitespace-pre-wrap font-medium">
                          {details.detailKebutuhan}
                        </dd>
                      </div>
                    </dl>
                  </>
                ) : null}

                {error ? (
                  <p role="alert" className="mt-4 text-sm text-destructive">
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
                      Lanjut ke detail
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}

                  {step === 2 ? (
                    <Button type="button" onClick={continueToReview}>
                      Tinjau pengajuan
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}

                  {step === 3 ? (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Mengirim..." : "Kirim pengajuan"}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
              </section>
            </form>

            <aside className="space-y-4">
              <section className="border-border bg-card rounded-xl border p-5">
                <h2 className="font-semibold">Ringkasan</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <div className="border-border rounded-lg border p-3">
                    <dt className="text-muted-foreground text-xs">Layanan</dt>
                    <dd className="mt-1 font-medium">
                      {selectedService?.name ?? "Belum dipilih"}
                    </dd>
                  </div>
                  <div className="border-border rounded-lg border p-3">
                    <dt className="text-muted-foreground text-xs">Instansi</dt>
                    <dd className="mt-1 font-medium">Dinas Sosial</dd>
                  </div>
                  <div className="border-border rounded-lg border p-3">
                    <dt className="text-muted-foreground text-xs">Status</dt>
                    <dd className="mt-1 font-medium">Draft · belum dikirim</dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-xl bg-sky-50 p-5 text-sm dark:bg-sky-950/30">
                <h2 className="font-semibold">Perlu diketahui</h2>
                <p className="text-muted-foreground mt-2">
                  Data pribadi hanya digunakan oleh instansi terkait untuk memproses
                  layanan. Jangan masukkan informasi sensitif di kolom uraian.
                </p>
              </section>
            </aside>
          </>
        )}
      </main>
    </div>
  );
}
