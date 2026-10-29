import { BookOpen, Info, Ruler, TrendingUp } from "lucide-react";

const READING_GUIDES = [
  {
    title: "Mulai dari ukuran yang sama",
    description:
      "Periksa wilayah, tahun, dan satuan. 0,2 poin persentase, bukan 0,2%.",
    Icon: Ruler,
  },
  {
    title: "Baca arah, bukan hanya angka",
    description:
      "Nilai tinggi tidak selalu lebih baik. Kemiskinan diharapkan turun; lama sekolah diharapkan naik.",
    Icon: TrendingUp,
  },
  {
    title: "Selalu lihat konteksnya",
    description:
      "Korelasi bukan sebab-akibat. Gunakan data bersama kondisi lapangan; data yang tidak tersedia tidak boleh dianggap nol.",
    Icon: Info,
  },
];

export function InsightReadingGuide() {
  return (
    <section
      aria-labelledby="insight-reading-guide-title"
      className="border-border bg-muted/40 mt-10 rounded-xl border p-5 sm:p-6"
    >
      <header className="mb-5">
        <p className="text-primary mb-1 text-xs font-semibold tracking-wider uppercase">
          Data lebih mudah dipahami
        </p>
        <h2
          id="insight-reading-guide-title"
          className="text-foreground flex items-center gap-2 text-2xl font-bold tracking-tight"
        >
          <BookOpen
            className="text-primary size-5 shrink-0"
            aria-hidden="true"
          />
          Cara membaca insight ini
        </h2>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {READING_GUIDES.map(({ title, description, Icon }) => (
          <article key={title} className="flex items-start gap-3">
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-foreground text-sm font-semibold">{title}</h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                {description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
