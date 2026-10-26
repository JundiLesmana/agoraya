import { ReportForm } from "./_components/report-form";

interface CitizenReportingPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function CitizenReportingPage({
  searchParams,
}: CitizenReportingPageProps) {
  const { category } = await searchParams;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <header>
        <p className="text-primary text-xs font-semibold tracking-wide uppercase">
          Laporan warga
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Bantu kami memahami masalahnya
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Isi informasi selengkap mungkin. Kolom bertanda * wajib diisi.
        </p>
      </header>
      <ReportForm initialCategory={category} />
    </main>
  );
}
