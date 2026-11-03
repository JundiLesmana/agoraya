export default function AsnDatasetCatalogLoading() {
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
