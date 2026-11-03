import { BudgetSummary } from '@/components/budget-summary';
import { SourceBadge } from '@/components/source-badges/source-badge';
import { ApbdEntryBoard } from './_components/ApbdEntryBoard';
import type { ApbdEntry } from './_components/ApbdEntryBoard';

// TODO: replace with real data from @/modules/cms once the actor/tenant session
// is wired. Currently simulated for MVP (SourceBadge = SIMULATED).
const MOCK_APBD_ENTRIES: ApbdEntry[] = [
  {
    id: 'apbd-001',
    tahun: 2025,
    satker: 'Dinas Pekerjaan Umum dan Penataan Ruang',
    kegiatan: 'Pembangunan Jalan Raya',
    pagu: 80,
    realisasi: 60,
    periode: 's.d. September 2025',
    status: 'published',
  },
  {
    id: 'apbd-002',
    tahun: 2025,
    satker: 'Dinas Pendidikan',
    kegiatan: 'Pembaikan Sarana Pendidikan',
    pagu: 45,
    realisasi: 30,
    periode: 's.d. September 2025',
    status: 'published',
  },
  {
    id: 'apbd-003',
    tahun: 2025,
    satker: 'Dinas Kesehatan',
    kegiatan: 'Revitalisasi Puskesmas',
    pagu: 30,
    realisasi: 22,
    periode: 's.d. September 2025',
    status: 'submitted',
  },
];

function computeStats(entries: readonly ApbdEntry[]) {
  const totalAnggaran = entries.reduce((s, e) => s + e.pagu, 0);
  const realisasi = entries.reduce((s, e) => s + e.realisasi, 0);
  return {
    totalAnggaran,
    realisasi,
    sisaAnggaran: totalAnggaran - realisasi,
    tingkatRealisasi: totalAnggaran > 0 ? (realisasi / totalAnggaran) * 100 : 0,
  };
}

export default async function AsnApbdDataManagementPage() {
  // Simulasi penundaan pemuatan data agar status loading/error meaningful.
  await new Promise((resolve) => setTimeout(resolve, 200));

  const entries = MOCK_APBD_ENTRIES;
  const stats = computeStats(entries);

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Data APBD</h1>
          <p className="text-muted-foreground text-sm">
            Antarmuka input terpusat data Anggaran (Pagu) dan Realisasi APBD dengan
            validasi bawaan, untuk menjamin keakuratan dan kelancaran publikasi data.
          </p>
        </div>
        <SourceBadge source="SIMULATED" className="text-[10px]" />
      </header>

      <section aria-labelledby="ringkasan-apbd-heading">
        <h2 id="ringkasan-apbd-heading" className="sr-only">
          Ringkasan anggaran daerah
        </h2>
        <BudgetSummary
          totalAnggaran={stats.totalAnggaran}
          realisasi={stats.realisasi}
          sisaAnggaran={stats.sisaAnggaran}
          tingkatRealisasi={stats.tingkatRealisasi}
          tahun="2025"
          periode="s.d. September 2025"
        />
      </section>

      <ApbdEntryBoard initialEntries={entries} />
    </main>
  );
}
