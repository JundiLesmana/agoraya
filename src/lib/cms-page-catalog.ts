import type { ModuleAccessKey } from "@/modules/rbac/module-access";

export const CMS_PAGE_CATALOG = [
  {
    id: "data-pemerintah",
    title: "CMS Data Pemerintah",
    href: "/bantuan/cms-ruang-asn/cms-data-pemerintah",
    description:
      "Kelola dataset, APBD, proyek, dan statistik daerah dengan metadata yang utuh serta pemeriksaan sebelum publikasi.",
    moduleKey: "ogd",
  },
  {
    id: "layanan-publik",
    title: "CMS Layanan Publik",
    href: "/bantuan/cms-ruang-asn/cms-layanan-publik",
    description:
      "Kelola antrean pengajuan, standar formulir, penanganan pengaduan, dan hasil layanan.",
    moduleKey: "pst",
  },
  {
    id: "lapor-warga",
    title: "CMS Lapor Warga",
    href: "/bantuan/cms-ruang-asn/cms-lapor-warga",
    description:
      "Kelola antrean laporan, verifikasi & moderasi, disposisi ke OPD, hingga penutupan laporan.",
    moduleKey: "civic_reporting",
  },
  {
    id: "insight",
    title: "CMS Insight",
    href: "/bantuan/cms-ruang-asn/cms-insight",
    description:
      "Kelola sumber & validasi analisis, identitas & SEO, widget data, draf, dan penerbitan insight.",
    moduleKey: "insight",
  },
] as const satisfies readonly {
  id: string;
  title: string;
  href: string;
  description: string;
  moduleKey: ModuleAccessKey;
}[];
