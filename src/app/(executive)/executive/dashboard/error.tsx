'use client';

export default function ExecutiveDashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="rounded-xl border border-destructive bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-destructive">
          Terjadi kesalahan memuat data
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => reset()}
          className="mt-4 inline-flex items-center rounded-md border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Coba lagi
        </button>
      </div>
    </div>
  );
}