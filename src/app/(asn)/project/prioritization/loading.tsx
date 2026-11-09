export default function ProjectPrioritizationLoading() {
  return (
    <div
      className="space-y-6 p-6"
      aria-label="Memuat ruang prioritisasi proyek"
    >
      <div className="bg-muted h-4 w-64 animate-pulse rounded" />
      <div className="bg-muted h-10 w-80 animate-pulse rounded" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-muted h-48 animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  );
}
