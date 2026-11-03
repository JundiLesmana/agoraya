"use client";

import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = 1 | 2 | 3 | 4 | 5;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_DOC_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export function RegisterAsnForm() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
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
    agencyName: "",
    nip: "",
    position: "",
    unit: "",
    appointmentDate: "",
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
        position: form.position.trim(),
        unit: form.unit.trim() || undefined,
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
        if (result.issues && Array.isArray(result.issues)) {
          // Could map to specific step, for now just show error
        }
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
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold">Instansi & kepegawaian</h2>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="agency">Nama instansi *</Label>
                <Input id="agency" value={form.agencyName} onChange={(e) => handleChange("agencyName", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nip">NIP</Label>
                <Input id="nip" value={form.nip} onChange={(e) => handleChange("nip", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Jabatan *</Label>
                <Input id="position" value={form.position} onChange={(e) => handleChange("position", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit kerja</Label>
                <Input id="unit" value={form.unit} onChange={(e) => handleChange("unit", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointmentDate">Tanggal pengangkatan</Label>
                <Input id="appointmentDate" type="date" value={form.appointmentDate} onChange={(e) => handleChange("appointmentDate", e.target.value)} />
              </div>
            </div>
          </div>
        </div>
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
                <p className="text-[#5f6f85]">Instansi: {form.agencyName || "-"} | Jabatan: {form.position || "-"} | NIP: {form.nip || "-"}</p>
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
            <Button onClick={() => setCurrentStep((s) => (s + 1) as Step)} disabled={pending}>
              Lanjut →
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
