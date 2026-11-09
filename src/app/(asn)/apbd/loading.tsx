export default function AsnApbdDataManagementLoading() {
  return (
    <div className="space-y-6 p-6" aria-label="Memuat data manajemen APBD">
      <div className="h-8 w-48 rounded bg-muted animate-pulse" />
      <div className="h-32 rounded-xl bg-muted animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
      <div className="h-16 rounded-xl bg-muted animate-pulse" />
      <div className="grid gap-4 lg:grid-cols-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}
