import Link from "next/link";
import Image from "next/image";
import { RegisterAsnForm } from "./_components/register-asn-form";
import { CheckCircle2 } from "lucide-react";

const steps = [
  { id: 1, title: "Identitas & akun" },
  { id: 2, title: "Instansi & kepegawaian" },
  { id: 3, title: "Alamat" },
  { id: 4, title: "Dokumen" },
  { id: 5, title: "Tinjau & persetujuan" },
];

export default function RegisterAsnPage() {
  const currentStep = 4;
  
  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#192b40]">
      <header className="border-b border-[#e5ebf1] bg-white">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="Agoraya — beranda">
            <Image src="/logo/brand.svg" alt="" width={30} height={32} priority />
            <span className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-[-0.04em] text-[#192b40]">Agoraya</span>
              <span className="mt-0.5 text-[0.58rem] text-[#738397]">Data Publik, Untuk Semua</span>
            </span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 lg:py-10">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#3730a3]">
            AKUN INSTANSI
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-[-0.02em] sm:text-3xl">Daftar akun ASN</h1>
          <p className="text-sm text-[#5f6f85] sm:text-base">Lengkapi profil untuk mengajukan akses ke ruang instansi.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[30%_70%] lg:gap-8">
          <aside className="order-first rounded-xl border border-[#e5ebf1] bg-white p-6 lg:order-none">
            <nav aria-label="Langkah pendaftaran" className="overflow-x-auto">
              <ol className="flex gap-4 lg:flex-col lg:gap-4">
                {steps.map((step) => {
                  const isActive = step.id === currentStep;
                  const isCompleted = step.id < currentStep;
                  return (
                    <li key={step.id} className="flex min-w-[200px] items-start gap-3 lg:min-w-0">
                      <div
                        className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                          isCompleted
                            ? "bg-[#22c55e] text-white"
                            : isActive
                            ? "bg-[#2563eb] text-white"
                            : "border border-[#cbd5e1] bg-white text-[#64748b]"
                        }`}
                        aria-current={isActive ? "step" : undefined}
                      >
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isActive || isCompleted ? "text-[#192b40]" : "text-[#64748b]"}`}>
                          {step.title}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </nav>
            <div className="mt-8 space-y-3 border-t border-[#e5ebf1] pt-6 text-sm">
              <Link href="#" className="block text-[#2563eb] hover:underline">
                Baca panduan pendaftaran
              </Link>
              <Link href="/login" className="block text-[#2563eb] hover:underline">
                Sudah punya akun? Masuk
              </Link>
            </div>
            <div className="mt-6 space-y-2 rounded-lg bg-[#f8fafc] p-4 text-xs text-[#5f6f85]">
              <p className="font-medium text-[#192b40]">Kebijakan instansi</p>
              <p>Akun memerlukan persetujuan admin instansi setelah pendaftaran.</p>
              <p className="mt-2">Identitas dan dokumen hanya untuk verifikasi oleh petugas berwenang, tidak ditampilkan publik.</p>
            </div>
          </aside>

          <section className="rounded-xl border border-[#e5ebf1] bg-white p-6 shadow-sm sm:p-8">
            <RegisterAsnForm initialStep={currentStep} />
            <div className="mt-6 text-center text-xs text-[#5f6f85]">
              Identitas dan dokumen hanya untuk verifikasi oleh petugas berwenang, tidak ditampilkan publik.
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
