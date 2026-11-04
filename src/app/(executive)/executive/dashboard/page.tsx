import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDashed,
  Download,
  FileText,
  Info,
  PanelLeftOpen,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

const summaryCards = [
  {
    label: 'Kejadian dalam periode',
    value: '8',
    detail: '22–26 Oktober 2026',
    tone: 'bg-blue-50 text-blue-700',
    icon: FileText,
  },
  {
    label: 'Kejadian CMS',
    value: '6',
    detail: '4 naik CMS · 5 belum',
    tone: 'bg-violet-50 text-violet-700',
    icon: PanelLeftOpen,
  },
  {
    label: 'Verifikasi ASN',
    value: '1',
    detail: 'Kepatuhan antrian',
    tone: 'bg-emerald-50 text-emerald-700',
    icon: ShieldCheck,
  },
  {
    label: 'Perubahan hak akses',
    value: '1',
    detail: 'Pembaruan berhasil',
    tone: 'bg-amber-50 text-amber-700',
    icon: Users,
  },
];

const historyRows = [
  ['28 Okt 2026', 'Maya Pertiwi', 'Executive · hak akses', 'Bima Santosa · ASN-002', 'Tambah hak akses', 'Berhasil', 'Lihat +'],
  ['28 Okt 2026', 'Citra Larasati', 'Verifikasi akun ASN', 'Farah Aninda · ASN-006', 'Setujui akun', 'Berhasil', 'Lihat +'],
  ['28 Okt 2026', 'Fadhel Wicaksono', 'Editor · publikasi', 'Bima Santosa · ASN-002', 'Publikasikan', 'Ditolak', 'Lihat +'],
  ['27 Okt 2026', 'Aditya Nugraha', 'Katalog dataset & metadata', 'DS-018 · Akses internet', 'Submit', 'Berhasil', 'Lihat +'],
  ['27 Okt 2026', 'Bima Santosa', 'Anggaran APBD', 'APBD-2026 · Dekominfo', 'Review', 'Berhasil', 'Lihat +'],
  ['26 Okt 2026', 'Citra Larasati', 'Verifikasi & moderasi', 'LAP-032 · Fasilitas tamu', 'Perbarui status', 'Berhasil', 'Lihat +'],
  ['23 Okt 2026', 'Bima Santosa', 'Standar & formulir layanan', 'LYN-008 · izin usaha', 'Ubah standar', 'Berhasil', 'Lihat +'],
  ['22 Okt 2026', 'Aditya Nugraha', 'Sumber & validasi analisis', 'SRC-014 · Statistik wilayah', 'Validasi sumber', 'Berhasil', 'Lihat +'],
];

const filters = [
  { label: 'Rentang tanggal', value: '22–28 Oktober 2026' },
  { label: 'Pelaku', value: 'Semua pelaku' },
  { label: 'Modul / laman', value: 'Semua modul' },
  { label: 'Aksi', value: 'Semua aksi' },
  { label: 'Hasil', value: 'Semua hasil' },
];

const navItems = [
  { label: 'Kontrol akses ASN', active: false, icon: Shield },
  { label: 'Audit log terpadu', active: true, icon: FileText },
  { label: 'Kinerja ASN', active: false, icon: Sparkles },
  { label: 'Akses perubahan', active: false, icon: ArrowUpRight },
  { label: 'Persetujuan', active: false, icon: CheckCircle2 },
];

