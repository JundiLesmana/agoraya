import { ServiceSpaceNavigation } from "@/components/service-space-navigation";
import { AgencyDashboard } from "./_components/agency-dashboard";

export default function AsnReportingPage() {
  return (
    <>
      <section className="border-border border-b bg-sky-50 dark:bg-sky-950/30">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <p className="text-muted-foreground text-xs">
            Beranda · Layanan Publik · Ruang Instansi
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Ruang Instansi
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
            Kelola dan pantau tindak lanjut layanan publik instansi Anda.
          </p>
          <ServiceSpaceNavigation activeSpace="agency" />
        </div>
      </section>
      <AgencyDashboard />
    </>
  );
}
