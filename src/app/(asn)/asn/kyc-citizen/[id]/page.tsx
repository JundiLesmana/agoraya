import { requireAuth } from "@/lib/auth/guards";
import { SourceBadge } from "@/components/source-badges";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { maskNik, maskEmail, formatFileSize } from "@/lib/kyc-presentation";
import { InspectionSidebar } from "./_components/InspectionSidebar";
import { DecisionForm } from "./_components/DecisionForm";

const APPLICATION_ID_PATTERN = /^kyc-app-/;

async function getMockKycApplication(id: string) {
  // TODO(#430): replace with real data from modules/kyc roster + citizen profile via API route
  // GET /api/v1/kyc/applications/[id]
  if (!APPLICATION_ID_PATTERN.test(id)) {
    return null;
  }

  // Simulasi jeda pemuatan data dari server agar state loading dapat divisualisasikan.
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    id,
    status: "pending", // Menunggu pemeriksaan
    statusLabel: "Menunggu pemeriksaan",
    uploadedDocuments: 2,
    emailVerified: false,
    emailVerifiedLabel: "Belum aktif",
    email: "budi.santoso@email.com",
    maskedEmail: maskEmail("budi.santoso@email.com"),
    nik: "3171000000000008",
    maskedNik: maskNik("3171000000000008"),
    name: "Budi Santoso (contoh)",
    role: "Pendaftar Mandiri · Registrasi Portal Warga",
    passwordSecurity: "Kata sandi telah diuji (12+ karakter)",
    address: {
      street: "Jl. Melati No. --, Blok A (contoh fiktif)",
      rt: "005",
      rw: "002",
      kelurahan: "Kenanga",
      kecamatan: "Sejahtera",
      kabupaten: "Kota Jakarta Selatan",
      provinsi: "DKI Jakarta",
      kodePos: "12··",
    },
    documents: [
      {
        type: "ktp",
        label: "Foto KTP",
        fileName: "ktp-budi-santoso.jpg",
        sizeBytes: 1_400_000,
        format: "JPG",
        maxSize: "5 MB",
        status: "Belum diperiksa",
      },
      {
        type: "selfie",
        label: "Foto Selfie (Verifikasi Wajah)",
        fileName: "selfie-budi.jpg",
        sizeBytes: 2_100_000,
        format: "JPG",
        maxSize: "5 MB",
        status: "Belum diperiksa",
      },
    ],
    statements: [
      {
        label: "Pernyataan kebenaran data",
        by: "dicantumkan pemohon",
        checked: true,
      },
      {
        label: "Persetujuan pemrosesan data & Ketentuan Penggunaan",
        by: "dicantumkan pemohon",
        checked: true,
      },
    ],
    inspectionCategories: [
      { id: "identitas", label: "Identitas & NIK", status: "belum" },
      { id: "alamat", label: "Alamat lengkap", status: "belum" },
      { id: "fotoKtp", label: "Foto KTP & Kesesuaian NIK", status: "belum" },
      { id: "selfie", label: "Foto selfie & Biometrik", status: "belum" },
      { id: "pernyataan", label: "Pernyataan & persetujuan", status: "belum" },
    ],
  };
}

