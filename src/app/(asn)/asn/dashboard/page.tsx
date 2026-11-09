import { AgencyDashboard } from "./_components/agency-dashboard";

export const dynamic = "force-dynamic";

export default function AsnDashboardPage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <AgencyDashboard />
    </main>
  );
}
