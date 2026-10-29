import {
  ChartNoAxesColumnIncreasing,
  ClipboardList,
  Lightbulb,
  Megaphone,
} from "lucide-react";

type Feature = {
  caption: string;
  title: string;
  description: string;
  detail: string;
  accent: "blue" | "green" | "orange" | "violet";
  Icon: typeof ChartNoAxesColumnIncreasing;
};

const FEATURES: Feature[] = [
  {
    caption: "Pahami informasi",
    title: "Data Pemerintah",
    description:
      "Ruang untuk menelusuri data anggaran, proyek, dan statistik daerah dengan memperhatikan sumber serta periode datanya.",
    detail: "Untuk warga: membaca konteks sebelum menyimpulkan.",
    accent: "blue",
    Icon: ChartNoAxesColumnIncreasing,
  },
  {
    caption: "Kenali prosesnya",
    title: "Layanan Publik",
    description:
      "Ruang untuk memahami alur layanan, persyaratan, dan perkembangan proses dari sisi warga maupun instansi.",
    detail: "Untuk instansi: menjelaskan tahapan layanan dengan lebih jelas.",
    accent: "green",
    Icon: ClipboardList,
  },
  {
    caption: "Sampaikan persoalan",
    title: "Laporan Warga",
    description:
      "Ruang partisipasi untuk menyampaikan masalah sekitar, dengan konteks pelaporan, verifikasi, dan tindak lanjut.",
    detail: "Untuk warga: menyusun laporan yang faktual dan relevan.",
    accent: "orange",
    Icon: Megaphone,
  },
  {
    caption: "Temukan maknanya",
    title: "Insight",
    description:
      "Ruang untuk membaca perbandingan layanan, tren anggaran, dan indikator kesejahteraan secara lebih kontekstual.",
    detail: "Untuk semua: membandingkan data dengan dasar yang setara.",
    accent: "violet",
    Icon: Lightbulb,
  },
];

function accentClasses(accent: Feature["accent"]) {
  switch (accent) {
    case "blue":
      return {
        card: "bg-[#edf6ff] dark:bg-blue-950/30",
        icon: "bg-blue-600",
        title: "text-blue-700 dark:text-sky-300",
      };
    case "green":
      return {
        card: "bg-[#eff9f4] dark:bg-emerald-950/30",
        icon: "bg-emerald-600",
        title: "text-emerald-700 dark:text-emerald-300",
      };
    case "orange":
      return {
        card: "bg-[#fff6ef] dark:bg-orange-950/30",
        icon: "bg-orange-500",
        title: "text-orange-700 dark:text-orange-300",
      };
    case "violet":
      return {
        card: "bg-[#f5f0ff] dark:bg-violet-950/30",
        icon: "bg-violet-600",
        title: "text-violet-700 dark:text-violet-300",
      };
  }
}

export function KeyFeaturesSection() {
  return (
    <section
      aria-labelledby="key-features-title"
      className="dark:bg-background bg-[#f8fafc] py-14 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-9 max-w-[720px] text-center">
          <p className="text-[11px] font-semibold text-[#405a78] dark:text-slate-300">
            EMPAT PILAR Agoraya
          </p>
          <h2
            id="key-features-title"
            className="dark:text-foreground mt-3 text-[28px] leading-tight font-bold text-[#17263b] lg:text-[32px]"
          >
            Dari memahami data hingga ikut berperan
          </h2>
          <p className="dark:text-muted-foreground mt-3 text-base text-slate-500">
            Empat ruang yang saling melengkapi untuk mendukung transparansi dan
            partisipasi publik.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {FEATURES.map(
            ({ caption, title, description, detail, accent, Icon }, index) => {
              const styles = accentClasses(accent);

              return (
                <article
                  key={title}
                  aria-labelledby={`key-feature-${index + 1}-title`}
                  className={`rounded-[14px] border border-transparent ${styles.card} p-6 transition duration-200 hover:-translate-y-1 hover:border-blue-600 hover:shadow-md dark:hover:border-sky-500`}
                >
                  <div
                    className={`inline-flex size-[52px] items-center justify-center rounded-[16px] ${styles.icon}`}
                  >
                    <Icon
                      aria-hidden="true"
                      className="size-6 text-white"
                      strokeWidth={1.7}
                    />
                  </div>
                  <p className="mt-4 text-xs font-medium text-[#405a78] dark:text-slate-300">
                    {caption}
                  </p>
                  <h3
                    id={`key-feature-${index + 1}-title`}
                    className={`mt-1 text-lg font-bold ${styles.title}`}
                  >
                    {title}
                  </h3>
                  <p className="dark:text-muted-foreground mt-4 text-sm leading-[1.5] text-slate-600">
                    {description}
                  </p>
                  <p className="mt-4 text-sm leading-6 font-medium text-[#17263b] dark:text-slate-200">
                    {detail}
                  </p>
                </article>
              );
            },
          )}
        </div>

        <div className="dark:border-border dark:bg-card dark:text-muted-foreground mt-8 flex items-start gap-3 rounded-[10px] border border-[#dce6f1] bg-white px-4 py-3 text-sm leading-6 text-slate-600">
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-blue-600 text-[10px] font-bold text-blue-700 dark:border-sky-400 dark:text-sky-300"
          >
            i
          </span>
          <p>
            Empat pilar ini menjelaskan arah platform. Ketersediaan data,
            pelacakan, dan tindak lanjut mengikuti informasi pada masing-masing
            halaman; bukan berarti semua sumber atau instansi telah terhubung.
          </p>
        </div>
      </div>
    </section>
  );
}
