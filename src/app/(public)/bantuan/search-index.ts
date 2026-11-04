export type HelpSearchResult = {
  title: string;
  description: string;
  href: string;
  terms: string;
};

const helpSearchIndex: HelpSearchResult[] = [
  {
    title: "Pusat bantuan",
    description: "Panduan platform publik dan CMS Ruang ASN.",
    href: "/bantuan",
    terms: "bantuan dokumentasi panduan platform publik cms ruang asn",
  },
  {
    title: "Data Pemerintah — Platform publik",
    description: "Membaca anggaran, proyek pembangunan, statistik, dan mengunduh dataset.",
    href: "/bantuan/platform-publik/data-pemerintah",
    terms: "data pemerintah ringkasan filter wilayah tahun anggaran apbd proyek pembangunan statistik daerah dataset unduhan data kosong angka berbeda",
  },
  {
    title: "Layanan Publik — Platform publik",
    description: "Mengajukan layanan, melacak status, mengelola dokumen, dan meninjau hasil.",
    href: "/bantuan/platform-publik/layanan-publik",
    terms: "layanan publik pengajuan formulir ruang warga instansi pelacakan nomor dokumen status hasil peninjauan pengaduan",
  },
  {
    title: "Lapor Warga — Platform publik",
    description: "Mengirim laporan, menjaga privasi, dan memantau tindak lanjut.",
    href: "/bantuan/platform-publik/lapor-warga",
    terms: "lapor warga kategori kronologi lokasi bukti identitas privasi kirim lacak laporan tindak lanjut hasil",
  },
  {
    title: "Insight — Platform publik",
    description: "Membandingkan indikator, memahami tren, sumber, dan metodologi.",
    href: "/bantuan/platform-publik/insight",
    terms: "insight analisis filter perbandingan ketepatan layanan tren anggaran kesejahteraan sumber metodologi grafik indikator",
  },
  {
    title: "CMS Data Pemerintah — Ruang ASN",
    description: "Mengelola dataset, metadata, APBD, proyek, statistik, verifikasi, dan publikasi.",
    href: "/bantuan/cms-ruang-asn/cms-data-pemerintah",
    terms: "cms ruang asn data pemerintah operator admin impor csv json metadata dataset anggaran apbd proyek pembangunan statistik daerah verifikasi publikasi akses ditolak",
  },
  {
    title: "CMS Layanan Publik — Ruang ASN",
    description: "Mengelola antrean pengajuan, standar layanan, dokumen, dan hasil.",
    href: "/bantuan/cms-ruang-asn/cms-layanan-publik",
    terms: "cms layanan publik antrean pengajuan standar formulir penanganan pengaduan hasil riwayat asignasi sla dokumen",
  },
  {
    title: "CMS Lapor Warga — Ruang ASN",
    description: "Memverifikasi laporan, melakukan disposisi, dan mencatat tindak lanjut.",
    href: "/bantuan/cms-ruang-asn/cms-lapor-warga",
    terms: "cms lapor warga antrean verifikasi moderasi disposisi opd tindak lanjut penutupan bukti sensitif laporan",
  },
  {
    title: "CMS Insight — Ruang ASN",
    description: "Mengelola sumber, identitas, widget data, draf, dan penerbitan Insight.",
    href: "/bantuan/cms-ruang-asn/cms-insight",
    terms: "cms insight sumber validasi analisis identitas seo widget data draf pratinjau penerbitan publikasi sumber tidak valid widget kosong slug konflik draf belum tersimpan",
  },
];

export function parseHelpQuery(query: string) {
  const parsed = query.match(/"[^"]+"|-[^\s]+|\S+/g) ?? [];
  const positive: string[] = [];
  const excluded: string[] = [];

  for (const token of parsed) {
    const isExcluded = token.startsWith("-") && token.length > 1;
    const value = (isExcluded ? token.slice(1) : token)
      .replace(/^"|"$/g, "")
      .trim();
    if (!value) continue;

    const normalized = normalize(value);
    if (isExcluded) excluded.push(normalized);
    else positive.push(normalized);
  }

  return { positive, excluded };
}

export function searchHelpArticles(query: string) {
  const { positive, excluded } = parseHelpQuery(query);
  if (positive.length === 0) return [];

  return helpSearchIndex
    .map((item) => {
      const title = normalize(item.title);
      const description = normalize(item.description);
      const terms = normalize(item.terms);
      if (excluded.some((term) => `${title} ${description} ${terms}`.includes(term))) {
        return { item, score: 0 };
      }

      const score = positive.reduce((total, term) => {
        if (title.includes(term)) return total + 5;
        if (description.includes(term)) return total + 3;
        if (terms.includes(term)) return total + 1;
        return total;
      }, 0);

      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .map(({ item }) => item);
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("id-ID");
}
