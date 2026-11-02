export type HealthServiceType =
  | "KonsultasiInformasi"
  | "PermohonanLayananPuskesmas"
  | "AduanFasilitasKesehatan";

type HealthApplicationBase = {
  category: "health";
  data: {
    namaPemohon: string;
    kontakNotifikasi: string;
    kecamatan: string;
    kelurahan: string;
    judulPengajuan: string;
    uraian: string;
  };
};

export type HealthApplicationPayload =
  | (HealthApplicationBase & {
      serviceType: "KonsultasiInformasi";
      serviceId: "konsultasi-informasi";
      data: HealthApplicationBase["data"] & {
        topikKonsultasi: string;
        puskesmasTujuan: string;
      };
    })
  | (HealthApplicationBase & {
      serviceType: "PermohonanLayananPuskesmas";
      serviceId: "permohonan-layanan-puskesmas";
      data: HealthApplicationBase["data"] & {
        jenisLayanan: string;
        namaPasien: string;
        tanggalPilihan: string;
        puskesmasTujuan: string;
      };
    })
  | (HealthApplicationBase & {
      serviceType: "AduanFasilitasKesehatan";
      serviceId: "aduan-fasilitas-kesehatan";
      data: HealthApplicationBase["data"] & {
        namaFasilitas: string;
        lokasiFasilitas: string;
        kategoriAduan: string;
      };
    });

export type HealthApplicationPayloadByServiceType<T extends HealthServiceType> =
  Extract<HealthApplicationPayload, { serviceType: T }>;

export type HealthServiceOption = {
  id: HealthApplicationPayload["serviceId"];
  name: string;
  description: string;
  type: HealthServiceType;
  attachmentGuidance: string;
};

export const HEALTH_SERVICES: readonly HealthServiceOption[] = [
  {
    id: "konsultasi-informasi",
    name: "Konsultasi & informasi layanan",
    description:
      "Tanyakan alur, jadwal, dan informasi layanan kesehatan pemerintah.",
    type: "KonsultasiInformasi",
    attachmentGuidance: "Lampirkan dokumen pendukung bila diperlukan.",
  },
  {
    id: "permohonan-layanan-puskesmas",
    name: "Permohonan layanan Puskesmas",
    description:
      "Ajukan permohonan jadwal atau layanan administrasi Puskesmas.",
    type: "PermohonanLayananPuskesmas",
    attachmentGuidance:
      "Siapkan identitas pemohon dan dokumen pendukung permohonan.",
  },
  {
    id: "aduan-fasilitas-kesehatan",
    name: "Aduan fasilitas kesehatan",
    description:
      "Sampaikan kendala fasilitas atau pelayanan di Puskesmas dan fasilitas daerah.",
    type: "AduanFasilitasKesehatan",
    attachmentGuidance:
      "Foto atau dokumen pendukung boleh dilampirkan bila tersedia.",
  },
];