export default function ExecutiveDashboardPage() {
  return (
    <div className="min-h-screen bg-[#edf3f8] text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-[1600px] overflow-hidden border border-slate-200 bg-[#f4f7fb] shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        <aside className="flex w-[255px] flex-col border-r border-slate-200 bg-[#f6f8fb]">
          <div className="flex h-[72px] items-center gap-3 border-b border-slate-200 px-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white shadow-sm">
              A
            </div>
            <div className="text-xl font-bold tracking-tight text-slate-800">Agoraya</div>
          </div>

          <div className="px-4 py-4">
            <div className="rounded-xl bg-sky-50 p-3 shadow-sm ring-1 ring-sky-100">
              <div className="text-[11px] uppercase tracking-[0.18em] text-sky-700/80">
                Ruang Executive
              </div>
              <div className="mt-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>Permintaan Kotak Kontrol</span>
                <div className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                  Superadmin
                </div>
              </div>
            </div>
          </div>

          <div className="px-3 pt-2">
            <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Tata Kelola
            </div>
            <nav className="space-y-1.5">
              {navItems.map(({ label, active, icon: Icon }) => (
                <button
                  key={label}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto border-t border-slate-200 px-4 py-4">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <div className="font-medium text-slate-700">Akses berperan</div>
                <div className="text-xs text-slate-500">Superadmin</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto bg-[#f5f7fa]">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="font-medium text-slate-700">Agoraya</span>
              <span className="text-slate-300">/</span>
              <span>Data kota Indonesia</span>
              <span className="text-slate-300">/</span>
              <span className="font-medium text-slate-700">Ruang Executive</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <button type="button" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium shadow-sm">
                Area terbatas
              </button>
              <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                <Bell className="h-3.5 w-3.5" />
                Waktu: 09:41
              </span>
            </div>
          </header>

          <div className="px-6 py-5">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  Ruang Executive
                </div>
                <h1 className="text-[38px] font-bold tracking-[-0.04em] text-slate-800">
                  Audit log terpadu
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Telusuri perubahan seluruh layanan CMS, verifikasi ASN, dan perubahan akses eksekutif.
                </p>
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Ekspor log
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {summaryCards.map(({ label, value, detail, tone, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="text-[32px] font-bold leading-none tracking-[-0.04em] text-slate-800">
                    {value}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">{detail}</div>
                </div>
              ))}
            </div>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">Penyaring kejadian</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Semua kejadian dalam periode yang dipilih.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500"
                >
                  Terapkan filter
                </button>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {filters.map(({ label, value }) => (
                  <label key={label} className="block text-sm text-slate-600">
                    <span className="mb-1.5 block font-medium text-slate-700">{label}</span>
                    <div className="relative">
                      <select
                        defaultValue={value}
                        className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 pr-9 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-400 focus:bg-white"
                      >
                        <option>{value}</option>
                        <option>Semua</option>
                        <option>Hari ini</option>
                        <option>Minggu ini</option>
                        <option>Bulan ini</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">Riwayat kejadian</h3>
                  <p className="text-sm text-slate-500">8 kejadian dalam 7 hari terakhir</p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  Hanya baca
                </div>
              </div>

              <div className="overflow-hidden">
                <table className="min-w-full border-separate border-spacing-0">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Waktu</th>
                      <th className="px-5 py-3">Pelaku</th>
                      <th className="px-5 py-3">Modul / laman</th>
                      <th className="px-5 py-3">Objek</th>
                      <th className="px-5 py-3">Aksi</th>
                      <th className="px-5 py-3">Hasil</th>
                      <th className="px-5 py-3">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRows.map((row, index) => (
                      <tr key={`${row[1]}-${index}`} className="border-t border-slate-200 text-sm text-slate-700">
                        <td className="border-t border-slate-200 px-5 py-3 align-top">{row[0]}</td>
                        <td className="border-t border-slate-200 px-5 py-3 align-top">{row[1]}</td>
                        <td className="border-t border-slate-200 px-5 py-3 align-top">{row[2]}</td>
                        <td className="border-t border-slate-200 px-5 py-3 align-top">{row[3]}</td>
                        <td className="border-t border-slate-200 px-5 py-3 align-top">{row[4]}</td>
                        <td className="border-t border-slate-200 px-5 py-3 align-top">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              row[5] === 'Ditolak'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {row[5]}
                          </span>
                        </td>
                        <td className="border-t border-slate-200 px-5 py-3 align-top">
                          <button type="button" className="inline-flex items-center gap-1 font-medium text-sky-700 hover:text-sky-800">
                            {row[6]}
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm text-slate-500">
                <span>Menampilkan 1–8 dari 8 kejadian dalam periode</span>
                <div className="flex items-center gap-2">
                  <button type="button" className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-500">
                    1
                  </button>
                  <button type="button" className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500">
                    Halaman 1 dari 1
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">
                    Detail kejadian · pembaruan akses Executive
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">AUD-2026-10-28-08 · 2026-10-28 15:42:08 WIB</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Berhasil
                </span>
              </div>

              <div className="grid gap-5 lg:grid-cols-[1.2fr_2.6fr]">
                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <CircleDashed className="h-4 w-4 text-slate-500" />
                    Pelaku & tanggal
                  </div>
                  <div className="space-y-4 text-sm text-slate-600">
                    <div>
                      <div className="text-xs uppercase tracking-[0.12em] text-slate-400">Pelaku</div>
                      <div className="mt-1 font-medium text-slate-800">Maya Pertiwi</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.12em] text-slate-400">Peran</div>
                      <div className="mt-1 font-medium text-slate-800">Superadmin</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.12em] text-slate-400">Sumber</div>
                      <div className="mt-1 font-medium text-slate-800">Executive</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.12em] text-slate-400">Keterangan</div>
                      <div className="mt-1 font-medium text-slate-800">Pembaruan akses baru</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Info className="h-4 w-4 text-sky-600" />
                        Sebelum
                      </div>
                      <div className="space-y-3 text-sm text-slate-600">
                        <div>
                          <div className="text-xs uppercase tracking-[0.12em] text-slate-400">Objek</div>
                          <div className="mt-1 font-medium text-slate-800">Bima Santosa · ASN-002</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.12em] text-slate-400">Status</div>
                          <div className="mt-1 font-medium text-slate-800">Tidak ada akses eksekutif</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.12em] text-slate-400">Catatan</div>
                          <div className="mt-1 font-medium text-slate-800">Sistem menunggu persetujuan manual</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Sesudah
                      </div>
                      <div className="space-y-3 text-sm text-emerald-800">
                        <div>
                          <div className="text-xs uppercase tracking-[0.12em] text-emerald-600">Objek</div>
                          <div className="mt-1 font-medium">Bima Santosa · ASN-002</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.12em] text-emerald-600">Status</div>
                          <div className="mt-1 font-medium">Eksekutif · Pengelola</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.12em] text-emerald-600">Catatan</div>
                          <div className="mt-1 font-medium">Hak akses diberikan dengan validasi otomatis</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                    <div className="mb-2 flex items-center gap-2 font-semibold">
                      <Info className="h-4 w-4" />
                      Informasi privasi & keamanan
                    </div>
                    <p>
                      Log ini menampilkan metadata yang diperlukan agar pegiat dapat memonitor aktivitas
                      sensitif yang berkaitan dengan pembaruan otorisasi. Data disimpan dalam bentuk yang
                      terbatas dan hanya dapat dilihat oleh pihak yang memiliki wewenang.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
