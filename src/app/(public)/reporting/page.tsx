import { ReportQuickActions } from "./_components/report-quick-actions";

interface PublicReportingPageProps {
  searchParams: Promise<{
    category?: string | string[];
    subcategory?: string | string[];
  }>;
}

export default async function PublicReportingPage({
  searchParams,
}: PublicReportingPageProps) {
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
