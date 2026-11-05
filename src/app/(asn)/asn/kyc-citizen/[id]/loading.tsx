export default function VerifikasiAkunWargaDetailLoading() {
  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span className="text-foreground">Ruang instansi</span>
        <span>/</span>
        <span className="text-foreground">Verifikasi akun warga</span>
        <span>/</span>
        <span className="text-foreground font-medium">Detail pengajuan</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight mb-2">Verifikasi akun warga</h1>
      <p className="text-muted-foreground mb-6">
        Memuat detail pengajuan...
      </p>

      <div className="h-10 w-48 rounded bg-muted animate-pulse" />
      <div className="h-4 w-1/3 rounded bg-muted animate-pulse mb-4" />
      <div className="bg-amber-50 rounded-lg p-4 h-24 animate-pulse" />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <aside className="space-y-6">
          <SidebarSkeleton />
          <SidebarSkeleton />
          <SidebarSkeleton />
        </aside>
      </div>

      <section className="pt-6">
        <div className="h-10 w-1/4 rounded bg-muted animate-pulse mb-4" />
        <div className="h-10 w-full rounded bg-muted animate-pulse mb-3" />
        <div className="flex gap-2">
          <ButtonSkeleton variant="destructive" />
          <ButtonSkeleton variant="secondary" />
          <ButtonSkeleton />
        </div>
      </section>
    </main>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 animate-pulse">
      <div className="h-4 w-1/3 rounded bg-muted mb-3" />
      <div className="grid gap-4">
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 animate-pulse">
      <div className="h-4 w-3/4 rounded bg-muted mb-4" />
      <div className="space-y-3">
        <div className="h-9 w-full rounded-md border border-input bg-transparent" />
        <div className="h-9 w-full rounded-md border border-input bg-transparent" />
        <div className="h-9 w-full rounded-md border border-input bg-transparent" />
      </div>
      <div className="h-32 rounded-lg border border-input bg-transparent mt-4" />
    </div>
  );
}

function ButtonSkeleton({ variant }: { variant?: "destructive" | "secondary" }) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50
        ${
          variant === "destructive"
            ? "bg-destructive text-destructive-foreground"
            : variant === "secondary"
              ? "bg-secondary text-secondary-foreground"
              : "bg-primary text-primary-foreground"
        }
        animate-pulse
      `}
      disabled
    >
      &nbsp;
    </button>
  );
}
