export type InsightTopic = 'Layanan' | 'Anggaran' | 'Kesejahteraan';

export type InsightItem = {
  id: string;
  judul: string;
  topik: InsightTopic;
  wilayah: string;
  fokus: string;
  periode: string;
  nilai: number;
  keterangan: string;
};

export const MOCK_INSIGHTS: InsightItem[] = [
  {
    id: 'insight-1',
    judul: 'Kepuasan Warga Terhadap Layanan Kependudukan',
    topik: 'Layanan',
    wilayah: 'Provinsi Jawa Barat',
    fokus: 'Kota Bandung',
    periode: '2024',
    nilai: 84,
    keterangan: 'Persentase kepuasan warga terhadap layanan kependudukan di Kota Bandung tahun 2024.',
  },
  {
    id: 'insight-2',
    judul: 'Realisasi Anggaran Pendidikan Daerah',
    topik: 'Anggaran',
    wilayah: 'Provinsi Jawa Barat',
    fokus: 'Kota Bandung',
    periode: '2024',
    nilai: 72,
    keterangan: 'Persentase realisasi anggaran pendidikan di Kota Bandung tahun 2024.',
  },
  {
    id: 'insight-3',
    judul: 'Indeks Kesejahteraan Rakyat per Kabupaten',
    topik: 'Kesejahteraan',
    wilayah: 'Provinsi Jawa Barat',
    fokus: 'Kabupaten Bogor',
    periode: '2024',
    nilai: 68,
    keterangan: 'Indeks kesejahteraan rakyat Kabupaten Bogor tahun 2024.',
  },
  {
    id: 'insight-4',
    judul: 'Layanan Kesehatan di Puskesmas',
    topik: 'Layanan',
    wilayah: 'Provinsi Jawa Barat',
    fokus: 'Kabupaten Bogor',
    periode: '2023',
    nilai: 79,
    keterangan: 'Tingkat layanan kesehatan di puskesmas Kabupaten Bogor tahun 2023.',
  },
  {
    id: 'insight-5',
    judul: 'Alokasi Anggaran Kesejahteraan Sosial',
    topik: 'Anggaran',
    wilayah: 'Provinsi Jawa Barat',
    fokus: 'Kabupaten Bogor',
    periode: '2023',
    nilai: 61,
    keterangan: 'Persentase alokasi anggaran kesejahteraan sosial di Kabupaten Bogor tahun 2023.',
  },
  {
    id: 'insight-6',
    judul: 'Kepuasan Layanan Administrasi Kependudukan',
    topik: 'Layanan',
    wilayah: 'Provinsi Jawa Barat',
    fokus: 'Kota Bandung',
    periode: '2025',
    nilai: 88,
    keterangan: 'Persentase kepuasan layanan administrasi kependudukan di Kota Bandung tahun 2025.',
  },
];

export type InsightFilters = {
  wilayah?: string | null;
  fokus?: string | null;
  periode?: string | null;
  topik?: string | null;
};

export function filterInsights(items: InsightItem[], filters: InsightFilters): InsightItem[] {
  let result = items;

  const { wilayah, fokus, periode, topik } = filters;

  if (wilayah) {
    result = result.filter((item) => item.wilayah === wilayah || item.fokus === wilayah);
  }

  if (fokus && fokus !== 'Semua kabupaten/kota') {
    result = result.filter((item) => item.fokus === fokus);
  }

  if (periode) {
    result = result.filter((item) => item.periode === periode);
  }

  if (topik && topik !== 'Semua topik') {
    result = result.filter((item) => item.topik === topik);
  }

  return result;
}

// TODO(#75): replace with real data from /api/insight?wilayah=&fokus=&periode=&topik=
