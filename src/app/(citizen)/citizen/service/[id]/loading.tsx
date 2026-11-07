export default function CitizenSubmissionDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-32 animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="space-y-6">
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
          <div className="h-80 animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="space-y-6">
          <div className="h-48 animate-pulse rounded-xl bg-muted" />
          <div className="h-36 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
