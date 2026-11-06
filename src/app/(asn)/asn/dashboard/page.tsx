import { AgencyDashboard } from "./_components/agency-dashboard";

export default function AsnDashboardPage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <header>
        <p className="text-primary text-xs font-medium tracking-wide uppercase">
          Layanan publik
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Dashboard layanan & laporan
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Pantau laporan warga dan pengajuan layanan (perizinan, pendidikan,
          sosial, kesehatan) yang tersimpan di basis data instansi.
        </p>

      </header>
      <AgencyDashboard />
    </main>
  );
}
