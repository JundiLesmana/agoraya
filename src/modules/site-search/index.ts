export interface PublicSearchPage {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly terms: string;
}

export const PUBLIC_SEARCH_PAGES: readonly PublicSearchPage[] = [
  {
    title: "Data Pemerintah",
    description:
      "Jelajahi anggaran daerah, proyek pembangunan, statistik, dan dataset pemerintah.",
    href: "/data",
    terms:
      "data pemerintah dataset publik apbd anggaran proyek pembangunan statistik bps wilayah tahun csv",
  },
  {
    title: "Anggaran dan APBD",
    description:
      "Telusuri pagu dan realisasi anggaran daerah berdasarkan wilayah, tahun, dan sektor.",
    href: "/data/anggaran",
    terms:
      "anggaran apbd pagu realisasi belanja pendapatan keuangan daerah sektor ekonomi",
  },
  {
    title: "Proyek pembangunan",
    description:
      "Lihat proyek pembangunan, lokasi, nilai anggaran, dan progres pelaksanaan.",
    href: "/data/project",
    terms:
      "proyek pembangunan infrastruktur pekerjaan lokasi kontrak progres jalan jembatan gedung",
  },
  {
    title: "Statistik daerah",
    description:
      "Temukan indikator penduduk, kesejahteraan, ekonomi, dan statistik BPS.",
    href: "/data/statistik",
    terms:
      "statistik bps indikator data penduduk kemiskinan pengangguran ipm pendidikan kesehatan kesejahteraan ekonomi",
  },
  {
    title: "Insight publik",
    description:
      "Bandingkan indikator dan pahami tren anggaran, layanan, serta kesejahteraan.",
    href: "/insight",
    terms:
      "insight analitik analisis grafik tren perbandingan anggaran layanan kesejahteraan indikator",
  },
  {
    title: "Layanan publik",
    description:
      "Ajukan dan pantau layanan publik seperti perizinan dan bantuan sosial.",
    href: "/citizen/service",
    terms:
      "layanan publik warga pengajuan perizinan bantuan sosial status permohonan",
  },
  {
    title: "Lapor warga",
    description:
      "Kirim laporan masalah di sekitar Anda dan pantau tindak lanjutnya.",
    href: "/reporting",
    terms:
      "lapor laporan warga pengaduan infrastruktur lingkungan jalan rusak tindak lanjut",
  },
];

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("id-ID");
}

export function searchPublicPages(query: string): PublicSearchPage[] {
  const normalizedQuery = normalizeSearchText(query.trim());
  const terms = normalizedQuery.match(/[\p{L}\p{N}]+/gu) ?? [];
  if (terms.length === 0) return [];

  return PUBLIC_SEARCH_PAGES.map((page) => {
    const title = normalizeSearchText(page.title);
    const description = normalizeSearchText(page.description);
    const searchableTerms = normalizeSearchText(page.terms);
    const titleWords = title.match(/[\p{L}\p{N}]+/gu) ?? [];
    const descriptionWords = description.match(/[\p{L}\p{N}]+/gu) ?? [];
    const searchableWords = searchableTerms.match(/[\p{L}\p{N}]+/gu) ?? [];
    const matchesTerm = (words: readonly string[], term: string) =>
      words.some((word) => word === term || word.startsWith(term));
    if (
      !terms.every(
        (term) =>
          matchesTerm(titleWords, term) ||
          matchesTerm(descriptionWords, term) ||
          matchesTerm(searchableWords, term),
      )
    ) {
      return { page, score: 0 };
    }

    const score = terms.reduce(
      (total, term) =>
        total +
        (matchesTerm(titleWords, term)
          ? 5
          : matchesTerm(descriptionWords, term)
            ? 3
            : 1),
      0,
    );
    return { page, score };
  })
    .filter(({ score }) => score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.page.title.localeCompare(right.page.title, "id-ID"),
    )
    .map(({ page }) => page);
}