import { getDb } from "../../src/lib/db/index.js";
import { datasetResources, datasets } from "../../src/lib/db/schema/index.js";

type DbClient = ReturnType<typeof getDb>;

// TODO(#161): replace these illustrative records with verified agency metadata.
const SEED_DATASETS = [
  {
    id: "26000000-0000-4000-8000-000000000001",
    slug: "anggaran-realisasi-apbd",
    title: "Anggaran & realisasi APBD",
    summary: "Ringkasan anggaran dan realisasi daerah menurut sektor.",
    description:
      "Dataset ilustratif berisi anggaran dan realisasi APBD per bulan dan sektor. Nilai disediakan sebagai contoh struktur data dan bukan laporan keuangan resmi.",
    category: "Ekonomi",
    sourceOrganization: "Dinas Keuangan Daerah (Simulasi)",
    sourceUrl: null,
    sourceLabel: "SIMULATED",
    licenseName: "Data simulasi untuk pratinjau",
    licenseUrl: null,
    tags: ["APBD", "anggaran", "keuangan daerah"],
    lastUpdatedAt: "2025-09-30T00:00:00.000Z",
    downloadsCount: 1480,
    dictionary: [
      {
        name: "periode",
        type: "tanggal (YYYY-MM)",
        description: "Bulan pelaporan pada 2025.",
      },
      {
        name: "sektor",
        type: "teks",
        description: "Sektor penggunaan anggaran.",
      },
      {
        name: "anggaran_rupiah",
        type: "integer",
        description: "Nilai anggaran dalam rupiah.",
      },
      {
        name: "realisasi_rupiah",
        type: "integer",
        description: "Nilai realisasi dalam rupiah.",
      },
      {
        name: "realisasi_persen",
        type: "decimal",
        description: "Persentase realisasi terhadap anggaran.",
      },
    ],
    resourceId: "27000000-0000-4000-8000-000000000001",
    resourceUrl: "/data/anggaran-realisasi-apbd.csv",
  },
  {
    id: "26000000-0000-4000-8000-000000000002",
    slug: "progres-proyek-daerah",
    title: "Progres proyek daerah",
    summary: "Perkembangan pelaksanaan proyek pembangunan daerah.",
    description:
      "Dataset ilustratif progres proyek untuk membantu memahami struktur kolom proyek daerah. Angka dan nama proyek merupakan data contoh, bukan pelaporan resmi.",
    category: "Pembangunan",
    sourceOrganization: "Bappeda (Simulasi)",
    sourceUrl: null,
    sourceLabel: "SIMULATED",
    licenseName: "Data simulasi untuk pratinjau",
    licenseUrl: null,
    tags: ["proyek", "pembangunan", "infrastruktur"],
    lastUpdatedAt: "2025-09-30T00:00:00.000Z",
    downloadsCount: 924,
    dictionary: [
      {
        name: "id_proyek",
        type: "teks",
        description: "Pengenal proyek ilustratif.",
      },
      {
        name: "nama_proyek",
        type: "teks",
        description: "Nama singkat proyek.",
      },
      {
        name: "kabupaten_kota",
        type: "teks",
        description: "Wilayah pelaksanaan proyek.",
      },
      { name: "sektor", type: "teks", description: "Sektor pembangunan." },
      {
        name: "progres_persen",
        type: "integer",
        description: "Progres fisik dalam persen.",
      },
      {
        name: "status",
        type: "teks",
        description: "Status pelaksanaan proyek.",
      },
    ],
    resourceId: "27000000-0000-4000-8000-000000000002",
    resourceUrl: "/data/progres-proyek-daerah.csv",
  },
  {
    id: "26000000-0000-4000-8000-000000000003",
    slug: "indikator-statistik-daerah",
    title: "Indikator statistik daerah",
    summary: "Indikator statistik untuk perbandingan wilayah dan tahun.",
    description:
      "Dataset ilustratif berisi indikator statistik daerah beserta nilai dan satuannya untuk tahun 2024–2025. Periksa definisi dan cakupan sebelum menggunakan atau membandingkan nilai.",
    category: "Statistik",
    sourceOrganization: "Badan Pusat Statistik (Simulasi)",
    sourceUrl: null,
    sourceLabel: "SIMULATED",
    licenseName: "Data simulasi untuk pratinjau",
    licenseUrl: null,
    tags: ["statistik", "indikator", "wilayah"],
    lastUpdatedAt: "2025-09-30T00:00:00.000Z",
    downloadsCount: 610,
    dictionary: [
      {
        name: "tahun",
        type: "integer",
        description: "Tahun pengukuran indikator.",
      },
      {
        name: "wilayah",
        type: "teks",
        description: "Cakupan wilayah pengukuran.",
      },
      {
        name: "indikator",
        type: "teks",
        description: "Nama indikator statistik.",
      },
      {
        name: "nilai",
        type: "decimal",
        description: "Nilai indikator sesuai satuannya.",
      },
      { name: "satuan", type: "teks", description: "Satuan yang digunakan." },
    ],
    resourceId: "27000000-0000-4000-8000-000000000003",
    resourceUrl: "/data/indikator-statistik-daerah.csv",
  },
] as const;

export async function seedDatasetCatalog(
  db: DbClient = getDb(),
): Promise<number> {
  for (const dataset of SEED_DATASETS) {
    const savedDatasets = await db
      .insert(datasets)
      .values({
        id: dataset.id,
        slug: dataset.slug,
        title: dataset.title,
        summary: dataset.summary,
        description: dataset.description,
        category: dataset.category,
        sourceOrganization: dataset.sourceOrganization,
        sourceUrl: dataset.sourceUrl,
        sourceLabel: dataset.sourceLabel,
        licenseName: dataset.licenseName,
        licenseUrl: dataset.licenseUrl,
        tags: [...dataset.tags],
        dataDictionary: [...dataset.dictionary],
        lastUpdatedAt: new Date(dataset.lastUpdatedAt),
        downloadsCount: dataset.downloadsCount,
      })
      .onConflictDoUpdate({
        target: datasets.slug,
        set: {
          title: dataset.title,
          summary: dataset.summary,
          description: dataset.description,
          category: dataset.category,
          sourceOrganization: dataset.sourceOrganization,
          sourceUrl: dataset.sourceUrl,
          sourceLabel: dataset.sourceLabel,
          licenseName: dataset.licenseName,
          licenseUrl: dataset.licenseUrl,
          tags: [...dataset.tags],
          dataDictionary: [...dataset.dictionary],
          lastUpdatedAt: new Date(dataset.lastUpdatedAt),
          downloadsCount: dataset.downloadsCount,
        },
      })
      .returning({ id: datasets.id });
    const savedDataset = savedDatasets[0];
    if (!savedDataset) {
      throw new Error(`Failed to seed dataset ${dataset.slug}.`);
    }

    await db
      .insert(datasetResources)
      .values({
        id: dataset.resourceId,
        datasetId: savedDataset.id,
        title: `${dataset.title} (CSV)`,
        format: "CSV",
        url: dataset.resourceUrl,
      })
      .onConflictDoUpdate({
        target: [
          datasetResources.datasetId,
          datasetResources.format,
          datasetResources.url,
        ],
        set: { title: `${dataset.title} (CSV)` },
      });
  }

  return SEED_DATASETS.length;
}
