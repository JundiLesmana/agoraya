import type { ProjectSummary } from '@/lib/summary';
import { ProgressDistributionChart } from './_components/progress-distribution-chart';
import { SectorCompletionChart } from './_components/sector-completion-chart';
import { SummaryCards } from './_components/summary-cards';

async function fetchSummary(): Promise<ProjectSummary | null> {
  const res = await fetch('/api/projects/summary', { cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.json()) as ProjectSummary;
}

export default async function ExecutiveDashboardPage() {
  const summary = await fetchSummary();

  if (!summary) {
    return (
      <main className="container mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Ringkasan Proyek
        </h1>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-muted-foreground">
            Gagal memuat data ringkasan proyek.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Ringkasan Proyek
      </h1>
      <SummaryCards summary={summary} />
      <ProgressDistributionChart summary={summary} />
      <SectorCompletionChart />
    </main>
  );
}
