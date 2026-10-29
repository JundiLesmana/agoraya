import {
  BarChart3,
  Banknote,
  Building2,
  Info,
  Lightbulb,
  LayoutDashboard,
  Megaphone,
} from "lucide-react";

type Feature = {
  caption: string;
  title: string;
  description: string;
  detail: string;
  accent: "blue" | "green" | "orange" | "violet";
  Icon: typeof LayoutDashboard;
};

const FEATURES: Feature[] = [
  {
    caption: "Ringkasan data",
    title: "Dashboard Ringkasan",
    description:
      "Lihat ringkasan anggaran, proyek, dan indikator sosial-ekonomi dalam satu tampilan.",
    detail: "Untuk warga: lihat capaian pembangunan di wilayah Anda.",
    accent: "blue",
    Icon: LayoutDashboard,
  },
  {
    caption: "Alokasi anggaran",
    title: "Data Anggaran",
    description:
      "Telusuri alokasi dan realisasi anggaran per sektor dan wilayah.",
    detail: "Untuk warga: telusuri penggunaan anggaran daerah.",
    accent: "green",
    Icon: Banknote,
  },
  {
    caption: "Proyek pembangunan",
    title: "Proyek Daerah",
    description:
      "Pantau progres proyek pembangunan dari perencanaan hingga penyelesaian.",
    detail: "Untuk warga: pantau status proyek di sekitar Anda.",
    accent: "orange",
    Icon: Building2,
  },
  {
    caption: "Indikator sosial",
    title: "Statistik Daerah",
    description:
      "Akses indikator sosial-ekonomi seperti IPM, kemiskinan, dan pengangguran.",
    detail: "Untuk semua: lihat indikator kesejahteraan daerah.",
    accent: "blue",
    Icon: BarChart3,
  },
  {
    caption: "Interpretasi data",
    title: "Insight Publik",
    description:
      "Dapatkan interpretasi bermakna dari data mentah untuk pengambilan keputusan.",
    detail: "Untuk semua: baca analisis dan insight publik.",
    accent: "violet",
    Icon: Lightbulb,
  },
  {
    caption: "Partisipasi warga",
    title: "Lapor Warga",
    description:
      "Laporkan masalah publik dan pantau tindak lanjutnya secara real-time.",
    detail: "Untuk warga: laporkan masalah dan pantau tindak lanjut.",
    accent: "orange",
    Icon: Megaphone,
  },
];

function accentClasses(accent: Feature["accent"]) {
  switch (accent) {
    case "blue":
      return {
        card: "bg-[#edf6ff]",
        icon: "bg-blue-600",
        title: "text-blue-700",
      };
    case "green":
      return {
        card: "bg-[#eff9f4]",
        icon: "bg-emerald-600",
        title: "text-emerald-700",
      };
    case "orange":
      return {
        card: "bg-[#fff6ef]",
        icon: "bg-orange-500",
        title: "text-orange-700",
      };
    case "violet":
      return {
        card: "bg-[#f5f0ff]",
        icon: "bg-violet-600",
        title: "text-violet-700",
      };
  }
}

export function KeyFeaturesSection() {
  return (
    <section
      aria-labelledby="key-features-title"
      className="bg-[#f8fafc] py-14 sm:py-16"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="mx-auto mb-9 max-w-[720px] text-center">
          <p className="text-[11px] font-semibold text-[#405a78]">
            FITUR UTAMA AGORAYA
          </p>
          <h2
            id="key-features-title"
            className="mt-3 text-[28px] font-bold text-[#17263b] lg:text-[32px]"
          >
            Fitur Utama
          </h2>
          <p className="mt-3 text-base text-slate-500">
            Platform ini menyediakan berbagai fitur untuk mengakses dan
            menganalisis data pembangunan.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(
            ({ caption, title, description, detail, accent, Icon }, index) => {
              const styles = accentClasses(accent);

              return (
                <article
                  key={title}
                  aria-labelledby={`key-feature-${index + 1}-title`}
                  className={`rounded-[14px] border border-transparent ${styles.card} p-6 transition duration-200 hover:-translate-y-1 hover:border-blue-600 hover:shadow-md`}
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
                  <p className="mt-4 text-xs font-medium text-[#405a78]">
                    {caption}
                  </p>
                  <h3
                    id={`key-feature-${index + 1}-title`}
                    className={`mt-1 text-lg font-bold ${styles.title}`}
                  >
                    {title}
                  </h3>
                  <p className="mt-4 text-sm leading-[1.5] text-slate-500">
                    {description}
                  </p>
                  <p className="mt-4 text-sm leading-6 font-medium text-[#17263b]">
                    {detail}
                  </p>
                </article>
              );
            },
          )}
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-[10px] border border-[#dce6f1] bg-white px-4 py-3 text-sm leading-6 text-slate-500">
          <Info
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-blue-600"
          />
          <p>
            Fitur-fitur ini menghubungkan akses data, pemahaman layanan, dan
            partisipasi warga. Informasi yang tersedia mengikuti data pada
            masing-masing halaman.
          </p>
        </div>
      </div>
    </section>
  );
}
