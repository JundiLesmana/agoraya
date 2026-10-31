export default function AnalyticsLoading() {
  return (
    <main
      aria-label="Memuat Ruang Statistik"
      aria-busy="true"
      className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
    >
      <div className="border-border/80 space-y-3 border-b pb-6">
        <div className="bg-muted h-3 w-36 animate-pulse rounded" />
        <div className="bg-muted h-9 w-64 max-w-full animate-pulse rounded" />
        <div className="bg-muted h-4 w-full max-w-xl animate-pulse rounded" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="border-border/80 space-y-4 rounded-xl border p-5"
          >
            <div className="bg-muted h-4 w-28 animate-pulse rounded" />
            <div className="bg-muted h-8 w-24 animate-pulse rounded" />
            <div className="bg-muted h-3 w-32 animate-pulse rounded" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="border-border/80 bg-muted/40 h-80 animate-pulse rounded-xl border lg:col-span-3" />
        <div className="border-border/80 bg-muted/40 h-80 animate-pulse rounded-xl border lg:col-span-2" />
      </div>
      <p className="sr-only" role="status">
        Ruang Statistik sedang dimuat.
      </p>
    </main>
  );
}
