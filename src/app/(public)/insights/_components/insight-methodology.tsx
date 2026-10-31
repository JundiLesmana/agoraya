import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  HeartPulse,
  Info,
  Wallet,
} from 'lucide-react';

const METHODOLOGY_ITEMS = [
  {
    title: 'Layanan perizinan',
    source: 'Simulasi layanan perizinan Agoraya',
    period: '2024',
    coverage: '5 kota di Jawa Barat',
    reference: 'Rujukan layanan perizinan (OSS)',
    href: 'https://oss.go.id/',
    Icon: BriefcaseBusiness,
  },
  {
    title: 'Anggaran daerah',
    source: 'Simulasi APBD Agoraya · Data contoh',
    period: '2020-2024',
    coverage: 'Kota Bandung',
    reference: 'Data APBD resmi (DJPK)',
    href: 'https://djpk.kemenkeu.go.id/portal/data/apbd',
    Icon: Wallet,
  },
  {
    title: 'Kesejahteraan warga',
    source: 'Simulasi sosial-ekonomi Agoraya',
    period: '2023-2024',
    coverage: 'Kota Bandung',
    reference: 'Metadata statistik (BPS)',
    href: 'https://sirusa.web.bps.go.id/metadata/',
    Icon: HeartPulse,
  },
] as const;

export function InsightMethodology() {
  return (
    <section
      aria-labelledby="insight-methodology-title"
      className="border-border bg-muted/30 mt-10 rounded-xl border p-5 sm:p-6"
    >
      <header className="mb-5">
        <p className="text-primary mb-1 text-xs font-semibold tracking-wider uppercase">
          Transparansi data
        </p>
        <h2
          id="insight-methodology-title"
          className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight"
        >
          <BookOpen
            className="text-primary size-5 shrink-0"
            aria-hidden="true"
          />
          Sumber &amp; metodologi
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Kenali asal angka dan batas penggunaannya sebelum mengambil
          kesimpulan.
        </p>
      </header>

      <aside
        role="note"
        className="mb-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
      >
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          Semua angka di bawah adalah simulasi dan data contoh, bukan data
          resmi. Tautan hanya mengarah ke referensi eksternal terkait, bukan
          sumber angka yang ditampilkan.
        </p>
      </aside>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {METHODOLOGY_ITEMS.map(
          ({ title, source, period, coverage, reference, href, Icon }) => (
            <article
              key={title}
              className="border-border bg-background flex h-full flex-col rounded-lg border p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </div>
              <h3 className="text-foreground text-base font-semibold">
                {title}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {source}
              </p>
              <dl className="border-border mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-sm">
                <div>
                  <dt className="text-muted-foreground text-xs">Periode</dt>
                  <dd className="text-foreground mt-1 font-medium">{period}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Cakupan</dt>
                  <dd className="text-foreground mt-1 font-medium">
                    {coverage}
                  </dd>
                </div>
              </dl>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary focus-visible:outline-primary mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {reference}
                <ArrowUpRight className="size-4" aria-hidden="true" />
                <span className="sr-only">(membuka tab baru)</span>
              </a>
            </article>
          ),
        )}
      </div>
    </section>
  );
}
