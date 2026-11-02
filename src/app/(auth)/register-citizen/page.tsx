"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Camera,
  LoaderCircle,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type UploadKind = "ktp" | "selfie";
type UploadedImage = { file: File; preview: string };

export default function RegisterCitizenPage() {
  const [form, setForm] = useState({
    nik: "",
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [images, setImages] = useState<Record<UploadKind, UploadedImage | null>>({
    ktp: null,
    selfie: null,
  });
  const [fileErrors, setFileErrors] = useState<Record<UploadKind, string>>({
    ktp: "",
    selfie: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const ktpPreview = images.ktp?.preview;
  const selfiePreview = images.selfie?.preview;

  useEffect(
    () => () => {
      if (ktpPreview && typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(ktpPreview);
      }
    },
    [ktpPreview],
  );
  useEffect(
    () => () => {
      if (selfiePreview && typeof URL.revokeObjectURL === "function") {
        URL.revokeObjectURL(selfiePreview);
      }
    },
    [selfiePreview],
  );

  function handleChange(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>, kind: UploadKind) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImages((current) => ({ ...current, [kind]: null }));
      setFileErrors((current) => ({
        ...current,
        [kind]: "Gunakan foto JPG, PNG, atau WEBP.",
      }));
      event.target.value = "";
      return;
    }
    if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
      setImages((current) => ({ ...current, [kind]: null }));
      setFileErrors((current) => ({
        ...current,
        [kind]:
          file.size === 0
            ? "Foto tidak boleh kosong."
            : "Ukuran foto maksimal 5 MB.",
      }));
      event.target.value = "";
      return;
    }

    setImages((current) => ({
      ...current,
      [kind]: { file, preview: URL.createObjectURL(file) },
    }));
    setFileErrors((current) => ({ ...current, [kind]: "" }));
    setError("");
  }

  function removeImage(kind: UploadKind) {
    setImages((current) => ({ ...current, [kind]: null }));
    setFileErrors((current) => ({ ...current, [kind]: "" }));
    const input = document.getElementById(
      kind === "ktp" ? "attachment" : "selfie",
    ) as HTMLInputElement | null;
    if (input) input.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!images.ktp || !images.selfie) {
      const missing = [
        !images.ktp && "foto KTP",
        !images.selfie && "foto selfie",
      ].filter(Boolean);
      setError(`Silakan unggah ${missing.join(" dan ")}.`);
      return;
    }

    setPending(true);
    setError("");

    try {
      const readImage = (image: UploadedImage) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve(typeof reader.result === "string" ? reader.result : "");
          reader.onerror = () => reject(new Error("Gagal membaca berkas foto."));
          reader.readAsDataURL(image.file);
        });
      const [attachment, selfie] = await Promise.all([
        readImage(images.ktp),
        readImage(images.selfie),
      ]);

      const response = await fetch("/api/citizen/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nik: form.nik.trim(),
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
          attachment,
          attachmentFileName: images.ktp.file.name,
          attachmentMimeType: images.ktp.file.type,
          selfie,
          selfieFileName: images.selfie.file.name,
          selfieMimeType: images.selfie.file.type,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          (result as { error?: string }).error ??
            "Pendaftaran gagal. Silakan coba kembali.",
        );
        return;
      }

      setSuccess(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error && submitError.message.startsWith("Gagal")
          ? submitError.message
          : "Tidak dapat terhubung. Periksa koneksi Anda lalu coba kembali.",
      );
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <main className="flex min-h-screen flex-col bg-[#f8fafc] text-[#192b40]">
        <header className="h-16 shrink-0 border-b border-[#e5ebf1] bg-white">
          <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-5 sm:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2"
              aria-label="Agoraya — beranda"
            >
              <Image
                src="/logo/brand.svg"
                alt=""
                width={30}
                height={32}
                priority
              />
              <span className="flex flex-col leading-tight">
                <span className="text-base font-bold tracking-[-0.04em] text-[#192b40]">
                  Agoraya
                </span>
                <span className="mt-0.5 text-[0.58rem] text-[#738397]">
                  Data Publik, Untuk Semua
                </span>
              </span>
            </Link>
            <nav aria-label="Navigasi bantuan" className="flex items-center gap-4 sm:gap-6">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium text-[#66788b] transition-colors hover:text-[#1265c9] sm:text-xs"
              >
                <ArrowLeft aria-hidden="true" className="size-3.5" />
                <span className="hidden sm:inline">Kembali ke masuk</span>
                <span className="sm:hidden">Kembali</span>
              </Link>
            </nav>
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-10">
          <section aria-label="Pendaftaran akun warga" className="grid w-full max-w-[930px] overflow-hidden rounded-xl bg-transparent lg:min-h-[510px] lg:grid-cols-2 lg:gap-[60px]">
            <div className="relative isolate flex min-h-[460px] flex-col overflow-hidden rounded-xl bg-[#eaf4fb] px-7 pt-7 sm:px-9 sm:pt-8 lg:min-h-[510px] lg:px-[30px] lg:pt-[30px]">
              <div className="relative z-10 max-w-[370px]">
                <h1 className="max-w-[24ch] text-[1.65rem] leading-[1.17] font-bold tracking-[-0.035em] text-[#192b40] sm:text-[1.8rem]">
                  Daftar sebagai warga Agoraya
                </h1>
                <p className="mt-3 max-w-[350px] text-xs leading-5 text-[#65788d] sm:text-[0.8rem] sm:leading-6">
                  Buat akun untuk mengakses layanan publik, pelaporan, dan
                  pengajuan izin melalui satu identitas terpercaya.
                </p>
                <p className="mt-4 inline-flex items-center gap-2 text-[0.66rem] font-medium text-[#1265c9]">
                  <ShieldCheck aria-hidden="true" className="size-4" />
                  Akun Anda akan diverifikasi sebelum diaktivasi.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center px-1 py-10 sm:px-6 lg:px-0">
              <div className="w-full max-w-[435px]">
                <p className="text-[0.62rem] font-semibold text-[#1265c9]">
                  AKUN WARGA
                </p>
                <h2 className="mt-2 text-[1.55rem] leading-tight font-bold tracking-[-0.035em] text-[#192b40] sm:text-[1.7rem]">
                  Pendaftaran berhasil
                </h2>
                <p className="mt-2 text-xs leading-5 text-[#718196] sm:text-[0.8rem]">
                  Data Anda telah kami terima dan sedang dalam proses
                  verifikasi. Anda akan mendapat pemberitahuan melalui email.
                </p>
                <div className="mt-8">
                  <Link
                    href="/login"
                    className="inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-[#1767cf] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1258b4] focus-visible:ring-4 focus-visible:ring-[#2778e5]/25 focus-visible:outline-none"
                  >
                    Masuk ke akun Anda
                    <ArrowLeft aria-hidden="true" className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className="shrink-0 border-t border-[#e5ebf1] bg-white">
          <div className="mx-auto flex min-h-[46px] max-w-[1200px] items-center justify-between gap-4 px-5 text-[0.62rem] text-[#738397] sm:px-8 sm:text-[0.68rem]">
            <span>© 2026 Agoraya. Semua hak dilindungi.</span>
          </div>
        </footer>
      </main>
    );
  }

  function UploadCard({
    id,
    title,
    icon,
    image,
    error,
    onChange,
    onRemove,
  }: {
    id: string;
    title: string;
    icon: "upload" | "camera";
    image: UploadedImage | null;
    error: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
  }) {
    const Icon = icon === "camera" ? Camera : Upload;
    const helpId = `${id}-help`;
    const errorId = `${id}-error`;

    return (
      <div>
        <p
          id={`${id}-title`}
          className="mb-1.5 text-[0.68rem] font-semibold text-[#344256]"
        >
          {title} <span className="text-[#1265c9]">*</span>
        </p>
        <label
          htmlFor={id}
          className="group relative flex min-h-[82px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-[#cbdced] bg-[#f9fbfd] px-4 py-3 text-center transition-colors hover:border-[#2778e5] hover:bg-[#f3f8fe] focus-within:border-[#2778e5] focus-within:ring-2 focus-within:ring-[#2778e5]/20"
        >
          <input
            id={id}
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            aria-labelledby={`${id}-title`}
            aria-describedby={`${helpId}${error ? ` ${errorId}` : ""}`}
            aria-invalid={Boolean(error)}
            className="sr-only"
            onChange={onChange}
            required
            type="file"
          />
          {image ? (
            <span className="flex min-w-0 items-center gap-3 text-left">
              <Image
                src={image.preview}
                alt={`Pratinjau ${title.toLowerCase()}`}
                width={52}
                height={52}
                unoptimized
                className="size-[52px] shrink-0 rounded-md border border-[#d9e3ed] object-cover"
              />
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-[#192b40]">
                  Foto siap diunggah
                </span>
                <span className="mt-1 block max-w-[230px] truncate text-[0.66rem] text-[#718196]">
                  {image.file.name}
                </span>
              </span>
            </span>
          ) : (
            <span className="flex flex-col items-center">
              <span className="mb-1.5 inline-flex size-7 items-center justify-center rounded-full bg-[#e8f1ff] text-[#1767cf] transition-transform group-hover:scale-105">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="text-[0.7rem] font-semibold text-[#24364b]">
                Unggah {title.toLowerCase()}
              </span>
              <span className="mt-0.5 text-[0.62rem] text-[#718196]">
                Format JPG, PNG, WEBP · Maks. 5 MB
              </span>
            </span>
          )}
        </label>
        <p id={helpId} className="sr-only">
          Pilih gambar JPG, PNG, atau WEBP dengan ukuran maksimal 5 megabyte.
        </p>
        {image && (
          <button
            type="button"
            onClick={onRemove}
            className="mt-1.5 inline-flex items-center gap-1 text-[0.65rem] font-medium text-[#66788b] transition-colors hover:text-[#a13c2a] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2778e5]"
            aria-label={`Hapus ${title.toLowerCase()}`}
          >
            <X aria-hidden="true" className="size-3.5" />
            Hapus foto
          </button>
        )}
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-[0.68rem] text-[#a13c2a]">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#f8fafc] text-[#192b40]">
      <header className="h-16 shrink-0 border-b border-[#e5ebf1] bg-white">
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2"
            aria-label="Agoraya — beranda"
          >
            <Image
              src="/logo/brand.svg"
              alt=""
              width={30}
              height={32}
              priority
            />
            <span className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-[-0.04em] text-[#192b40]">
                Agoraya
              </span>
              <span className="mt-0.5 text-[0.58rem] text-[#738397]">
                Data Publik, Untuk Semua
              </span>
            </span>
          </Link>
          <nav aria-label="Navigasi bantuan" className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium text-[#66788b] transition-colors hover:text-[#1265c9] sm:text-xs"
            >
              <ArrowLeft aria-hidden="true" className="size-3.5" />
              <span className="hidden sm:inline">Kembali ke masuk</span>
              <span className="sm:hidden">Kembali</span>
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-10">
        <section
          aria-label="Daftar akun warga Agoraya"
          className="grid w-full max-w-[930px] overflow-hidden rounded-xl bg-transparent lg:min-h-[510px] lg:grid-cols-2 lg:gap-[60px]"
        >
          <div className="relative isolate flex min-h-[460px] flex-col overflow-hidden rounded-xl bg-[#eaf4fb] px-7 pt-7 sm:px-9 sm:pt-8 lg:min-h-[510px] lg:px-[30px] lg:pt-[30px]">
            <div className="relative z-10 max-w-[370px]">
              <h1 className="max-w-[24ch] text-[1.65rem] leading-[1.17] font-bold tracking-[-0.035em] text-[#192b40] sm:text-[1.8rem]">
                Daftar sebagai warga Agoraya
              </h1>
              <p className="mt-3 max-w-[350px] text-xs leading-5 text-[#65788d] sm:text-[0.8rem] sm:leading-6">
                Buat akun untuk mengakses layanan publik, pelaporan, dan
                pengajuan izin melalui satu identitas terpercaya.
              </p>
              <p className="mt-4 inline-flex items-center gap-2 text-[0.66rem] font-medium text-[#1265c9]">
                <ShieldCheck aria-hidden="true" className="size-4" />
                Akun Anda akan diverifikasi sebelum diaktivasi.
              </p>
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%] overflow-hidden sm:h-[47%]"
            >
              <Image
                src="/landing/hero-mobile.png"
                alt=""
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 435px"
                className="object-cover object-[50%_68%]"
              />
              <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#eaf4fb] to-transparent" />
            </div>
          </div>

          <div className="flex items-center justify-center px-1 py-10 sm:px-6 lg:px-0">
            <div className="w-full max-w-[435px]">
              <p className="text-[0.62rem] font-semibold text-[#1265c9]">
                AKUN WARGA
              </p>
              <h2 className="mt-2 text-[1.55rem] leading-tight font-bold tracking-[-0.035em] text-[#192b40] sm:text-[1.7rem]">
                Buat akun baru
              </h2>
              <p className="mt-2 text-xs leading-5 text-[#718196] sm:text-[0.8rem]">
                Isi data pribadi Anda, lalu unggah foto KTP dan selfie.
              </p>

              {error && (
                <p
                  aria-live="polite"
                  className="mt-4 rounded-lg border border-[#edc8c0] bg-[#fff4f1] px-3.5 py-3 text-sm leading-5 text-[#a13c2a]"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
                <div>
                  <label
                    htmlFor="nik"
                    className="mb-1.5 block text-[0.68rem] font-semibold text-[#344256]"
                  >
                    NIK (16 digit)
                  </label>
                  <input
                    autoComplete="off"
                    className="h-10 w-full rounded-lg border border-[#cfdeeb] bg-transparent px-3 text-xs text-[#192b40] transition outline-none placeholder:text-[#718196] focus:border-[#2778e5] focus:ring-2 focus:ring-[#2778e5]/15"
                    id="nik"
                    maxLength={16}
                    onChange={(event) => handleChange("nik", event.target.value)}
                    placeholder="Masukkan NIK 16 digit"
                    required
                    value={form.nik}
                  />
                </div>

                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-[0.68rem] font-semibold text-[#344256]"
                  >
                    Nama lengkap
                  </label>
                  <input
                    autoComplete="name"
                    className="h-10 w-full rounded-lg border border-[#cfdeeb] bg-transparent px-3 text-xs text-[#192b40] transition outline-none placeholder:text-[#718196] focus:border-[#2778e5] focus:ring-2 focus:ring-[#2778e5]/15"
                    id="name"
                    onChange={(event) => handleChange("name", event.target.value)}
                    placeholder="Masukkan nama lengkap"
                    required
                    value={form.name}
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-[0.68rem] font-semibold text-[#344256]"
                  >
                    Email
                  </label>
                  <input
                    autoComplete="email"
                    className="h-10 w-full rounded-lg border border-[#cfdeeb] bg-transparent px-3 text-xs text-[#192b40] transition outline-none placeholder:text-[#718196] focus:border-[#2778e5] focus:ring-2 focus:ring-[#2778e5]/15"
                    id="email"
                    onChange={(event) => handleChange("email", event.target.value)}
                    placeholder="Masukkan email"
                    required
                    type="email"
                    value={form.email}
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-1.5 block text-[0.68rem] font-semibold text-[#344256]"
                  >
                    Nomor telepon
                  </label>
                  <input
                    autoComplete="tel"
                    className="h-10 w-full rounded-lg border border-[#cfdeeb] bg-transparent px-3 text-xs text-[#192b40] transition outline-none placeholder:text-[#718196] focus:border-[#2778e5] focus:ring-2 focus:ring-[#2778e5]/15"
                    id="phone"
                    onChange={(event) => handleChange("phone", event.target.value)}
                    placeholder="Masukkan nomor telepon"
                    required
                    value={form.phone}
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-[0.68rem] font-semibold text-[#344256]"
                  >
                    Kata sandi
                  </label>
                  <input
                    autoComplete="new-password"
                    className="h-10 w-full rounded-lg border border-[#cfdeeb] bg-transparent px-3 text-xs text-[#192b40] transition outline-none placeholder:text-[#718196] focus:border-[#2778e5] focus:ring-2 focus:ring-[#2778e5]/15"
                    id="password"
                    onChange={(event) => handleChange("password", event.target.value)}
                    placeholder="Buat kata sandi"
                    required
                    type="password"
                    value={form.password}
                  />
                </div>

                <UploadCard
                  id="attachment"
                  title="Foto KTP"
                  icon="upload"
                  image={images.ktp}
                  error={fileErrors.ktp}
                  onChange={(event) => handleFileChange(event, "ktp")}
                  onRemove={() => removeImage("ktp")}
                />

                <UploadCard
                  id="selfie"
                  title="Foto selfie"
                  icon="camera"
                  image={images.selfie}
                  error={fileErrors.selfie}
                  onChange={(event) => handleFileChange(event, "selfie")}
                  onRemove={() => removeImage("selfie")}
                />

                <button
                  className="group inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-[#1767cf] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1258b4] focus-visible:ring-4 focus-visible:ring-[#2778e5]/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={pending}
                  type="submit"
                >
                  {pending ? (
                    <>
                      <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                      Mendaftar…
                    </>
                  ) : (
                    <>
                      Daftar Akun Warga
                    </>
                  )}
                </button>
              </form>

              <p className="pt-0.5 text-center text-[0.68rem] text-[#68798d]">
                Sudah punya akun?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#1265c9] transition-colors hover:text-[#0f4fa0]"
                >
                  Masuk di sini
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="shrink-0 border-t border-[#e5ebf1] bg-white">
        <div className="mx-auto flex min-h-[46px] max-w-[1200px] items-center justify-between gap-4 px-5 text-[0.62rem] text-[#738397] sm:px-8 sm:text-[0.68rem]">
          <span>© 2026 Agoraya. Semua hak dilindungi.</span>
        </div>
      </footer>
    </main>
  );
}
