import { Folder, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { SummaryCard } from './summary-card';
import type { ProjectSummary } from '@/lib/summary';
import { SourceBadge } from '@/components/source-badges';
import { formatPersentase, hitungPersentase } from '@/lib/summary';

export function SummaryCards({ summary }: { summary: ProjectSummary }) {
  const selesaiPct = formatPersentase(hitungPersentase(summary.selesai, summary.totalProyek));
  const berjalanPct = formatPersentase(
    hitungPersentase(summary.berjalan, summary.totalProyek),
  );
  const tertundaPct = formatPersentase(
    hitungPersentase(summary.tertunda, summary.totalProyek),
  );

  return (
    <section
      aria-label="Ringkasan KPI proyek"
      className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
    >
      <SummaryCard
        label="Total proyek"
        value={summary.totalProyek}
        subLabel={`${summary.totalWilayah} kabupaten / kota`}
        Icon={Folder}
        iconClass="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        ariaLabel={`Total proyek ${summary.totalProyek}`}
      />
      <SummaryCard
        label="Selesai"
        value={summary.selesai}
        subLabel={`${selesaiPct} dari total proyek`}
        Icon={CheckCircle}
        iconClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300"
        ariaLabel={`Selesai ${summary.selesai} proyek`}
      />
      <SummaryCard
        label="Berjalan"
        value={summary.berjalan}
        subLabel={`${berjalanPct} dari total proyek`}
        Icon={Clock}
        iconClass="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
        ariaLabel={`Berjalan ${summary.berjalan} proyek`}
      />
      <SummaryCard
        label="Tertunda"
        value={summary.tertunda}
        subLabel={`${tertundaPct} dari total proyek · perlu perhatian`}
        Icon={AlertCircle}
        iconClass="bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300"
        ariaLabel={`Tertunda ${summary.tertunda} proyek`}
      />
      <SourceBadge source="SIMULATED" />
    </section>
  );
}