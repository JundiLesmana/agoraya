"use client";

import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Upload, X, FileText, Image as ImageIcon } from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_DOC_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const ACCEPTED_SELFIE_TYPES = ["image/jpeg", "image/png"];

interface RegisterAsnFormProps {
  initialStep?: Step;
}

interface UploadedFile {
  file: File;
  preview?: string;
  progress: number;
}

export function RegisterAsnForm({ initialStep = 1 }: RegisterAsnFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>(initialStep);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [sameAsKtp, setSameAsKtp] = useState(false);

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
    // Step 3 - Alamat Domisili
    domAddress: "",
    domRt: "",
    domRw: "",
    domPostalCode: "",
    domProvince: "",
    domRegency: "",
    domDistrict: "",
    domVillage: "",
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
      }));
    }
    setError("");
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>, kind: "ktp" | "skPengangkatan" | "idCard" | "selfie") {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    if (file.size > MAX_FILE_SIZE) {
      setError("Ukuran file maksimal 5MB.");
      e.target.value = "";
      return;
    }

    const allowed = kind === "selfie" ? ACCEPTED_SELFIE_TYPES : ACCEPTED_DOC_TYPES;
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

  function handleRemoveFile(kind: "ktp" | "skPengangkatan" | "idCard" | "selfie") {
    if (uploadedFiles[kind]?.preview && uploadedFiles[kind]?.file.type.startsWith("image/")) {
      URL.revokeObjectURL(uploadedFiles[kind]!.preview!);
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
        if (!form.pppkNumber || form.pppkNumber.length !== 18 || !/^\d+$/.test(form.pppkNumber)) {
          setError("Nomor induk PPPPK harus 18 digit angka");
          return;
        }
        if (!form.rankGradePppk) {
          setError("Pangkat/golongan PPPPK wajib diisi");
          return;
        }
      }
      if (!form.agencyName || !form.unitWork || !form.field || !form.positionName || !form.officeAddress) {
        setError("Semua field wajib pada step ini harus diisi");
        return;
      }
      if (form.agencyType === "Instansi daerah" && (!form.provinceTask || !form.regencyTask)) {
        setError("Provinsi dan Kabupaten/Kota wilayah tugas wajib diisi");
        return;
      }

      setPending(true);
      try {
        const response = await fetch("/api/asn/register/step2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employmentStatus: form.employmentStatus,
            nip: form.employmentStatus === "PNS" ? form.nip : undefined,
            pppkNumber: form.employmentStatus === "PPPK" ? form.pppkNumber : undefined,
            rankGradePns: form.employmentStatus === "PNS" ? form.rankGradePns : undefined,
            rankGradePppk: form.employmentStatus === "PPPK" ? form.rankGradePppk : undefined,
            agencyType: form.agencyType,
            agencyName: form.agencyName,
            provinceTask: form.agencyType === "Instansi daerah" ? form.provinceTask : undefined,
            regencyTask: form.agencyType === "Instansi daerah" ? form.regencyTask : undefined,
            unitWork: form.unitWork,
            field: form.field,
            positionType: form.positionType,
            positionName: form.positionName,
            officeAddress: form.officeAddress,
            officialEmail: form.officialEmail || undefined,
            officePhone: form.officePhone || undefined,
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
      if (!form.ktpProvince || !form.ktpRegency || !form.ktpDistrict || !form.ktpVillage) {
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
        if (!form.domProvince || !form.domRegency || !form.domDistrict || !form.domVillage) {
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
      setCurrentStep((s) => (s + 1) as Step);
      return;
    }

    setCurrentStep((s) => (s + 1) as Step);
  }

  async function handleSubmit() {
    if (pending) return;
    if (!form.agreement) {
      setError("Anda harus menyetujui pernyataan kebenaran data");
      setCurrentStep(5);
      return;
    }
    if (!uploadedFiles.ktp || !uploadedFiles.skPengangkatan || !uploadedFiles.idCard) {
      setError("KTP, SK Pengangkatan, dan Kartu pegawai / ID card wajib diunggah");
      setCurrentStep(4);
      return;
    }

    setPending(true);
    setError("");
    try {
      const [ktpDataUrl, skDataUrl, suratDataUrl, selfieDataUrl] = await Promise.all([
        readFileAsDataUrl(uploadedFiles.ktp.file),
        readFileAsDataUrl(uploadedFiles.skPengangkatan.file),
        readFileAsDataUrl(uploadedFiles.idCard.file),
        uploadedFiles.selfie ? readFileAsDataUrl(uploadedFiles.selfie.file) : Promise.resolve(undefined),
      ]);

      const payload: any = {
        nik: form.nik.trim(),
        name: form.name.trim(),
        birthPlace: form.birthPlace.trim(),
        birthDate: form.birthDate,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        agencyName: form.agencyName.trim(),
        nip: form.nip.trim() || undefined,
        position: form.positionName.trim(),
        unit: form.unitWork.trim() || undefined,
        appointmentDate: form.appointmentDate || undefined,
        address: form.ktpAddress.trim(),
        rtRw: form.ktpRt + "/" + form.ktpRw,
        village: form.ktpVillage.trim(),
        district: form.ktpDistrict.trim(),
        regency: form.ktpRegency.trim(),
        province: form.ktpProvince.trim(),
        postalCode: form.ktpPostalCode.trim(),
        ktp: ktpDataUrl,
        ktpFileName: uploadedFiles.ktp.file.name,
        ktpMimeType: uploadedFiles.ktp.file.type,
        skPengangkatan: skDataUrl,
        skPengangkatanFileName: uploadedFiles.skPengangkatan.file.name,
        skPengangkatanMimeType: uploadedFiles.skPengangkatan.file.type,
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

      setSuccess(true);
    } catch (e) {
      setError("Tidak dapat terhubung. Periksa koneksi Anda lalu coba kembali.");
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">Pengajuan berhasil dikirim</h2>
        <p className="text-sm text-[#5f6f85]">
          Pendaftaran berhasil. Akun Anda masih memerlukan persetujuan admin instansi sebelum dapat mengakses dashboard.
        </p>
        <p className="text-xs text-[#5f6f85]">Silakan periksa email untuk informasi lebih lanjut.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {currentStep === 1 && (
        <div className="space-y-8">
          <div>
            <h2 className="mb-4 text-lg font-semibold">Identitas pribadi</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fullName">Nama lengkap *</Label>
                <Input id="fullName" value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="Masukkan nama lengkap sesuai KTP" required />
                <p className="text-xs text-[#5f6f85]">Sesuai dengan identitas resmi</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="nik">NIK *</Label>
                <Input id="nik" value={form.nik} onChange={(e) => handleChange("nik", e.target.value)} placeholder="16 digit NIK" required maxLength={16} />
                <p className="text-xs text-[#5f6f85]">NIK 16 digit untuk perlindungan dan verifikasi</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthPlace">Tempat lahir *</Label>
                <Input id="birthPlace" value={form.birthPlace} onChange={(e) => handleChange("birthPlace", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Tanggal lahir *</Label>
                <Input id="birthDate" type="date" value={form.birthDate} onChange={(e) => handleChange("birthDate", e.target.value)} required />
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold">Kontak & keamanan akun</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="nama@instansi.go.id" required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="phone">No HP aktif *</Label>
                <Input id="phone" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="08xxxxxxxxxx" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" value={form.password} onChange={(e) => handleChange("password", e.target.value)} placeholder="Minimal 12 karakter" required minLength={12} />
                <p className="text-xs text-[#5f6f85]">Min 12 karakter, kombinasi huruf, angka, simbol</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi password *</Label>
                <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)} required />
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <>
          <div className="mb-4">
            <p className="text-xs font-medium text-[#2563eb]">LANGKAH 2 DARI 5</p>
            <h2 className="mt-1 text-lg font-semibold">Hubungkan dengan instansi Anda</h2>
            <p className="text-sm text-[#5f6f85]">Data ini membantu admin mencocokkan penempatan dan menentukan akses yang sesuai.</p>
          </div>
          <div className="space-y-8">
            <div>
              <h3 className="mb-4 text-base font-semibold">Status kepegawaian</h3>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Status ASN *</Label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="employmentStatus" value="PNS" checked={form.employmentStatus === "PNS"} onChange={(e) => handleChange("employmentStatus", e.target.value)} aria-label="PNS" />
                    <span className="text-sm">PNS</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="employmentStatus" value="PPPK" checked={form.employmentStatus === "PPPK"} onChange={(e) => handleChange("employmentStatus", e.target.value)} aria-label="PPPK" />
                    <span className="text-sm">PPPK</span>
                  </label>
                </div>
                <p className="text-xs text-[#5f6f85]">Isian dan dokumen menyesuaikan status serta kebijakan instansi; bukan daftar kewajiban nasional ASN.</p>
              </div>
              {form.employmentStatus === "PNS" && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="nip">NIP *</Label>
                    <Input id="nip" value={form.nip} onChange={(e) => handleChange("nip", e.target.value)} placeholder="18 digit angka" maxLength={18} required />
                    <p className="text-xs text-[#5f6f85]">Untuk PNS. Jika memilih PPPPK, isi Nomor induk PPPPK.</p>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="rankGradePns">Pangkat/golongan PNS *</Label>
                    <select id="rankGradePns" value={form.rankGradePns} onChange={(e) => handleChange("rankGradePns", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
                      <option value="">Pilih pangkat/golongan</option>
                      <option value="Penata/I-C">Penata/I-C</option>
                      <option value="Penata Tk.I/I-d">Penata Tk.I/I-d</option>
                      <option value="Pembina/IV-a">Pembina/IV-a</option>
                      <option value="Pembina Tk.I/IV-b">Pembina Tk.I/IV-b</option>
                    </select>
                  </div>
                </div>
              )}
              {form.employmentStatus === "PPPK" && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="pppkNumber">Nomor induk PPPPK *</Label>
                    <Input id="pppkNumber" value={form.pppkNumber} onChange={(e) => handleChange("pppkNumber", e.target.value)} placeholder="18 digit angka" maxLength={18} required />
                    <p className="text-xs text-[#5f6f85]">Untuk PPPPK. Tidak berlaku untuk PNS.</p>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="rankGradePppk">Pangkat/golongan PPPPK *</Label>
                    <select id="rankGradePppk" value={form.rankGradePppk} onChange={(e) => handleChange("rankGradePppk", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
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
              <h3 className="mb-4 text-base font-semibold">Instansi & wilayah tugas</h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agencyType">Jenis instansi *</Label>
                  <select id="agencyType" value={form.agencyType} onChange={(e) => handleChange("agencyType", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
                    <option value="Instansi daerah">Instansi daerah</option>
                    <option value="Instansi pusat">Instansi pusat</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agencyName">Nama instansi *</Label>
                  <Input id="agencyName" value={form.agencyName} onChange={(e) => handleChange("agencyName", e.target.value)} placeholder="Pemerintah Kota Contoh" required />
                </div>
                {form.agencyType === "Instansi daerah" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="provinceTask">Provinsi wilayah tugas *</Label>
                      <select id="provinceTask" value={form.provinceTask} onChange={(e) => handleChange("provinceTask", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
                        <option value="">Pilih provinsi</option>
                        <option value="Provinsi Contoh">Provinsi Contoh</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regencyTask">Kabupaten/Kota wilayah tugas *</Label>
                      <select id="regencyTask" value={form.regencyTask} onChange={(e) => handleChange("regencyTask", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
                        <option value="">Pilih kabupaten/kota</option>
                        <option value="Kota Contoh">Kota Contoh</option>
                      </select>
                    </div>
                  </>
                )}
                <p className="text-xs text-[#5f6f85]">Bekerja di instansi pusat? Pilih 'Instansi pusat'. Wilayah daerah tidak diwajibkan; gunakan unit kerja dan lokasi penugasan bila relevan dengan kebijakan instansi.</p>
                <div className="space-y-2">
                  <Label htmlFor="unitWork">Unit kerja / OPD *</Label>
                  <Input id="unitWork" value={form.unitWork} onChange={(e) => handleChange("unitWork", e.target.value)} placeholder="Dinas Komunikasi dan Informatika (contoh)" required />
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-4 text-base font-semibold">Bidang, jabatan & kontak kedinasan</h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="field">Bidang *</Label>
                  <Input id="field" value={form.field} onChange={(e) => handleChange("field", e.target.value)} placeholder="Pengelolaan Data dan Statistik" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="positionType">Jenis jabatan *</Label>
                  <select id="positionType" value={form.positionType} onChange={(e) => handleChange("positionType", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
                    <option value="Jabatan fungsional">Jabatan fungsional</option>
                    <option value="Jabatan struktural">Jabatan struktural</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="positionName">Nama jabatan *</Label>
                  <Input id="positionName" value={form.positionName} onChange={(e) => handleChange("positionName", e.target.value)} placeholder="Pranata Komputer Ahli Pertama (contoh)" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="officeAddress">Alamat kantor *</Label>
                  <Input id="officeAddress" value={form.officeAddress} onChange={(e) => handleChange("officeAddress", e.target.value)} placeholder="Jl. Pelayanan Publik No. 10, Kota Contoh (fiktif)" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="officialEmail">Email kedinasan (opsional)</Label>
                  <Input id="officialEmail" type="email" value={form.officialEmail} onChange={(e) => handleChange("officialEmail", e.target.value)} placeholder="r***@instansi.example" />
                  <p className="text-xs text-[#5f6f85]">Domain .example digunakan khusus sebagai data contoh.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="officePhone">Telepon kantor (opsional)</Label>
                  <Input id="officePhone" value={form.officePhone} onChange={(e) => handleChange("officePhone", e.target.value)} placeholder="021-....1080" />
                  <p className="text-xs text-[#5f6f85]">Sertakan ekstensi bila diperlukan.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {currentStep === 3 && (
        <>
          <div className="mb-4">
            <p className="text-xs font-medium text-[#2563eb]">LANGKAH 3 DARI 5</p>
            <h2 className="mt-1 text-lg font-semibold">Lengkapi informasi alamat</h2>
            <p className="text-sm text-[#5f6f85]">Pisahkan alamat sesuai KTP dan tempat tinggal saat ini agar data administrasi tetap akurat.</p>
          </div>
          <div className="space-y-8">
            <div>
              <h3 className="mb-2 text-base font-semibold">Alamat sesuai KTP</h3>
              <p className="mb-4 text-xs text-[#5f6f85]">Salin alamat yang tercantum pada KTP Anda. Semua alamat pada tampilan ini adalah contoh fiktif.</p>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ktpAddress">Alamat jalan lengkap *</Label>
                  <Input id="ktpAddress" value={form.ktpAddress} onChange={(e) => handleChange("ktpAddress", e.target.value)} placeholder="Jl. Melati No.··, Blok A (contoh fiktif)" minLength={10} maxLength={500} required />
                </div>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="ktpRt">RT *</Label>
                    <Input id="ktpRt" value={form.ktpRt} onChange={(e) => handleChange("ktpRt", e.target.value)} placeholder="001" maxLength={3} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ktpRw">RW *</Label>
                    <Input id="ktpRw" value={form.ktpRw} onChange={(e) => handleChange("ktpRw", e.target.value)} placeholder="004" maxLength={3} required />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="ktpPostalCode">Kode pos *</Label>
                    <Input id="ktpPostalCode" value={form.ktpPostalCode} onChange={(e) => handleChange("ktpPostalCode", e.target.value)} placeholder="12···" maxLength={5} required />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ktpProvince">Provinsi *</Label>
                    <select id="ktpProvince" value={form.ktpProvince} onChange={(e) => handleChange("ktpProvince", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
                      <option value="">Pilih provinsi</option>
                      <option value="Provinsi Contoh">Provinsi Contoh</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ktpRegency">Kabupaten/Kota *</Label>
                    <select id="ktpRegency" value={form.ktpRegency} onChange={(e) => handleChange("ktpRegency", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
                      <option value="">Pilih kabupaten/kota</option>
                      <option value="Kota Contoh">Kota Contoh</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ktpDistrict">Kecamatan *</Label>
                    <select id="ktpDistrict" value={form.ktpDistrict} onChange={(e) => handleChange("ktpDistrict", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
                      <option value="">Pilih kecamatan</option>
                      <option value="Kecamatan Harmoni">Kecamatan Harmoni</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ktpVillage">Kelurahan/Desa *</Label>
                    <select id="ktpVillage" value={form.ktpVillage} onChange={(e) => handleChange("ktpVillage", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required>
                      <option value="">Pilih kelurahan/desa</option>
                      <option value="Kelurahan Melati">Kelurahan Melati</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-base font-semibold">Alamat domisili</h3>
              <p className="mb-4 text-xs text-[#5f6f85]">Tempat tinggal Anda saat ini; tidak harus sama dengan alamat KTP.</p>
              <div className="mb-4 flex items-center gap-2">
                <input type="checkbox" id="sameAsKtp" checked={sameAsKtp} onChange={(e) => handleSameAsKtpChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                <label htmlFor="sameAsKtp" className="text-sm">Alamat domisili sama dengan alamat KTP</label>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="domAddress">Alamat jalan lengkap *</Label>
                  <Input id="domAddress" value={form.domAddress} onChange={(e) => handleChange("domAddress", e.target.value)} placeholder="Jl. Melati No.··, Blok A (contoh fiktif)" disabled={sameAsKtp} minLength={10} maxLength={500} required className={sameAsKtp ? "bg-gray-50" : ""} />
                </div>
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="domRt">RT *</Label>
                    <Input id="domRt" value={form.domRt} onChange={(e) => handleChange("domRt", e.target.value)} placeholder="001" maxLength={3} disabled={sameAsKtp} required className={sameAsKtp ? "bg-gray-50" : ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domRw">RW *</Label>
                    <Input id="domRw" value={form.domRw} onChange={(e) => handleChange("domRw", e.target.value)} placeholder="004" maxLength={3} disabled={sameAsKtp} required className={sameAsKtp ? "bg-gray-50" : ""} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="domPostalCode">Kode pos *</Label>
                    <Input id="domPostalCode" value={form.domPostalCode} onChange={(e) => handleChange("domPostalCode", e.target.value)} placeholder="12···" maxLength={5} disabled={sameAsKtp} required className={sameAsKtp ? "bg-gray-50" : ""} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="domProvince">Provinsi *</Label>
                    <select id="domProvince" value={form.domProvince} onChange={(e) => handleChange("domProvince", e.target.value)} disabled={sameAsKtp} className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${sameAsKtp ? "bg-gray-50" : ""}`} required>
                      <option value="">Pilih provinsi</option>
                      <option value="Provinsi Contoh">Provinsi Contoh</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domRegency">Kabupaten/Kota *</Label>
                    <select id="domRegency" value={form.domRegency} onChange={(e) => handleChange("domRegency", e.target.value)} disabled={sameAsKtp} className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${sameAsKtp ? "bg-gray-50" : ""}`} required>
                      <option value="">Pilih kabupaten/kota</option>
                      <option value="Kota Contoh">Kota Contoh</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="domDistrict">Kecamatan *</Label>
                    <select id="domDistrict" value={form.domDistrict} onChange={(e) => handleChange("domDistrict", e.target.value)} disabled={sameAsKtp} className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${sameAsKtp ? "bg-gray-50" : ""}`} required>
                      <option value="">Pilih kecamatan</option>
                      <option value="Kecamatan Harmoni">Kecamatan Harmoni</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domVillage">Kelurahan/Desa *</Label>
                    <select id="domVillage" value={form.domVillage} onChange={(e) => handleChange("domVillage", e.target.value)} disabled={sameAsKtp} className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${sameAsKtp ? "bg-gray-50" : ""}`} required>
                      <option value="">Pilih kelurahan/desa</option>
                      <option value="Kelurahan Melati">Kelurahan Melati</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border-l-4 border-[#2563eb] bg-[#f8fafc] p-4">
              <Shield className="h-5 w-5 text-[#2563eb] mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#192b40]">Alamat pribadi tidak ditampilkan publik</p>
                <p className="text-xs text-[#5f6f85] mt-1">Alamat digunakan untuk pemeriksaan administrasi oleh petugas yang berwenang, bukan sebagai informasi profil publik.</p>
              </div>
            </div>
          </div>
        </>
      )}

      {currentStep === 4 && (
        <>
          <div className="mb-4">
            <p className="text-xs font-medium text-[#2563eb]">LANGKAH 4 DARI 5</p>
            <h2 className="mt-1 text-lg font-semibold">Unggah dokumen verifikasi</h2>
            <p className="text-sm text-[#5f6f85]">Dokumen diperlukan untuk memverifikasi identitas dan status kepegawaian Anda. Pastikan file jelas dan tidak buram.</p>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-base font-semibold">KTP *</h3>
              <p className="mb-4 text-xs text-[#5f6f85]">Format: JPG, PNG, PDF. Ukuran maksimal: 5MB.</p>
              {uploadedFiles.ktp ? (
                <div className="rounded-lg border border-[#e5ebf1] p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100">
                      {uploadedFiles.ktp.preview ? (
                        <img src={uploadedFiles.ktp.preview} alt="Preview KTP" className="h-full w-full rounded-lg object-cover" />
                      ) : uploadedFiles.ktp.file.type === "application/pdf" ? (
                        <FileText className="h-8 w-8 text-gray-600" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{uploadedFiles.ktp.file.name}</p>
                      <p className="text-xs text-[#5f6f85]">{formatFileSize(uploadedFiles.ktp.file.size)}</p>
                      <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full">
                        <div className="h-1.5 bg-[#2563eb] rounded-full" style={{ width: `${uploadedFiles.ktp.progress}%` }}></div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveFile("ktp")} aria-label="Hapus file">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <label htmlFor="ktpUpload" className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#cbd5e1] p-8 text-center hover:border-[#2563eb] hover:bg-[#f8fafc] transition-colors">
                  <Upload className="mb-2 h-8 w-8 text-[#64748b]" />
                  <p className="mb-1 text-sm font-medium">Klik untuk upload atau drag & drop file di sini</p>
                  <p className="text-xs text-[#5f6f85]">Format: JPG, PNG, PDF · Maksimal 5MB</p>
                  <input type="file" id="ktpUpload" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileSelect(e, "ktp")} />
                </label>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-base font-semibold">SK Pengangkatan *</h3>
              <p className="mb-4 text-xs text-[#5f6f85]">Format: JPG, PNG, PDF. Ukuran maksimal: 5MB.</p>
              {uploadedFiles.skPengangkatan ? (
                <div className="rounded-lg border border-[#e5ebf1] p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100">
                      {uploadedFiles.skPengangkatan.preview ? (
                        <img src={uploadedFiles.skPengangkatan.preview} alt="Preview SK" className="h-full w-full rounded-lg object-cover" />
                      ) : uploadedFiles.skPengangkatan.file.type === "application/pdf" ? (
                        <FileText className="h-8 w-8 text-gray-600" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{uploadedFiles.skPengangkatan.file.name}</p>
                      <p className="text-xs text-[#5f6f85]">{formatFileSize(uploadedFiles.skPengangkatan.file.size)}</p>
                      <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full">
                        <div className="h-1.5 bg-[#2563eb] rounded-full" style={{ width: `${uploadedFiles.skPengangkatan.progress}%` }}></div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveFile("skPengangkatan")} aria-label="Hapus file">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <label htmlFor="skUpload" className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#cbd5e1] p-8 text-center hover:border-[#2563eb] hover:bg-[#f8fafc] transition-colors">
                  <Upload className="mb-2 h-8 w-8 text-[#64748b]" />
                  <p className="mb-1 text-sm font-medium">Klik untuk upload atau drag & drop file di sini</p>
                  <p className="text-xs text-[#5f6f85]">Format: JPG, PNG, PDF · Maksimal 5MB</p>
                  <input type="file" id="skUpload" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileSelect(e, "skPengangkatan")} />
                </label>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-base font-semibold">Kartu pegawai / ID card *</h3>
              <p className="mb-4 text-xs text-[#5f6f85]">Format: JPG, PNG, PDF. Ukuran maksimal: 5MB.</p>
              {uploadedFiles.idCard ? (
                <div className="rounded-lg border border-[#e5ebf1] p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100">
                      {uploadedFiles.idCard.preview ? (
                        <img src={uploadedFiles.idCard.preview} alt="Preview Kartu pegawai / ID card" className="h-full w-full rounded-lg object-cover" />
                      ) : uploadedFiles.idCard.file.type === "application/pdf" ? (
                        <FileText className="h-8 w-8 text-gray-600" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{uploadedFiles.idCard.file.name}</p>
                      <p className="text-xs text-[#5f6f85]">{formatFileSize(uploadedFiles.idCard.file.size)}</p>
                      <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full">
                        <div className="h-1.5 bg-[#2563eb] rounded-full" style={{ width: `${uploadedFiles.idCard.progress}%` }}></div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveFile("idCard")} aria-label="Hapus file">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <label htmlFor="suratUpload" className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#cbd5e1] p-8 text-center hover:border-[#2563eb] hover:bg-[#f8fafc] transition-colors">
                  <Upload className="mb-2 h-8 w-8 text-[#64748b]" />
                  <p className="mb-1 text-sm font-medium">Klik untuk upload atau drag & drop file di sini</p>
                  <p className="text-xs text-[#5f6f85]">Format: JPG, PNG, PDF · Maksimal 5MB</p>
                  <input type="file" id="suratUpload" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileSelect(e, "idCard")} />
                </label>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-base font-semibold">Foto diri dengan KTP (opsional)</h3>
              <p className="mb-4 text-xs text-[#5f6f85]">Foto diri memegang KTP untuk verifikasi tambahan. Format: JPG, PNG. Ukuran maksimal: 5MB.</p>
              {uploadedFiles.selfie ? (
                <div className="rounded-lg border border-[#e5ebf1] p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100">
                      {uploadedFiles.selfie.preview ? (
                        <img src={uploadedFiles.selfie.preview} alt="Preview Foto diri" className="h-full w-full rounded-lg object-cover" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{uploadedFiles.selfie.file.name}</p>
                      <p className="text-xs text-[#5f6f85]">{formatFileSize(uploadedFiles.selfie.file.size)}</p>
                      <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full">
                        <div className="h-1.5 bg-[#2563eb] rounded-full" style={{ width: `${uploadedFiles.selfie.progress}%` }}></div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveFile("selfie")} aria-label="Hapus file">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <label htmlFor="selfieUpload" className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#cbd5e1] p-8 text-center hover:border-[#2563eb] hover:bg-[#f8fafc] transition-colors">
                  <Upload className="mb-2 h-8 w-8 text-[#64748b]" />
                  <p className="mb-1 text-sm font-medium">Klik untuk upload atau drag & drop file di sini</p>
                  <p className="text-xs text-[#5f6f85]">Format: JPG, PNG · Maksimal 5MB</p>
                  <input type="file" id="selfieUpload" className="hidden" accept=".jpg,.jpeg,.png" onChange={(e) => handleFileSelect(e, "selfie")} />
                </label>
              )}
            </div>

            <div className="flex items-start gap-3 rounded-lg border-l-4 border-[#2563eb] bg-[#f8fafc] p-4">
              <Shield className="h-5 w-5 text-[#2563eb] mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#192b40]">Dokumen pribadi tidak ditampilkan publik</p>
                <p className="text-xs text-[#5f6f85] mt-1">Dokumen digunakan untuk verifikasi oleh petugas yang berwenang dan disimpan dengan enkripsi. Tidak akan ditampilkan di profil publik atau dibagikan ke pihak ketiga.</p>
              </div>
            </div>
          </div>
        </>
      )}

      {currentStep === 5 && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold">Tinjau & persetujuan</h2>
            <p className="mb-6 text-sm text-[#5f6f85]">Periksa kembali data yang akan diajukan</p>
            <div className="space-y-4 rounded-lg bg-[#f8fafc] p-4 text-sm">
              <div>
                <p className="mb-1 font-medium">Identitas pribadi</p>
                <p className="text-[#5f6f85]">Nama: {form.name || "-"} | NIK: {form.nik ? "************" + form.nik.slice(-4) : "-"} | TTL: {form.birthPlace}, {form.birthDate || "-"}</p>
              </div>
              <div>
                <p className="mb-1 font-medium">Kontak & akun</p>
                <p className="text-[#5f6f85]">Email: {form.email || "-"} | No HP: {form.phone || "-"}</p>
              </div>
              <div>
                <p className="mb-1 font-medium">Instansi & kepegawaian</p>
                <p className="text-[#5f6f85]">Instansi: {form.agencyName || "-"} | Jabatan: {form.positionName || "-"} | Status: {form.employmentStatus}</p>
              </div>
              <div>
                <p className="mb-1 font-medium">Alamat KTP</p>
                <p className="text-[#5f6f85]">{form.ktpAddress}, RT {form.ktpRt}/RW {form.ktpRw}, {form.ktpVillage}, {form.ktpDistrict}, {form.ktpRegency}, {form.ktpProvince} {form.ktpPostalCode}</p>
              </div>
              <div>
                <p className="mb-1 font-medium">Alamat Domisili</p>
                <p className="text-[#5f6f85]">{sameAsKtp ? "Sama dengan alamat KTP" : `${form.domAddress}, RT ${form.domRt}/RW ${form.domRw}, ${form.domVillage}, ${form.domDistrict}, ${form.domRegency}, ${form.domProvince} ${form.domPostalCode}`}</p>
              </div>
              <div>
                <p className="mb-1 font-medium">Dokumen</p>
                <p className="text-[#5f6f85]">KTP: {uploadedFiles.ktp?.file.name ? "✓ " + uploadedFiles.ktp.file.name : "-"} | SK Pengangkatan: {uploadedFiles.skPengangkatan?.file.name ? "✓ " + uploadedFiles.skPengangkatan.file.name : "-"} | Kartu pegawai / ID card: {uploadedFiles.idCard?.file.name ? "✓ " + uploadedFiles.idCard.file.name : "-"} | Foto diri: {uploadedFiles.selfie?.file.name ? "✓ " + uploadedFiles.selfie.file.name : "Tidak diunggah"}</p>
              </div>
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-[#e5ebf1] p-4">
              <input type="checkbox" id="agree" checked={form.agreement} onChange={(e) => handleChange("agreement", e.target.checked)} className="mt-1" />
              <label htmlFor="agree" className="text-sm">Saya menyatakan data yang diisi adalah benar dan bersedia untuk diverifikasi.</label>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 border-t border-[#e5ebf1] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button variant="outline" onClick={() => setCurrentStep((s) => (s - 1) as Step)} disabled={pending}>
              Kembali
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={pending}>
            Simpan draf
          </Button>
          {currentStep < 5 ? (
            <Button onClick={handleNext} disabled={pending}>
              {pending && (currentStep === 2 || currentStep === 3) ? "Menyimpan..." : "Lanjut →"}
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={pending}>
              {pending ? "Mengirim..." : "Kirim pengajuan"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
