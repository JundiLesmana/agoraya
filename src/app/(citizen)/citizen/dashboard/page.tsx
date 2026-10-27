import { ReportQuickActions } from "./_components/report-quick-actions";

interface CitizenDashboardPageProps {
  searchParams: Promise<{ category?: string | string[] }>;
}

export default async function CitizenDashboardPage({
  searchParams,
}: CitizenDashboardPageProps) {
  const { category } = await searchParams;

  return (
    <ReportQuickActions
      initialCategory={typeof category === "string" ? category : undefined}
    />
  );
}
