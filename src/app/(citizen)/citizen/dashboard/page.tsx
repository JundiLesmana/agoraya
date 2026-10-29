import { ReportQuickActions } from "./_components/report-quick-actions";

interface CitizenDashboardPageProps {
  searchParams: Promise<{
    category?: string | string[];
    subcategory?: string | string[];
  }>;
}

export default async function CitizenDashboardPage({
  searchParams,
}: CitizenDashboardPageProps) {
  const { category, subcategory } = await searchParams;

  return (
    <ReportQuickActions
      initialCategory={typeof category === "string" ? category : undefined}
      initialSubcategory={
        typeof subcategory === "string" ? subcategory : undefined
      }
    />
  );
}