export default async function VerifikasiAkunWargaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth({ roles: ["admin"] });

  const { id } = await params;
  const application = await getMockKycApplication(id);

  if (!application) {
    return (
      <main className="container mx-auto px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">Detail pengajuan tidak ditemukan</h1>
        <p className="text-muted-foreground">
          Pengajuan dengan ID tersebut tidak tersedia.
        </p>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb & header aksi */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span className="text-foreground">Ruang instansi</span>
        <span>/</span>
        <span className="text-foreground">Verifikasi akun warga</span>
        <span>/</span>
        <span className="text-foreground font-medium">Detail pengajuan</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Verifikasi akun warga
          </h1>
          <p className="text-muted-foreground">
            Tinjau data dan dokumen pengajuan akun warga sebelum menetukan
            keputusan.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
          <Button variant="outline" size="sm">
            Mengunggah pemeriksaan
          </Button>
          <div className="flex items-center gap-1 px-2 py-1 rounded border border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
            </span>
            <span>DATA CONTOH FIKTIF</span>
          </div>
        </div>
      </div>

      {/* Peringatan email belum terverifikasi */}
      <div
        role="alert"
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800"
      >
        <div className="flex items-start gap-3">
          <span className="flex shrink-0 items-center justify-center h-5 w-5 rounded-full bg-amber-100 text-amber-600 text-xs font-bold" aria-hidden="true">
            !
          </span>
          <div className="text-sm leading-relaxed">
            <p className="font-semibold">
              Email belum terverifikasi &mdash; pengajuan belum disetujui.
            </p>
            <p className="mt-1">
              {application.maskedEmail} masih perlu diverifikasi oleh pemohon
              sebelum akses penuh dapat diberikan. Tinjauan dokumen tetap dapat
              dilakukan.
            </p>
          </div>
        </div>
      </div>

      {/* Header pemohon */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 px-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              BS
            </div>
            <div>
              <h2 className="font-semibold leading-none">{application.name}</h2>
              <p className="text-xs text-muted-foreground">{application.role}</p>
              <span className="mt-1 inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Akun Warga
              </span>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs text-muted-foreground">Dokumen pendukung</div>
            <div className="font-semibold">
              {application.uploadedDocuments} berkas terunggah
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-destructive" />
              <span className="text-destructive font-semibold">
                {application.emailVerifiedLabel}
              </span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Status verifikasi email
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/*
            Identitas & akun warga
          */}
          <Card>
            <CardHeader className="flex items-center justify-between px-6 pb-2">
              <div>
                <CardTitle className="text-base">Identitas &amp; akun warga</CardTitle>
                <CardDescription className="text-xs">
                  Data pribadi pemohon sesuai data terdaftar.
                </CardDescription>
              </div>
              <Badge variant="outline">Belum diperiksa</Badge>
            </CardHeader>
            <CardContent className="px-6 py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="nama-lengkap">Nama lengkap sesuai KTP</Label>
                    <p id="nama-lengkap" className="font-medium text-sm mt-0.5">
                      {application.name}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="nik">Nomor Induk Kependudukan (NIK)</Label>
                    <p id="nik" className="font-mono font-medium text-sm mt-0.5">
                      {application.maskedNik}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      16 digit sesuai identitas resmi
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="email-akun">Email akun</Label>
                    <p id="email-akun" className="font-medium text-sm mt-0.5">
                      {application.email}
                    </p>
                    <p className="text-xs text-destructive mt-0.5">
                      Belum terverifikasi
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="keamanan-sandi">Status keamanan kata sandi</Label>
                    <p id="keamanan-sandi" className="font-medium text-sm mt-0.5 flex items-center gap-1">
                      <span
                        className="flex h-1.5 w-1.5 items-center"
                        aria-hidden="true"
                      >
                        <svg className="h-1.5 w-1.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      {application.passwordSecurity}
                    </p>
                  </div>
                </div>
                <SourceBadge source="CITIZEN_UNVERIFIED" label="Identitas diajukan warga" />
              </div>
            </CardContent>
          </Card>

          {/*
            Alamat domisili & KTP
          */}
          <Card>
            <CardHeader className="flex items-center justify-between px-6 pb-2">
              <div>
                <CardTitle className="text-base">Alamat domisili &amp; KTP</CardTitle>
                <CardDescription className="text-xs">
                  Verifikasi keesuaian dengan foto KTP fisik di bawah.
                </CardDescription>
              </div>
              <Badge variant="outline">Belum diperiksa</Badge>
            </CardHeader>
            <CardContent className="px-6 py-4">
              <div className="space-y-4">
                <div className="rounded-lg border border-info-200 bg-info-50 p-3 text-info-800 text-xs">
                  Data alamat diinput sesuai formulir pendaftaran warga Agoraya.
                  Verifikasi keesuaian dengan foto KTP fisik di bawah.
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">
                      Alamat jalan lengkap
                    </dt>
                    <dd className="font-medium">{application.address.street}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">RT</dt>
                    <dd className="font-medium">{application.address.rt}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">RW</dt>
                    <dd className="font-medium">{application.address.rw}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Kelurahan / Desa
                    </dt>
                    <dd className="font-medium">{application.address.kelurahan}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Kecamatan</dt>
                    <dd className="font-medium">{application.address.kecamatan}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">
                      Kabupaten / Kota
                    </dt>
                    <dd className="font-medium">{application.address.kabupaten}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Provinsi</dt>
                    <dd className="font-medium">{application.address.provinsi}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Kode pos</dt>
                    <dd className="font-medium">{application.address.kodePos}</dd>
                  </div>
                </dl>
                <p className="text-xs text-muted-foreground mt-2">
                  Alamat pribadi hanya untuk verifikasi administratif dan
                  pelayanan publik oleh petugas berwenang, tidak dapat diakses
                  ke publik.
                </p>
              </div>
            </CardContent>
          </Card>

          {/*
            Dokumen pendukung
          */}
          <Card>
            <CardHeader className="flex items-center justify-between px-6 pb-2">
              <div>
                <CardTitle className="text-base">
                  Dokumen pendukung (KTP &amp; Selfie)
                </CardTitle>
                <CardDescription className="text-xs">
                  2 berkas identitas telah diunggah oleh warga.
                </CardDescription>
              </div>
              <Badge variant="outline">Belum diperiksa</Badge>
            </CardHeader>
            <CardContent className="px-6 py-4">
              <p className="text-xs text-muted-foreground mb-4">
                Status unggahan tidak berarti dokumen telah diverifikasi.
              </p>
              {application.documents.map((doc) => (
                <div
                  key={doc.type}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-input bg-background/50 mb-2 last:mb-0"
                >
                  <div>
                    <div className="font-medium text-sm">{doc.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {doc.fileName}&nbsp;·&nbsp;{" "}
                      {formatFileSize(doc.sizeBytes)}&nbsp;·&nbsp;Format {doc.format} (maks. {doc.maxSize})
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {doc.status}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground">
                      Lihat berkas contoh
                    </Button>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-3">
                Semua berkas merupakan representasi contoh. Percocokan identitas
                foto KTP dan foto selfie dilakukan secara manual oleh petugas
                verifikasi berwenang.
              </p>
            </CardContent>
          </Card>

          {/*
            Pernyataan
          */}
          <Card>
            <CardHeader className="flex items-center justify-between px-6 pb-2">
              <div>
                <CardTitle className="text-base">
                  Pernyataan &amp; persetujuan pemohon
                </CardTitle>
                <CardDescription className="text-xs">
                  Status centang persetujuan kebijakan privasi dan syarat
                  ketentuan.
                </CardDescription>
              </div>
              <Badge variant="outline">Belum diperiksa</Badge>
            </CardHeader>
            <CardContent className="px-6 py-4">
              <div className="space-y-2">
                {application.statements.map((stmt) => (
                  <div key={stmt.label} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={stmt.checked}
                      readOnly
                      aria-label={stmt.label}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-primary text-primary focus:ring-primary accent-primary"
                    />
                    <div className="text-sm leading-relaxed">
                      <span className="font-medium">{stmt.label}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        &mdash; {stmt.by}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <CardFooter className="pt-3 px-6">
                <Button variant="link" size="sm" className="text-muted-foreground hover:text-primary underline decoration-primary/40 underline-offset-4">
                  Lihat Kebijakan privasi &amp; Syarat Ketentuan
                </Button>
              </CardFooter>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <InspectionSidebar categories={application.inspectionCategories} />
        </aside>
      </div>

      {/* Keputusan pengajuan */}
      <section>
        <DecisionForm />
      </section>
    </main>
  );
}
