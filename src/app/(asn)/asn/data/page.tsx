import { Suspense } from "react";
import { DatasetCatalog } from "./_components/dataset-catalog";
import { DatasetSubmissionReview } from "./_components/dataset-submission-review";
import { DatasetSubmissionWorkspace } from "./_components/dataset-submission-workspace";

export default function AsnDatasetCatalogPage() {
  return (
    <div className="space-y-8 pb-8">
      <DatasetSubmissionWorkspace />
      <DatasetSubmissionReview />
      <Suspense fallback={<DatasetCatalogLoading />}>
        <DatasetCatalog allowLegacyActions={false} hideHeader />
      </Suspense>
    </div>
  );
}

function DatasetCatalogLoading() {
  return (
    <div className="space-y-6" aria-label="Memuat katalog dataset">
      <div className="bg-muted h-4 w-56 animate-pulse rounded" />
      <div className="bg-muted h-12 w-72 animate-pulse rounded" />
      <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="bg-muted h-64 animate-pulse rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="bg-muted h-56 animate-pulse rounded-xl"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
