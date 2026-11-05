export default function ExecutiveDashboardLoading() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Kontrol akses ASN
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-9 w-9 rounded bg-muted animate-pulse" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-8 w-3/4 rounded bg-muted animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-border bg-card" />
    </div>
  );
}