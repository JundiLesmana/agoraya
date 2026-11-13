"use client";

import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GeoCascadingSelect } from "@/components/forms/geo-cascading-select";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  CheckCircle,
  Clipboard,
  Clock3,
  Shield,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Edit,
} from "lucide-react";
import Link from "next/link";

type Step = 1 | 2 | 3 | 4 | 5;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_DOC_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const ACCEPTED_SELFIE_TYPES = ["image/jpeg", "image/png"];

interface RegisterAsnFormProps {
  initialStep?: Step;
  onStepChange?: (step: Step, completedSteps: number[]) => void;
  onSuccess?: (details: RegistrationConfirmationDetails) => void;
}

export interface RegistrationConfirmationDetails {
  name: string;
  email: string;
  agencyName: string;
  unitWork: string;
  status: string;
}

export function RegisterAsnConfirmation({
  details,
}: {
  details: RegistrationConfirmationDetails;
}) {
  const [copyMessage, setCopyMessage] = useState("");

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(details.email);
      setCopyMessage("Email terdaftar berhasil disalin.");
    } catch {
      setCopyMessage(
        "Tidak dapat menyalin email. Silakan salin secara manual.",
      );
    }
  };

  const statusLabel =
    details.status === "pending_approval" || details.status === "pending"
      ? "Menunggu persetujuan"
      : "Menunggu pemeriksaan";

  return (
    <main className="flex min-h-screen flex-col bg-[#f8fafc] text-[#192b40]">
      <header className="shrink-0 border-b border-[#e5ebf1] bg-white">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8">
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
          <nav
            aria-label="Navigasi bantuan"
            className="flex items-center gap-4 sm:gap-6"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#66788b] transition-colors hover:text-[#1265c9] focus-visible:ring-2 focus-visible:ring-[#1265c9] focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <ArrowLeft aria-hidden="true" className="size-3.5" />
              <span className="hidden sm:inline">Kembali ke beranda</span>
              <span className="sm:hidden">Kembali</span>
            </Link>
            <Link
              href="/tentang#faq"
              className="hidden text-xs font-medium text-[#1265c9] transition-colors hover:text-[#0f4fa0] focus-visible:ring-2 focus-visible:ring-[#1265c9] focus-visible:ring-offset-2 focus-visible:outline-none sm:inline"
            >
              Pusat bantuan
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex flex-1 justify-center px-4 py-8 sm:px-8 sm:py-10">
        <section
          aria-labelledby="registration-confirmation-title"
          className="my-auto w-full max-w-[575px]"
        >
          <div className="mb-5 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#eaf7f1] text-[#16835d]">
              <Check aria-hidden="true" className="size-6" strokeWidth={2.25} />
            </div>
            <p className="text-[0.62rem] font-semibold tracking-[0.08em] text-[#16835d]">
              PENGAJUAN BERHASIL DIKIRIM
            </p>
            <h1
              id="registration-confirmation-title"
              className="mt-2 text-[1.55rem] leading-tight font-bold tracking-[-0.035em] text-[#192b40] sm:text-[1.8rem]"
            >
              Terima kasih, {details.name}.
            </h1>
            <p className="mx-auto mt-2 max-w-[38rem] text-xs leading-5 text-[#65788d] sm:text-sm">
              Pengajuan Anda sudah diterima. Akun belum aktif dan akses ruang
              instansi menunggu persetujuan admin.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-[#d5e5fb] bg-[#e2efff] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <p className="text-[0.62rem] font-medium text-[#62768d]">
                EMAIL TERDAFTAR
              </p>
              <p className="mt-0.5 text-sm font-semibold break-all text-[#1265c9]">
                {details.email}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={copyEmail}
              className="shrink-0 justify-start text-[#1265c9] hover:bg-white/70 hover:text-[#0f4fa0] sm:justify-center"
            >
              <Clipboard aria-hidden="true" className="size-3.5" />
              Salin email
            </Button>
          </div>
          <p
            role="status"
            aria-live="polite"
            className="mt-1 min-h-4 text-center text-xs text-[#16835d]"
          >
            {copyMessage}
          </p>

          <section
            aria-labelledby="next-steps-title"
            className="mt-3 rounded-lg border border-[#e5ebf1] bg-white px-4 sm:px-5"
          >
            <h2
              id="next-steps-title"
              className="pt-4 text-sm font-semibold text-[#192b40]"
            >
              Langkah berikutnya
            </h2>
            <ol className="mt-1 divide-y divide-[#e9eef3]">
              <li className="flex gap-3 py-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#eaf7f1] text-[#16835d]">
                  <Check aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <h3 className="text-xs font-semibold text-[#192b40]">
                      Pengajuan diterima
                    </h3>
                    <span className="text-[0.6rem] font-medium text-[#16835d]">
                      Selesai
                    </span>
                  </div>
                  <p className="mt-1 text-[0.67rem] leading-4 text-[#65788d]">
                    Data dan dokumen pendaftaran telah tercatat untuk ditinjau.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 py-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e2efff] text-[#1265c9]">
                  <Clock3 aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <h3 className="text-xs font-semibold text-[#192b40]">
                      Verifikasi admin kepegawaian
                    </h3>
                    <span className="text-[0.6rem] font-medium text-[#1265c9]">
                      {statusLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-[0.67rem] leading-4 text-[#65788d]">
                    Admin instansi akan memeriksa identitas, penempatan, dan
                    dokumen Anda.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 py-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e2efff] text-[#1265c9]">
                  <Shield aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <h3 className="text-xs font-semibold text-[#192b40]">
                      Aktivasi akses instansi
                    </h3>
                    <span className="text-[0.6rem] font-medium text-[#1265c9]">
                      Belum aktif
                    </span>
                  </div>
                  <p className="mt-1 text-[0.67rem] leading-4 text-[#65788d]">
                    Setelah disetujui, Anda dapat masuk dengan akun yang
                    didaftarkan.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <dl className="mt-3 grid gap-3 rounded-lg border border-[#e5ebf1] bg-white px-4 py-3 text-xs sm:grid-cols-2 sm:px-5">
            <div>
              <dt className="text-[0.62rem] text-[#718196]">Nama pemohon</dt>
              <dd className="mt-1 font-semibold text-[#192b40]">
                {details.name}
              </dd>
            </div>
            <div>
              <dt className="text-[0.62rem] text-[#718196]">Unit kerja</dt>
              <dd className="mt-1 font-semibold text-[#192b40]">
                {details.unitWork || details.agencyName}
              </dd>
            </div>
          </dl>

          <aside className="mt-3 rounded-lg bg-[#eaf4fb] px-4 py-3 text-[0.67rem] leading-4 text-[#65788d] sm:px-5">
            <p className="font-semibold text-[#192b40]">
              Jaga informasi pendaftaran Anda
            </p>
            <p className="mt-1">
              Identitas dan dokumen hanya digunakan untuk verifikasi oleh
              petugas berwenang, dan tidak ditampilkan kepada publik.
            </p>
          </aside>

          <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
            <Button
              asChild
              className="bg-[#1265c9] text-white hover:bg-[#0f4fa0] focus-visible:ring-[#1265c9]"
            >
              <Link href="/login">Ke halaman masuk</Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="border-[#d7e1eb] bg-white text-[#1265c9] hover:bg-[#f4f8fc]"
            >
              <Link href="/">Kembali ke beranda</Link>
            </Button>
          </div>

          <p className="mt-4 text-center text-[0.62rem] leading-4 text-[#718196]">
            Informasi pendaftaran Anda hanya dapat diperiksa oleh petugas yang
            berwenang.
          </p>
        </section>
      </div>

      <footer className="shrink-0 border-t border-[#e5ebf1] bg-white">
        <div className="mx-auto flex min-h-[46px] max-w-[1200px] items-center justify-between gap-4 px-5 text-[0.62rem] text-[#738397] sm:px-8 sm:text-[0.68rem]">
          <span>© 2026 Agoraya. Semua hak dilindungi.</span>
          <Link
            href="/tentang"
            className="transition-colors hover:text-[#1265c9] focus-visible:ring-2 focus-visible:ring-[#1265c9] focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Tentang Agoraya
          </Link>
        </div>
      </footer>
    </main>
  );
}

interface UploadedFile {
  file: File;
  preview?: string;
  progress: number;
}

export function RegisterAsnForm({
  initialStep = 1,
  onStepChange,
  onSuccess,
}: RegisterAsnFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>(initialStep);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [confirmationDetails, setConfirmationDetails] =
    useState<RegistrationConfirmationDetails | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sameAsKtp, setSameAsKtp] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const updateStep = (step: Step, completed?: number[]) => {
    setCurrentStep(step);
    const newCompleted = completed !== undefined ? completed : completedSteps;
    if (onStepChange) {
      onStepChange(step, newCompleted);
    }
  };

  const [form, setForm] = useState({
    nik: "",
    name: "",
    birthPlace: "",
    birthDate: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Step 2
    employmentStatus: "PNS",
    nip: "",
    pppkNumber: "",
    rankGradePns: "",
    rankGradePppk: "",
    agencyType: "Instansi daerah",
    agencyName: "Pemerintah Kota Contoh",
    provinceTask: "Provinsi Contoh",
    regencyTask: "Kota Contoh",
    unitWork: "Dinas Komunikasi dan Informatika (contoh)",
    field: "Pengelolaan Data dan Statistik",
    positionType: "Jabatan fungsional",
    positionName: "Pranata Komputer Ahli Pertama (contoh)",
    officeAddress: "Jl. Pelayanan Publik No. 10, Kota Contoh (fiktif)",
    officialEmail: "",
    officePhone: "",
    // Step 3 - Alamat KTP
    ktpAddress: "Jl. Melati No. 23, Blok A",
    ktpRt: "001",
    ktpRw: "004",
    ktpPostalCode: "12345",
    ktpProvince: "Provinsi Contoh",
    ktpRegency: "Kota Contoh",
    ktpDistrict: "Kecamatan Harmoni",
    ktpVillage: "Kelurahan Melati",
    ktpProvinceId: "32",
    ktpRegencyId: "3273",
    ktpDistrictId: "327301",
    ktpVillageId: "32730101",
    // Step 3 - Alamat Domisili
    domAddress: "",
    domRt: "",
    domRw: "",
    domPostalCode: "",
    domProvince: "",
    domRegency: "",
    domDistrict: "",
    domVillage: "",
    domProvinceId: "",
    domRegencyId: "",
    domDistrictId: "",
    domVillageId: "",
    agreement: false,
  });

  const [uploadedFiles, setUploadedFiles] = useState<{
    ktp: UploadedFile | null;
    skPengangkatan: UploadedFile | null;
    idCard: UploadedFile | null;
    selfie: UploadedFile | null;
  }>({ ktp: null, skPengangkatan: null, idCard: null, selfie: null });

  function handleChange(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  function handleSameAsKtpChange(checked: boolean) {
    setSameAsKtp(checked);
    if (checked) {
      setForm((prev) => ({
        ...prev,
        domAddress: prev.ktpAddress,
        domRt: prev.ktpRt,
        domRw: prev.ktpRw,
        domPostalCode: prev.ktpPostalCode,
        domProvince: prev.ktpProvince,
        domRegency: prev.ktpRegency,
        domDistrict: prev.ktpDistrict,
        domVillage: prev.ktpVillage,
        domProvinceId: prev.ktpProvinceId,
        domRegencyId: prev.ktpRegencyId,
        domDistrictId: prev.ktpDistrictId,
        domVillageId: prev.ktpVillageId,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        domAddress: "",
        domRt: "",
        domRw: "",
        domPostalCode: "",
        domProvince: "",
        domRegency: "",
        domDistrict: "",
        domVillage: "",
        domProvinceId: "",
        domRegencyId: "",
        domDistrictId: "",
        domVillageId: "",
      }));
    }
    setError("");
  }

  function handleKtpGeoChange(
    level: "province" | "regency" | "district" | "village",
    id: string,
    name: string,
  ) {
    const fieldMap: Record<
      "province" | "regency" | "district" | "village",
      { id: string; name: string }
    > = {
      province: { id: "ktpProvinceId", name: "ktpProvince" },
      regency: { id: "ktpRegencyId", name: "ktpRegency" },
      district: { id: "ktpDistrictId", name: "ktpDistrict" },
      village: { id: "ktpVillageId", name: "ktpVillage" },
    };
    const { id: idField, name: nameField } = fieldMap[level];
    setForm((prev) => ({
      ...prev,
      [idField]: id,
      [nameField]: name,
    }));
    setError("");
  }

  function handleDomGeoChange(
    level: "province" | "regency" | "district" | "village",
    id: string,
    name: string,
  ) {
    const fieldMap: Record<
      "province" | "regency" | "district" | "village",
      { id: string; name: string }
    > = {
      province: { id: "domProvinceId", name: "domProvince" },
      regency: { id: "domRegencyId", name: "domRegency" },
      district: { id: "domDistrictId", name: "domDistrict" },
      village: { id: "domVillageId", name: "domVillage" },
    };
    const { id: idField, name: nameField } = fieldMap[level];
    setForm((prev) => ({
      ...prev,
      [idField]: id,
      [nameField]: name,
    }));
    setError("");
  }

  function handleFileSelect(
    e: ChangeEvent<HTMLInputElement>,
    kind: "ktp" | "skPengangkatan" | "idCard" | "selfie",
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    if (file.size > MAX_FILE_SIZE) {
      setError("Ukuran file maksimal 5MB.");
      e.target.value = "";
      return;
    }

    const allowed =
      kind === "selfie" ? ACCEPTED_SELFIE_TYPES : ACCEPTED_DOC_TYPES;
    if (!allowed.includes(file.type)) {
      if (kind === "selfie") {
        setError("Format file tidak valid. Gunakan JPG atau PNG.");
      } else {
        setError("Format file tidak valid. Gunakan JPG, PNG, atau PDF.");
      }
      e.target.value = "";
      return;
    }

    let preview: string | undefined;
    if (file.type.startsWith("image/")) {
      preview = URL.createObjectURL(file);
    }

    const uploadedFile: UploadedFile = {
      file,
      preview,
      progress: 100,
    };

    setUploadedFiles((prev) => ({ ...prev, [kind]: uploadedFile }));
    e.target.value = "";
  }

  function handleRemoveFile(
    kind: "ktp" | "skPengangkatan" | "idCard" | "selfie",
  ) {
    const entry = uploadedFiles[kind];
    if (entry?.preview && entry.file.type.startsWith("image/")) {
      URL.revokeObjectURL(entry.preview);
    }
    setUploadedFiles((prev) => ({ ...prev, [kind]: null }));
    setError("");
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function maskNIK(nik: string): string {
    if (!nik || nik.length < 8) return nik;
    return (
      nik.substring(0, 2) +
      "..........".substring(0, 10) +
      nik.substring(nik.length - 4)
    );
  }

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Gagal membaca berkas"));
      reader.readAsDataURL(file);
    });

  async function handleSaveDraft() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/asn/register/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          step: currentStep,
          data: { ...form, files: null, sameAsKtp },
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Gagal menyimpan draf");
        return;
      }
      if (result.data?.draftId) {
        setDraftId(result.data.draftId);
      }
      alert("Draf berhasil disimpan");
    } catch (e) {
      setError("Gagal menyimpan draf");
    } finally {
      setPending(false);
    }
  }

  async function handleNext() {
    if (pending) return;
    setError("");

    if (currentStep === 1) {
      // Basic validation for step 1
      if (
        !form.name?.trim() ||
        !form.nik?.trim() ||
        form.nik.trim().length !== 16 ||
        !/^\d{16}$/.test(form.nik.trim())
      ) {
        setError("NIK harus 16 digit angka");
        return;
      }
      if (!form.birthPlace?.trim() || !form.birthDate) {
        setError("Tempat dan tanggal lahir wajib diisi");
        return;
      }
      if (
        !form.email?.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
      ) {
        setError("Email tidak valid");
        return;
      }
      if (!form.phone?.trim()) {
        setError("No HP wajib diisi");
        return;
      }
      if (!form.password || form.password.length < 12) {
        setError("Password minimal 12 karakter");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Konfirmasi password tidak sama");
        return;
      }

      const updated = completedSteps.includes(1)
        ? completedSteps
        : [...completedSteps, 1];
      setCompletedSteps(updated);
      updateStep(2, updated);

      // Simpan identitas langkah 1 ke server di latar belakang, sehingga
      // langkah 2 dan 3 dapat memperbarui pendaftaran yang sudah ada.
      void fetch("/api/asn/register/step1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nik: form.nik.trim(),
          name: form.name.trim(),
          birthPlace: form.birthPlace.trim(),
          birthDate: form.birthDate,
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      }).then(async (response) => {
        const result = await response.json();
        if (response.ok && result.data?.userId) {
          setUserId(result.data.userId);
        }
      });
      return;
    }

    if (currentStep === 2) {
      if (form.employmentStatus === "PNS") {
        if (!form.nip || form.nip.length !== 18 || !/^\d+$/.test(form.nip)) {
          setError("NIP harus 18 digit angka");
          return;
        }
        if (!form.rankGradePns) {
          setError("Pangkat/golongan PNS wajib diisi");
          return;
        }
      } else if (form.employmentStatus === "PPPK") {
        if (
          !form.pppkNumber ||
          form.pppkNumber.length !== 18 ||
          !/^\d+$/.test(form.pppkNumber)
        ) {
          setError("Nomor induk PPPPK harus 18 digit angka");
          return;
        }
        if (!form.rankGradePppk) {
          setError("Pangkat/golongan PPPPK wajib diisi");
          return;
        }
      }
      if (
        !form.agencyName ||
        !form.unitWork ||
        !form.field ||
        !form.positionName ||
        !form.officeAddress
      ) {
        setError("Semua field wajib pada step ini harus diisi");
        return;
      }
      if (
        form.agencyType === "Instansi daerah" &&
        (!form.provinceTask || !form.regencyTask)
      ) {
        setError("Provinsi dan Kabupaten/Kota wilayah tugas wajib diisi");
        return;
      }

      setPending(true);
      try {
        const response = await fetch("/api/asn/register/step2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            employmentStatus: form.employmentStatus,
            nip: form.employmentStatus === "PNS" ? form.nip : undefined,
            pppkNumber:
              form.employmentStatus === "PPPK" ? form.pppkNumber : undefined,
            rankGradePns:
              form.employmentStatus === "PNS" ? form.rankGradePns : undefined,
            rankGradePppk:
              form.employmentStatus === "PPPK" ? form.rankGradePppk : undefined,
            agencyType: form.agencyType,
            agencyName: form.agencyName,
            provinceTask:
              form.agencyType === "Instansi daerah"
                ? form.provinceTask
                : undefined,
            regencyTask:
              form.agencyType === "Instansi daerah"
                ? form.regencyTask
                : undefined,
            unitWork: form.unitWork,
            field: form.field,
            positionType: form.positionType,
            positionName: form.positionName,
            officeAddress: form.officeAddress,
            officialEmail: form.officialEmail || undefined,
            officePhone: form.officePhone || undefined,
            birthPlace: form.birthPlace.trim(),
            birthDate: form.birthDate,
            phone: form.phone.trim(),
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          setError(result.error || "Gagal menyimpan data step 2");
          setPending(false);
          return;
        }
      } catch (e) {
        setError("Gagal menyimpan data step 2");
        setPending(false);
        return;
      } finally {
        setPending(false);
      }
    } else if (currentStep === 3) {
      if (!form.ktpAddress || form.ktpAddress.length < 10) {
        setError("Alamat jalan sesuai KTP minimal 10 karakter");
        return;
      }
      if (!form.ktpRt || !/^\d{3}$/.test(form.ktpRt)) {
        setError("RT harus 3 digit angka");
        return;
      }
      if (!form.ktpRw || !/^\d{3}$/.test(form.ktpRw)) {
        setError("RW harus 3 digit angka");
        return;
      }
      if (!form.ktpPostalCode || !/^\d{5}$/.test(form.ktpPostalCode)) {
        setError("Kode pos harus 5 digit angka");
        return;
      }
      if (
        !form.ktpProvince ||
        !form.ktpRegency ||
        !form.ktpDistrict ||
        !form.ktpVillage
      ) {
        setError("Semua dropdown alamat KTP wajib dipilih");
        return;
      }
      if (!sameAsKtp) {
        if (!form.domAddress || form.domAddress.length < 10) {
          setError("Alamat jalan domisili minimal 10 karakter");
          return;
        }
        if (!form.domRt || !/^\d{3}$/.test(form.domRt)) {
          setError("RT domisili harus 3 digit angka");
          return;
        }
        if (!form.domRw || !/^\d{3}$/.test(form.domRw)) {
          setError("RW domisili harus 3 digit angka");
          return;
        }
        if (!form.domPostalCode || !/^\d{5}$/.test(form.domPostalCode)) {
          setError("Kode pos domisili harus 5 digit angka");
          return;
        }
        if (
          !form.domProvince ||
          !form.domRegency ||
          !form.domDistrict ||
          !form.domVillage
        ) {
          setError("Semua dropdown alamat domisili wajib dipilih");
          return;
        }
      }

      setPending(true);
      try {
        const response = await fetch("/api/asn/register/step3", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          ktpAddress: form.ktpAddress,
          ktpRt: form.ktpRt,
            ktpRw: form.ktpRw,
            ktpPostalCode: form.ktpPostalCode,
            ktpProvince: form.ktpProvince,
            ktpRegency: form.ktpRegency,
            ktpDistrict: form.ktpDistrict,
            ktpVillage: form.ktpVillage,
            sameAsKtp,
            domAddress: sameAsKtp ? form.ktpAddress : form.domAddress,
            domRt: sameAsKtp ? form.ktpRt : form.domRt,
            domRw: sameAsKtp ? form.ktpRw : form.domRw,
            domPostalCode: sameAsKtp ? form.ktpPostalCode : form.domPostalCode,
            domProvince: sameAsKtp ? form.ktpProvince : form.domProvince,
            domRegency: sameAsKtp ? form.ktpRegency : form.domRegency,
            domDistrict: sameAsKtp ? form.ktpDistrict : form.domDistrict,
            domVillage: sameAsKtp ? form.ktpVillage : form.domVillage,
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          setError(result.error || "Gagal menyimpan data step 3");
          setPending(false);
          return;
        }
      } catch (e) {
        setError("Gagal menyimpan data step 3");
        setPending(false);
        return;
      } finally {
        setPending(false);
      }
    } else if (currentStep === 4) {
      if (!uploadedFiles.ktp) {
        setError("KTP wajib diunggah");
        return;
      }
      if (!uploadedFiles.skPengangkatan) {
        setError("SK Pengangkatan wajib diunggah");
        return;
      }
      if (!uploadedFiles.idCard) {
        setError("Kartu pegawai / ID card wajib diunggah");
        return;
      }
      const updated = completedSteps.includes(currentStep)
        ? completedSteps
        : [...completedSteps, currentStep];
      const next = (currentStep + 1) as Step;
      setCompletedSteps(updated);
      updateStep(next, updated);
      return;
    }

    const updated = completedSteps.includes(currentStep)
      ? completedSteps
      : [...completedSteps, currentStep];
    const next = (currentStep + 1) as Step;
    setCompletedSteps(updated);
    updateStep(next, updated);
  }

  async function handleFinalSubmit() {
    if (pending) return;
    if (!agreed) {
      setError("Anda harus menyetujui pernyataan sebelum mengirim pengajuan.");
      return;
    }
    if (
      !uploadedFiles.ktp ||
      !uploadedFiles.skPengangkatan ||
      !uploadedFiles.idCard
    ) {
      setError("Semua dokumen wajib harus diunggah");
      updateStep(4);
      return;
    }

    setPending(true);
    setError("");
    try {
      const [ktpDataUrl, skDataUrl, idCardDataUrl, selfieDataUrl] =
        await Promise.all([
          readFileAsDataUrl(uploadedFiles.ktp.file),
          readFileAsDataUrl(uploadedFiles.skPengangkatan.file),
          readFileAsDataUrl(uploadedFiles.idCard.file),
          uploadedFiles.selfie
            ? readFileAsDataUrl(uploadedFiles.selfie.file)
            : Promise.resolve(undefined),
        ]);

      const payload: Record<string, unknown> = {
        nik: form.nik.trim(),
        name: form.name.trim(),
        birthPlace: form.birthPlace.trim(),
        birthDate: form.birthDate,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        employmentStatus: form.employmentStatus,
        agencyName: form.agencyName.trim(),
        agencyType: form.agencyType,
        nip:
          form.employmentStatus === "PNS"
            ? form.nip.trim()
            : undefined,
        pppkNumber:
          form.employmentStatus === "PPPK"
            ? form.pppkNumber.trim()
            : undefined,
        rankGradePns:
          form.employmentStatus === "PNS"
            ? form.rankGradePns.trim()
            : undefined,
        rankGradePppk:
          form.employmentStatus === "PPPK"
            ? form.rankGradePppk.trim()
            : undefined,
        position: form.positionName.trim(),
        positionType:
          form.positionType === "Jabatan struktural"
            ? "Jabatan struktural"
            : "Jabatan fungsional",
        unit: form.unitWork.trim() || undefined,
        provinceTask:
          form.agencyType === "Instansi daerah"
            ? form.provinceTask.trim()
            : undefined,
        regencyTask:
          form.agencyType === "Instansi daerah"
            ? form.regencyTask.trim()
            : undefined,
        field: form.field.trim(),
        officeAddress: form.officeAddress.trim(),
        officialEmail: form.officialEmail.trim() || undefined,
        officePhone: form.officePhone.trim() || undefined,
        address: form.ktpAddress.trim(),
        rtRw: form.ktpRt + "/" + form.ktpRw,
        village: form.ktpVillage.trim(),
        district: form.ktpDistrict.trim(),
        regency: form.ktpRegency.trim(),
        province: form.ktpProvince.trim(),
        postalCode: form.ktpPostalCode.trim(),
        domicileSameAsKtp: sameAsKtp,
        domicileAddress: (
          sameAsKtp ? form.ktpAddress : form.domAddress
        ).trim(),
        domicileRt: sameAsKtp ? form.ktpRt : form.domRt,
        domicileRw: sameAsKtp ? form.ktpRw : form.domRw,
        domicileVillage: (
          sameAsKtp ? form.ktpVillage : form.domVillage
        ).trim(),
        domicileDistrict: (
          sameAsKtp ? form.ktpDistrict : form.domDistrict
        ).trim(),
        domicileRegency: (
          sameAsKtp ? form.ktpRegency : form.domRegency
        ).trim(),
        domicileProvince: (
          sameAsKtp ? form.ktpProvince : form.domProvince
        ).trim(),
        domicilePostalCode: sameAsKtp
          ? form.ktpPostalCode
          : form.domPostalCode,
        ktp: ktpDataUrl,
        ktpFileName: uploadedFiles.ktp.file.name,
        ktpMimeType: uploadedFiles.ktp.file.type,
        skPengangkatan: skDataUrl,
        skPengangkatanFileName: uploadedFiles.skPengangkatan.file.name,
        skPengangkatanMimeType: uploadedFiles.skPengangkatan.file.type,
        idCard: idCardDataUrl,
        idCardFileName: uploadedFiles.idCard.file.name,
        idCardMimeType: uploadedFiles.idCard.file.type,
        agreement: true,
      };

      if (selfieDataUrl && uploadedFiles.selfie) {
        payload.selfie = selfieDataUrl;
        payload.selfieFileName = uploadedFiles.selfie.file.name;
        payload.selfieMimeType = uploadedFiles.selfie.file.type;
      }

      const response = await fetch("/api/asn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Pendaftaran gagal");
        return;
      }

      const details: RegistrationConfirmationDetails = {
        name: form.name.trim(),
        email:
          typeof result.data?.email === "string"
            ? result.data.email
            : form.email.trim().toLowerCase(),
        agencyName: form.agencyName.trim(),
        unitWork: form.unitWork.trim(),
        status:
          typeof result.data?.status === "string"
            ? result.data.status
            : "pending_approval",
      };
      setConfirmationDetails(details);
      onSuccess?.(details);
      setSuccess(true);
    } catch (e) {
      setError(
        "Tidak dapat terhubung. Periksa koneksi Anda lalu coba kembali.",
      );
    } finally {
      setPending(false);
    }
  }

  if (success && confirmationDetails) {
    return <RegisterAsnConfirmation details={confirmationDetails} />;
  }

  const isStepCompleted = (step: number) => completedSteps.includes(step);
  const isStepActive = (step: number) => currentStep === step;

  return (
    <div className="space-y-6">
      {currentStep === 1 && (
        <div className="space-y-8">
          <div>
            <h2 className="mb-4 text-lg font-semibold">Identitas pribadi</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fullName">Nama lengkap *</Label>
                <Input
                  id="fullName"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Masukkan nama lengkap sesuai KTP"
                  required
                />
                <p className="text-xs text-[#5f6f85]">
                  Sesuai dengan identitas resmi
                </p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="nik">NIK *</Label>
                <Input
                  id="nik"
                  value={form.nik}
                  onChange={(e) => handleChange("nik", e.target.value)}
                  placeholder="16 digit NIK"
                  required
                  maxLength={16}
                />
                <p className="text-xs text-[#5f6f85]">
                  NIK 16 digit untuk perlindungan dan verifikasi
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthPlace">Tempat lahir *</Label>
                <Input
                  id="birthPlace"
                  value={form.birthPlace}
                  onChange={(e) => handleChange("birthPlace", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Tanggal lahir *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => handleChange("birthDate", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold">
              Kontak & keamanan akun
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="nama@instansi.go.id"
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="phone">No HP aktif *</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Minimal 12 karakter"
                  required
                  minLength={12}
                />
                <p className="text-xs text-[#5f6f85]">
                  Min 12 karakter, kombinasi huruf, angka, simbol
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  required
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <>
          <div className="space-y-8">
            <div>
              <h3 className="mb-4 text-base font-semibold">
                Status kepegawaian
              </h3>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Status ASN *</Label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="employmentStatus"
                      value="PNS"
                      checked={form.employmentStatus === "PNS"}
                      onChange={(e) =>
                        handleChange("employmentStatus", e.target.value)
                      }
                      aria-label="PNS"
                    />
                    <span className="text-sm">PNS</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="employmentStatus"
                      value="PPPK"
                      checked={form.employmentStatus === "PPPK"}
                      onChange={(e) =>
                        handleChange("employmentStatus", e.target.value)
                      }
                      aria-label="PPPK"
                    />
                    <span className="text-sm">PPPK</span>
                  </label>
                </div>
                <p className="text-xs text-[#5f6f85]">
                  Isian dan dokumen menyesuaikan status serta kebijakan
                  instansi; bukan daftar kewajiban nasional ASN.
                </p>
              </div>
              {form.employmentStatus === "PNS" && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="nip">NIP *</Label>
                    <Input
                      id="nip"
                      value={form.nip}
                      onChange={(e) => handleChange("nip", e.target.value)}
                      placeholder="18 digit angka"
                      maxLength={18}
                      required
                    />
                    <p className="text-xs text-[#5f6f85]">
                      Untuk PNS. Jika memilih PPPPK, isi Nomor induk PPPPK.
                    </p>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="rankGradePns">Pangkat/golongan PNS *</Label>
                    <select
                      id="rankGradePns"
                      value={form.rankGradePns}
                      onChange={(e) =>
                        handleChange("rankGradePns", e.target.value)
                      }
                      className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                      required
                    >
                      <option value="">Pilih pangkat/golongan</option>
                      <option value="Penata/I-C">Penata/I-C</option>
                      <option value="Penata Tk.I/I-d">Penata Tk.I/I-d</option>
                      <option value="Pembina/IV-a">Pembina/IV-a</option>
                      <option value="Pembina Tk.I/IV-b">
                        Pembina Tk.I/IV-b
                      </option>
                    </select>
                  </div>
                </div>
              )}
              {form.employmentStatus === "PPPK" && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="pppkNumber">Nomor induk PPPPK *</Label>
                    <Input
                      id="pppkNumber"
                      value={form.pppkNumber}
                      onChange={(e) =>
                        handleChange("pppkNumber", e.target.value)
                      }
                      placeholder="18 digit angka"
                      maxLength={18}
                      required
                    />
                    <p className="text-xs text-[#5f6f85]">
                      Untuk PPPPK. Tidak berlaku untuk PNS.
                    </p>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="rankGradePppk">
                      Pangkat/golongan PPPPK *
                    </Label>
                    <select
                      id="rankGradePppk"
                      value={form.rankGradePppk}
                      onChange={(e) =>
                        handleChange("rankGradePppk", e.target.value)
                      }
                      className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                      required
                    >
                      <option value="">Pilih pangkat/golongan</option>
                      <option value="Ahli Pertama">Ahli Pertama</option>
                      <option value="Ahli Muda">Ahli Muda</option>
                      <option value="Ahli Madya">Ahli Madya</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h3 className="mb-4 text-base font-semibold">
                Instansi & wilayah tugas
              </h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agencyType">Jenis instansi *</Label>
                  <select
                    id="agencyType"
                    value={form.agencyType}
                    onChange={(e) => handleChange("agencyType", e.target.value)}
                    className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                    required
                  >
                    <option value="Instansi daerah">Instansi daerah</option>
                    <option value="Instansi pusat">Instansi pusat</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agencyName">Nama instansi *</Label>
                  <Input
                    id="agencyName"
                    value={form.agencyName}
                    onChange={(e) => handleChange("agencyName", e.target.value)}
                    placeholder="Pemerintah Kota Contoh"
                    required
                  />
                </div>
                {form.agencyType === "Instansi daerah" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="provinceTask">
                        Provinsi wilayah tugas *
                      </Label>
                      <select
                        id="provinceTask"
                        value={form.provinceTask}
                        onChange={(e) =>
                          handleChange("provinceTask", e.target.value)
                        }
                        className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                        required
                      >
                        <option value="">Pilih provinsi</option>
                        <option value="Provinsi Contoh">Provinsi Contoh</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regencyTask">
                        Kabupaten/Kota wilayah tugas *
                      </Label>
                      <select
                        id="regencyTask"
                        value={form.regencyTask}
                        onChange={(e) =>
                          handleChange("regencyTask", e.target.value)
                        }
                        className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                        required
                      >
                        <option value="">Pilih kabupaten/kota</option>
                        <option value="Kota Contoh">Kota Contoh</option>
                      </select>
                    </div>
                  </>
                )}
                <p className="text-xs text-[#5f6f85]">
                  Bekerja di instansi pusat? Pilih &apos;Instansi pusat&apos;. Wilayah
                  daerah tidak diwajibkan; gunakan unit kerja dan lokasi
                  penugasan bila relevan dengan kebijakan instansi.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="unitWork">Unit kerja / OPD *</Label>
                  <Input
                    id="unitWork"
                    value={form.unitWork}
                    onChange={(e) => handleChange("unitWork", e.target.value)}
                    placeholder="Dinas Komunikasi dan Informatika (contoh)"
                    required
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-base font-semibold">
                Bidang, jabatan & kontak kedinasan
              </h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="field">Bidang *</Label>
                  <Input
                    id="field"
                    value={form.field}
                    onChange={(e) => handleChange("field", e.target.value)}
                    placeholder="Pengelolaan Data dan Statistik"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="positionType">Jenis jabatan *</Label>
                  <select
                    id="positionType"
                    value={form.positionType}
                    onChange={(e) =>
                      handleChange("positionType", e.target.value)
                    }
                    className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                    required
                  >
                    <option value="Jabatan fungsional">
                      Jabatan fungsional
                    </option>
                    <option value="Jabatan struktural">
                      Jabatan struktural
                    </option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="positionName">Nama jabatan *</Label>
                  <Input
                    id="positionName"
                    value={form.positionName}
                    onChange={(e) =>
                      handleChange("positionName", e.target.value)
                    }
                    placeholder="Pranata Komputer Ahli Pertama (contoh)"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="officeAddress">Alamat kantor *</Label>
                  <Input
                    id="officeAddress"
                    value={form.officeAddress}
                    onChange={(e) =>
                      handleChange("officeAddress", e.target.value)
                    }
                    placeholder="Jl. Pelayanan Publik No. 10, Kota Contoh (fiktif)"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="officialEmail">
                    Email kedinasan (opsional)
                  </Label>
                  <Input
                    id="officialEmail"
                    type="email"
                    value={form.officialEmail}
                    onChange={(e) =>
                      handleChange("officialEmail", e.target.value)
                    }
                    placeholder="r***@instansi.example"
                  />
                  <p className="text-xs text-[#5f6f85]">
                    Domain .example digunakan khusus sebagai data contoh.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="officePhone">Telepon kantor (opsional)</Label>
                  <Input
                    id="officePhone"
                    value={form.officePhone}
                    onChange={(e) =>
                      handleChange("officePhone", e.target.value)
                    }
                    placeholder="021-....1080"
                  />
                  <p className="text-xs text-[#5f6f85]">
                    Sertakan ekstensi bila diperlukan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {currentStep === 3 && (
        <>
          <div className="space-y-8">
            <div>
              <h3 className="mb-2 text-base font-semibold">
                Alamat sesuai KTP
              </h3>
              <p className="mb-4 text-xs text-[#5f6f85]">
                Salin alamat yang tercantum pada KTP Anda. Semua alamat pada
                tampilan ini adalah contoh fiktif.
              </p>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ktpAddress">Alamat jalan lengkap *</Label>
                  <Input
                    id="ktpAddress"
                    value={form.ktpAddress}
                    onChange={(e) => handleChange("ktpAddress", e.target.value)}
                    placeholder="Jl. Melati No.··, Blok A (contoh fiktif)"
                    minLength={10}
                    maxLength={500}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="ktpRt">RT *</Label>
                    <Input
                      id="ktpRt"
                      value={form.ktpRt}
                      onChange={(e) => handleChange("ktpRt", e.target.value)}
                      placeholder="001"
                      maxLength={3}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ktpRw">RW *</Label>
                    <Input
                      id="ktpRw"
                      value={form.ktpRw}
                      onChange={(e) => handleChange("ktpRw", e.target.value)}
                      placeholder="004"
                      maxLength={3}
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="ktpPostalCode">Kode pos *</Label>
                    <Input
                      id="ktpPostalCode"
                      value={form.ktpPostalCode}
                      onChange={(e) =>
                        handleChange("ktpPostalCode", e.target.value)
                      }
                      placeholder="12···"
                      maxLength={5}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <GeoCascadingSelect
                    name="ktp-geo"
                    label="Alamat KTP"
                    value={form.ktpVillageId}
                    onChange={(level, id, name) =>
                      handleKtpGeoChange(level, id, name)
                    }
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-base font-semibold">Alamat domisili</h3>
              <p className="mb-4 text-xs text-[#5f6f85]">
                Tempat tinggal Anda saat ini; tidak harus sama dengan alamat
                KTP.
              </p>
              <div className="mb-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sameAsKtp"
                  checked={sameAsKtp}
                  onChange={(e) => handleSameAsKtpChange(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="sameAsKtp" className="text-sm">
                  Alamat domisili sama dengan alamat KTP
                </label>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="domAddress">Alamat jalan lengkap *</Label>
                  <Input
                    id="domAddress"
                    value={form.domAddress}
                    onChange={(e) => handleChange("domAddress", e.target.value)}
                    placeholder="Jl. Melati No.··, Blok A (contoh fiktif)"
                    disabled={sameAsKtp}
                    minLength={10}
                    maxLength={500}
                    required
                    className={sameAsKtp ? "bg-gray-50" : ""}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="domRt">RT *</Label>
                    <Input
                      id="domRt"
                      value={form.domRt}
                      onChange={(e) => handleChange("domRt", e.target.value)}
                      placeholder="001"
                      maxLength={3}
                      disabled={sameAsKtp}
                      required
                      className={sameAsKtp ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domRw">RW *</Label>
                    <Input
                      id="domRw"
                      value={form.domRw}
                      onChange={(e) => handleChange("domRw", e.target.value)}
                      placeholder="004"
                      maxLength={3}
                      disabled={sameAsKtp}
                      required
                      className={sameAsKtp ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="domPostalCode">Kode pos *</Label>
                    <Input
                      id="domPostalCode"
                      value={form.domPostalCode}
                      onChange={(e) =>
                        handleChange("domPostalCode", e.target.value)
                      }
                      placeholder="12···"
                      maxLength={5}
                      disabled={sameAsKtp}
                      required
                      className={sameAsKtp ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <GeoCascadingSelect
                    name="dom-geo"
                    label="Alamat Domisili"
                    value={form.domVillageId}
                    disabled={sameAsKtp}
                    onChange={(level, id, name) =>
                      handleDomGeoChange(level, id, name)
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border-l-4 border-[#2563eb] bg-[#f8fafc] p-4">
              <Shield className="mt-0.5 h-5 w-5 text-[#2563eb]" />
              <div>
                <p className="text-sm font-medium text-[#192b40]">
                  Alamat pribadi tidak ditampilkan publik
                </p>
                <p className="mt-1 text-xs text-[#5f6f85]">
                  Alamat digunakan untuk pemeriksaan administrasi oleh petugas
                  yang berwenang, bukan sebagai informasi profil publik.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {currentStep === 4 && (
        <>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-base font-semibold">KTP *</h3>
              <p className="mb-4 text-xs text-[#5f6f85]">
                Format: JPG, PNG, PDF. Ukuran maksimal: 5MB.
              </p>
              {uploadedFiles.ktp ? (
                <div className="rounded-lg border border-[#e5ebf1] p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100">
                      {uploadedFiles.ktp.preview ? (
                        <img
                          src={uploadedFiles.ktp.preview}
                          alt="Preview KTP"
                          className="h-full w-full rounded-lg object-cover"
                        />
                      ) : uploadedFiles.ktp.file.type === "application/pdf" ? (
                        <FileText className="h-8 w-8 text-gray-600" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {uploadedFiles.ktp.file.name}
                      </p>
                      <p className="text-xs text-[#5f6f85]">
                        {formatFileSize(uploadedFiles.ktp.file.size)}
                      </p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                        <div
                          className="h-1.5 rounded-full bg-[#2563eb]"
                          style={{ width: `${uploadedFiles.ktp.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile("ktp")}
                      aria-label="Hapus file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="ktpUpload"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#cbd5e1] p-8 text-center transition-colors hover:border-[#2563eb] hover:bg-[#f8fafc]"
                >
                  <Upload className="mb-2 h-8 w-8 text-[#64748b]" />
                  <p className="mb-1 text-sm font-medium">
                    Klik untuk upload atau drag & drop file di sini
                  </p>
                  <p className="text-xs text-[#5f6f85]">
                    Format: JPG, PNG, PDF · Maksimal 5MB
                  </p>
                  <input
                    type="file"
                    id="ktpUpload"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileSelect(e, "ktp")}
                  />
                </label>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-base font-semibold">
                SK Pengangkatan *
              </h3>
              <p className="mb-4 text-xs text-[#5f6f85]">
                Format: JPG, PNG, PDF. Ukuran maksimal: 5MB.
              </p>
              {uploadedFiles.skPengangkatan ? (
                <div className="rounded-lg border border-[#e5ebf1] p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100">
                      {uploadedFiles.skPengangkatan.preview ? (
                        <img
                          src={uploadedFiles.skPengangkatan.preview}
                          alt="Preview SK"
                          className="h-full w-full rounded-lg object-cover"
                        />
                      ) : uploadedFiles.skPengangkatan.file.type ===
                        "application/pdf" ? (
                        <FileText className="h-8 w-8 text-gray-600" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {uploadedFiles.skPengangkatan.file.name}
                      </p>
                      <p className="text-xs text-[#5f6f85]">
                        {formatFileSize(uploadedFiles.skPengangkatan.file.size)}
                      </p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                        <div
                          className="h-1.5 rounded-full bg-[#2563eb]"
                          style={{
                            width: `${uploadedFiles.skPengangkatan.progress}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile("skPengangkatan")}
                      aria-label="Hapus file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="skUpload"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#cbd5e1] p-8 text-center transition-colors hover:border-[#2563eb] hover:bg-[#f8fafc]"
                >
                  <Upload className="mb-2 h-8 w-8 text-[#64748b]" />
                  <p className="mb-1 text-sm font-medium">
                    Klik untuk upload atau drag & drop file di sini
                  </p>
                  <p className="text-xs text-[#5f6f85]">
                    Format: JPG, PNG, PDF · Maksimal 5MB
                  </p>
                  <input
                    type="file"
                    id="skUpload"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileSelect(e, "skPengangkatan")}
                  />
                </label>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-base font-semibold">
                Kartu pegawai / ID card *
              </h3>
              <p className="mb-4 text-xs text-[#5f6f85]">
                Format: JPG, PNG, PDF. Ukuran maksimal: 5MB.
              </p>
              {uploadedFiles.idCard ? (
                <div className="rounded-lg border border-[#e5ebf1] p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100">
                      {uploadedFiles.idCard.preview ? (
                        <img
                          src={uploadedFiles.idCard.preview}
                          alt="Preview ID Card"
                          className="h-full w-full rounded-lg object-cover"
                        />
                      ) : uploadedFiles.idCard.file.type ===
                        "application/pdf" ? (
                        <FileText className="h-8 w-8 text-gray-600" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {uploadedFiles.idCard.file.name}
                      </p>
                      <p className="text-xs text-[#5f6f85]">
                        {formatFileSize(uploadedFiles.idCard.file.size)}
                      </p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                        <div
                          className="h-1.5 rounded-full bg-[#2563eb]"
                          style={{ width: `${uploadedFiles.idCard.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile("idCard")}
                      aria-label="Hapus file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="idCardUpload"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#cbd5e1] p-8 text-center transition-colors hover:border-[#2563eb] hover:bg-[#f8fafc]"
                >
                  <Upload className="mb-2 h-8 w-8 text-[#64748b]" />
                  <p className="mb-1 text-sm font-medium">
                    Klik untuk upload atau drag & drop file di sini
                  </p>
                  <p className="text-xs text-[#5f6f85]">
                    Format: JPG, PNG, PDF · Maksimal 5MB
                  </p>
                  <input
                    type="file"
                    id="idCardUpload"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => handleFileSelect(e, "idCard")}
                  />
                </label>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-base font-semibold">
                Foto diri dengan KTP (opsional)
              </h3>
              <p className="mb-4 text-xs text-[#5f6f85]">
                Foto diri memegang KTP untuk verifikasi tambahan. Format: JPG,
                PNG. Ukuran maksimal: 5MB.
              </p>
              {uploadedFiles.selfie ? (
                <div className="rounded-lg border border-[#e5ebf1] p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100">
                      {uploadedFiles.selfie.preview ? (
                        <img
                          src={uploadedFiles.selfie.preview}
                          alt="Preview Foto diri"
                          className="h-full w-full rounded-lg object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {uploadedFiles.selfie.file.name}
                      </p>
                      <p className="text-xs text-[#5f6f85]">
                        {formatFileSize(uploadedFiles.selfie.file.size)}
                      </p>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                        <div
                          className="h-1.5 rounded-full bg-[#2563eb]"
                          style={{ width: `${uploadedFiles.selfie.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile("selfie")}
                      aria-label="Hapus file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="selfieUpload"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#cbd5e1] p-8 text-center transition-colors hover:border-[#2563eb] hover:bg-[#f8fafc]"
                >
                  <Upload className="mb-2 h-8 w-8 text-[#64748b]" />
                  <p className="mb-1 text-sm font-medium">
                    Klik untuk upload atau drag & drop file di sini
                  </p>
                  <p className="text-xs text-[#5f6f85]">
                    Format: JPG, PNG · Maksimal 5MB
                  </p>
                  <input
                    type="file"
                    id="selfieUpload"
                    className="hidden"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => handleFileSelect(e, "selfie")}
                  />
                </label>
              )}
            </div>

            <div className="flex items-start gap-3 rounded-lg border-l-4 border-[#2563eb] bg-[#f8fafc] p-4">
              <Shield className="mt-0.5 h-5 w-5 text-[#2563eb]" />
              <div>
                <p className="text-sm font-medium text-[#192b40]">
                  Dokumen pribadi tidak ditampilkan publik
                </p>
                <p className="mt-1 text-xs text-[#5f6f85]">
                  Dokumen digunakan untuk verifikasi oleh petugas yang berwenang
                  dan disimpan dengan enkripsi. Tidak akan ditampilkan di profil
                  publik atau dibagikan ke pihak ketiga.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {currentStep === 5 && (
        <>
          <div className="space-y-4">
            <div className="rounded-lg border border-[#e5ebf1] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Identitas & akun</h3>
                <Button variant="ghost" size="sm" onClick={() => updateStep(1)}>
                  <Edit className="mr-1 h-4 w-4" /> Edit
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-[#5f6f85]">Nama lengkap</p>
                  <p>{form.name || "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-[#5f6f85]">NIK</p>
                  <p>{form.nik ? maskNIK(form.nik) : "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-[#5f6f85]">Tempat/Tanggal lahir</p>
                  <p>
                    {form.birthPlace}, {form.birthDate || "-"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-[#5f6f85]">Email</p>
                  <p>{form.email || "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-[#5f6f85]">No HP</p>
                  <p>{form.phone || "-"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#e5ebf1] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Instansi & kepegawaian</h3>
                <Button variant="ghost" size="sm" onClick={() => updateStep(2)}>
                  <Edit className="mr-1 h-4 w-4" /> Edit
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-[#5f6f85]">Status ASN</p>
                  <p>{form.employmentStatus}</p>
                </div>
                {form.employmentStatus === "PNS" && (
                  <div className="grid grid-cols-2 gap-2">
                    <p className="text-[#5f6f85]">NIP</p>
                    <p>{form.nip ? maskNIK(form.nip) : "-"}</p>
                  </div>
                )}
                {form.employmentStatus === "PPPK" && (
                  <div className="grid grid-cols-2 gap-2">
                    <p className="text-[#5f6f85]">Nomor induk PPPPK</p>
                    <p>{form.pppkNumber ? maskNIK(form.pppkNumber) : "-"}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-[#5f6f85]">Jenis instansi</p>
                  <p>{form.agencyType}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-[#5f6f85]">Nama instansi</p>
                  <p>{form.agencyName || "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-[#5f6f85]">Unit kerja/OPD</p>
                  <p>{form.unitWork || "-"}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-[#5f6f85]">Jabatan</p>
                  <p>{form.positionName || "-"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#e5ebf1] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Alamat</h3>
                <Button variant="ghost" size="sm" onClick={() => updateStep(3)}>
                  <Edit className="mr-1 h-4 w-4" /> Edit
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="mb-1 text-[#5f6f85]">Alamat KTP</p>
                  <p>
                    {form.ktpAddress}, RT {form.ktpRt}/RW {form.ktpRw},{" "}
                    {form.ktpVillage}, {form.ktpDistrict}, {form.ktpRegency},{" "}
                    {form.ktpProvince} {form.ktpPostalCode}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-[#5f6f85]">Alamat domisili</p>
                  <p>
                    {sameAsKtp
                      ? "Sama dengan alamat KTP"
                      : `${form.domAddress}, RT ${form.domRt}/RW ${form.domRw}, ${form.domVillage}, ${form.domDistrict}, ${form.domRegency}, ${form.domProvince} ${form.domPostalCode}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#e5ebf1] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Dokumen</h3>
                <Button variant="ghost" size="sm" onClick={() => updateStep(4)}>
                  <Edit className="mr-1 h-4 w-4" /> Edit
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">KTP</p>
                    <p className="text-xs text-[#5f6f85]">
                      {uploadedFiles.ktp?.file.name} (
                      {uploadedFiles.ktp
                        ? formatFileSize(uploadedFiles.ktp.file.size)
                        : "-"}
                      )
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SK Pengangkatan</p>
                    <p className="text-xs text-[#5f6f85]">
                      {uploadedFiles.skPengangkatan?.file.name} (
                      {uploadedFiles.skPengangkatan
                        ? formatFileSize(uploadedFiles.skPengangkatan.file.size)
                        : "-"}
                      )
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Kartu pegawai / ID card</p>
                    <p className="text-xs text-[#5f6f85]">
                      {uploadedFiles.idCard?.file.name} (
                      {uploadedFiles.idCard
                        ? formatFileSize(uploadedFiles.idCard.file.size)
                        : "-"}
                      )
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Foto diri dengan KTP</p>
                    <p className="text-xs text-[#5f6f85]">
                      {uploadedFiles.selfie
                        ? `${uploadedFiles.selfie.file.name} (${formatFileSize(uploadedFiles.selfie.file.size)})`
                        : "Tidak diupload"}
                    </p>
                  </div>
                  {uploadedFiles.selfie ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <span className="text-xs text-[#5f6f85]">-</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#e5ebf1] p-4">
              <h3 className="mb-3 font-semibold">Pernyataan kebenaran data</h3>
              <p className="mb-2 text-sm">
                Dengan mengirim pengajuan ini, saya menyatakan bahwa:
              </p>
              <ul className="mb-4 list-inside list-disc space-y-1 text-sm text-[#5f6f85]">
                <li>
                  Seluruh data yang saya isi adalah benar dan sesuai dengan
                  dokumen resmi.
                </li>
                <li>Saya bersedia diverifikasi oleh petugas yang berwenang.</li>
                <li>
                  Saya memahami bahwa data palsu dapat mengakibatkan penolakan
                  atau pencabutan akses.
                </li>
                <li>Saya menyetujui syarat dan ketentuan platform Agoraya.</li>
              </ul>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreeFinal"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    setError("");
                  }}
                  className="mt-1"
                />
                <label htmlFor="agreeFinal" className="text-sm">
                  Saya menyatakan data yang diisi adalah benar dan dapat
                  dipertanggungjawabkan.
                </label>
              </div>
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 border-t border-[#e5ebf1] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => updateStep((currentStep - 1) as Step)}
              disabled={pending}
            >
              Kembali
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={pending}
          >
            Simpan draf
          </Button>
          {currentStep < 5 ? (
            <Button onClick={handleNext} disabled={pending}>
              {pending && (currentStep === 2 || currentStep === 3)
                ? "Menyimpan..."
                : "Lanjut →"}
            </Button>
          ) : (
            <Button onClick={handleFinalSubmit} disabled={pending || !agreed}>
              {pending ? "Mengirim..." : "Kirim pengajuan"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
