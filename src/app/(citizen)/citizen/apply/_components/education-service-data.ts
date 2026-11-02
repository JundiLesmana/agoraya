export type EducationServiceType =
  "BantuanBiaya" | "AdministrasiSiswa" | "KonsultasiPendidikan";

export interface EducationServiceOption {
  id: string;
  name: string;
  description: string;
  type: EducationServiceType;
}

export interface EducationServiceCategory {
  id: string;
  name: string;
  slug: string;
  subCategories: readonly EducationServiceOption[];
  defaultAgency: string;
  disclaimer: string;
  infoBox: string;
  helpCenterUrl: string;
  helpCenterHours: string;
}

export const EDUCATION_SERVICE_CATEGORY: EducationServiceCategory = {
  id: "education",
  name: "Layanan Pendidikan",
  slug: "education",
  defaultAgency: "Dinas Pendidikan",
  disclaimer:
    "Pengajuan akan diverifikasi bersama sekolah; bukan pendaftaran siswa baru atau jaminan penerimaan bantuan.",
  infoBox:
    "Dinas Pendidikan memeriksa data siswa dan tindak lanjut disepakati bersama layanan yang tersedia.",
  helpCenterUrl: "/citizen/reporting#report-faq-title",
  helpCenterHours: "Hari kerja, 08.00–16.00",
  subCategories: [
    {
      id: "bantuan-biaya",
      name: "Bantuan biaya",
      description: "Usulan dukungan biaya dan perlengkapan belajar.",
      type: "BantuanBiaya",
    },
    {
      id: "administrasi-siswa",
      name: "Administrasi siswa",
      description: "Panduan mutasi dan dokumen pendidikan.",
      type: "AdministrasiSiswa",
    },
    {
      id: "konsultasi-pendidikan",
      name: "Konsultasi pendidikan",
      description: "Informasi akses dan layanan sekolah.",
      type: "KonsultasiPendidikan",
    },
  ],
};

export function getEducationServiceOptionById(
  id: string,
): EducationServiceOption | undefined {
  return EDUCATION_SERVICE_CATEGORY.subCategories.find(
    (option) => option.id === id,
  );
}
