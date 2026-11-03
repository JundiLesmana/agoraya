"use client";

import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = 1 | 2 | 3 | 4 | 5;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_DOC_TYPES = ["image/jpeg", "image/png", "application/pdf"];

interface RegisterAsnFormProps {
  initialStep?: Step;
}

export function RegisterAsnForm({ initialStep = 1 }: RegisterAsnFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>(initialStep);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

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
    // Step 3
    address: "",
    rtRw: "",
    village: "",
    district: "",
    regency: "",
    province: "",
    postalCode: "",
    agreement: false,
  });

  const [files, setFiles] = useState<{
    ktp: File | null;
    skPengangkatan: File | null;
    selfie: File | null;
  }>({ ktp: null, skPengangkatan: null, selfie: null });

  function handleChange(field: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>, kind: keyof typeof files) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError("Ukuran file maksimal 5MB");
      e.target.value = "";
      return;
    }
    const allowed = kind === "selfie" ? ["image/jpeg", "image/png"] : ACCEPTED_DOC_TYPES;
    if (!allowed.includes(file.type)) {
      setError(kind === "selfie" ? "Foto diri harus JPG atau PNG" : "File harus JPG, PNG, atau PDF");
      e.target.value = "";
      return;
    }
    setFiles((prev) => ({ ...prev, [kind]: file }));
    setError("");
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
          data: { ...form, files: null },
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
      // Validate step 2
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
    if (!files.ktp || !files.skPengangkatan) {
      setError("KTP dan SK Pengangkatan wajib diunggah");
      setCurrentStep(4);
      return;
    }

    setPending(true);
    setError("");
    try {
      const [ktpDataUrl, skDataUrl, selfieDataUrl] = await Promise.all([
        readFileAsDataUrl(files.ktp),
        readFileAsDataUrl(files.skPengangkatan),
        files.selfie ? readFileAsDataUrl(files.selfie) : Promise.resolve(undefined),
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
        address: form.address.trim(),
        rtRw: form.rtRw.trim() || undefined,
        village: form.village.trim(),
        district: form.district.trim(),
        regency: form.regency.trim(),
        province: form.province.trim(),
        postalCode: form.postalCode.trim() || undefined,
        ktp: ktpDataUrl,
        ktpFileName: files.ktp.name,
        ktpMimeType: files.ktp.type,
        skPengangkatan: skDataUrl,
        skPengangkatanFileName: files.skPengangkatan.name,
        skPengangkatanMimeType: files.skPengangkatan.type,
        agreement: true,
      };

      if (selfieDataUrl && files.selfie) {
        payload.selfie = selfieDataUrl;
        payload.selfieFileName = files.selfie.name;
        payload.selfieMimeType = files.selfie.type;
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
                    <input
                      type="radio"
                      name="employmentStatus"
                      value="PNS"
                      checked={form.employmentStatus === "PNS"}
                      onChange={(e) => handleChange("employmentStatus", e.target.value)}
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
                      onChange={(e) => handleChange("employmentStatus", e.target.value)}
                      aria-label="PPPK"
                    />
                    <span className="text-sm">PPPK</span>
                  </label>
                </div>
                <p className="text-xs text-[#5f6f85]">
                  Isian dan dokumen menyesuaikan status serta kebijakan instansi; bukan daftar kewajiban nasional ASN.
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
                    <p className="text-xs text-[#5f6f85]">Untuk PNS. Jika memilih PPPPK, isi Nomor induk PPPPK.</p>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="rankGradePns">Pangkat/golongan PNS *</Label>
                    <select
                      id="rankGradePns"
                      value={form.rankGradePns}
                      onChange={(e) => handleChange("rankGradePns", e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      required
                    >
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
                    <Input
                      id="pppkNumber"
                      value={form.pppkNumber}
                      onChange={(e) => handleChange("pppkNumber", e.target.value)}
                      placeholder="18 digit angka"
                      maxLength={18}
                      required
                    />
                    <p className="text-xs text-[#5f6f85]">Untuk PPPPK. Tidak berlaku untuk PNS.</p>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="rankGradePppk">Pangkat/golongan PPPPK *</Label>
                    <select
                      id="rankGradePppk"
                      value={form.rankGradePppk}
                      onChange={(e) => handleChange("rankGradePppk", e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              <h3 className="mb-4 text-base font-semibold">Instansi & wilayah tugas</h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agencyType">Jenis instansi *</Label>
                  <select
                    id="agencyType"
                    value={form.agencyType}
                    onChange={(e) => handleChange("agencyType", e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    required
                  >
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
                      <select
                        id="provinceTask"
                        value={form.provinceTask}
                        onChange={(e) => handleChange("provinceTask", e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        required
                      >
                        <option value="">Pilih provinsi</option>
                        <option value="Provinsi Contoh">Provinsi Contoh</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regencyTask">Kabupaten/Kota wilayah tugas *</Label>
                      <select
                        id="regencyTask"
                        value={form.regencyTask}
                        onChange={(e) => handleChange("regencyTask", e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        required
                      >
                        <option value="">Pilih kabupaten/kota</option>
                        <option value="Kota Contoh">Kota Contoh</option>
                      </select>
                    </div>
                  </>
                )}
                <p className="text-xs text-[#5f6f85]">
                  Bekerja di instansi pusat? Pilih 'Instansi pusat'. Wilayah daerah tidak diwajibkan; gunakan unit kerja dan lokasi penugasan bila relevan dengan kebijakan instansi.
                </p>
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
                  <select
                    id="positionType"
                    value={form.positionType}
                    onChange={(e) => handleChange("positionType", e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    required
                  >
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
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold">Alamat</h2>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Alamat lengkap *</Label>
                <Input id="address" value={form.address} onChange={(e) => handleChange("address", e.target.value)} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rt">RT/RW</Label>
                  <Input id="rt" value={form.rtRw} onChange={(e) => handleChange("rtRw", e.target.value)} placeholder="001/002" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Kode pos</Label>
                  <Input id="postalCode" value={form.postalCode} onChange={(e) => handleChange("postalCode", e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="village">Kelurahan *</Label>
                  <Input id="village" value={form.village} onChange={(e) => handleChange("village", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">Kecamatan *</Label>
                  <Input id="district" value={form.district} onChange={(e) => handleChange("district", e.target.value)} required />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="regency">Kabupaten/Kota *</Label>
                  <Input id="regency" value={form.regency} onChange={(e) => handleChange("regency", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Provinsi *</Label>
                  <Input id="province" value={form.province} onChange={(e) => handleChange("province", e.target.value)} required />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold">Dokumen verifikasi</h2>
            <p className="mb-6 text-sm text-[#5f6f85]">Unggah dokumen untuk verifikasi oleh petugas berwenang</p>
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-[#cbd5e1] p-6 text-center">
                <p className="mb-2 font-medium">Upload KTP *</p>
                <p className="mb-2 text-sm text-[#5f6f85]">JPG, PNG, atau PDF (maks. 5MB)</p>
                {files.ktp && <p className="mb-2 text-xs text-green-600">{files.ktp.name}</p>}
                <input type="file" id="ktp" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileChange(e, "ktp")} />
                <label htmlFor="ktp">
                  <Button variant="outline" asChild>
                    <span>Pilih File</span>
                  </Button>
                </label>
              </div>
              <div className="rounded-lg border-2 border-dashed border-[#cbd5e1] p-6 text-center">
                <p className="mb-2 font-medium">Upload SK Pengangkatan *</p>
                <p className="mb-2 text-sm text-[#5f6f85]">JPG, PNG, atau PDF (maks. 5MB)</p>
                {files.skPengangkatan && <p className="mb-2 text-xs text-green-600">{files.skPengangkatan.name}</p>}
                <input type="file" id="sk" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFileChange(e, "skPengangkatan")} />
                <label htmlFor="sk">
                  <Button variant="outline" asChild>
                    <span>Pilih File</span>
                  </Button>
                </label>
              </div>
              <div className="rounded-lg border-2 border-dashed border-[#cbd5e1] p-6 text-center">
                <p className="mb-2 font-medium">Upload foto diri (opsional)</p>
                <p className="mb-2 text-sm text-[#5f6f85]">JPG, PNG (maks. 5MB)</p>
                {files.selfie && <p className="mb-2 text-xs text-green-600">{files.selfie.name}</p>}
                <input type="file" id="selfie" className="hidden" accept=".jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, "selfie")} />
                <label htmlFor="selfie">
                  <Button variant="outline" asChild>
                    <span>Pilih File</span>
                  </Button>
                </label>
              </div>
            </div>
          </div>
        </div>
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
                <p className="mb-1 font-medium">Alamat</p>
                <p className="text-[#5f6f85]">{form.address || "-"}, {form.village}, {form.district}, {form.regency}, {form.province}</p>
              </div>
              <div>
                <p className="mb-1 font-medium">Dokumen</p>
                <p className="text-[#5f6f85]">KTP: {files.ktp?.name ? "✓" : "-"} | SK Pengangkatan: {files.skPengangkatan?.name ? "✓" : "-"} | Foto diri: {files.selfie?.name ? "✓" : "Tidak diunggah"}</p>
              </div>
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-[#e5ebf1] p-4">
              <input type="checkbox" id="agree" checked={form.agreement} onChange={(e) => handleChange("agreement", e.target.checked)} className="mt-1" />
              <label htmlFor="agree" className="text-sm">
                Saya menyatakan data yang diisi adalah benar dan bersedia untuk diverifikasi.
              </label>
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
              {pending && currentStep === 2 ? "Menyimpan..." : "Lanjut →"}
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
