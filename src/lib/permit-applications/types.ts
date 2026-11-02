export type PermitServiceType =
  "NibUsahaMikro" | "IzinKegiatan" | "PerizinanLainnya";

type PermitApplicationBase = {
  category: "permit";
  data: {
    namaPemohon: string;
    kontakNotifikasi: string;
    kecamatan: string;
    kelurahan: string;
    judulPermohonan: string;
    uraian: string;
  };
};

export type PermitApplicationPayload =
  | (PermitApplicationBase & {
      serviceType: "NibUsahaMikro";
      serviceId: "nib-usaha-mikro";
      data: PermitApplicationBase["data"] & {
        namaUsaha: string;
        bidangUsaha: string;
        alamatUsaha: string;
        statusKepemilikanTempat: string;
      };
    })
  | (PermitApplicationBase & {
      serviceType: "IzinKegiatan";
      serviceId: "izin-kegiatan";
      data: PermitApplicationBase["data"] & {
        namaKegiatan: string;
        jenisKegiatan: string;
        tanggalKegiatan: string;
        lokasiKegiatan: string;
      };
    })
  | (PermitApplicationBase & {
      serviceType: "PerizinanLainnya";
      serviceId: "perizinan-lainnya";
      data: PermitApplicationBase["data"] & {
        jenisIzin: string;
        namaUsaha: string;
        alamatUsaha: string;
        tujuanIzin: string;
      };
    });

export type PermitApplicationPayloadByServiceType<T extends PermitServiceType> =
  Extract<PermitApplicationPayload, { serviceType: T }>;

export type PermitServiceOption = {
  id: PermitApplicationPayload["serviceId"];
  name: string;
  description: string;
  type: PermitServiceType;
  requiredDocuments: readonly string[];
};

export const PERMIT_SERVICES: readonly PermitServiceOption[] = [
  {
    id: "nib-usaha-mikro",
    name: "NIB / usaha mikro",
    description: "Pendampingan pendaftaran usaha melalui OSS.",
    type: "NibUsahaMikro",
    requiredDocuments: ["KTP pemohon", "Dokumen alamat usaha"],
  },
  {
    id: "izin-kegiatan",
    name: "Izin kegiatan",
    description: "Permohonan kegiatan di lingkungan warga.",
    type: "IzinKegiatan",
    requiredDocuments: ["KTP pemohon", "Surat pengantar kegiatan"],
  },
  {
    id: "perizinan-lainnya",
    name: "Perizinan lainnya",
    description: "Konsultasikan kebutuhan izin Anda.",
    type: "PerizinanLainnya",
    requiredDocuments: ["KTP pemohon", "Dokumen pendukung sesuai jenis izin"],
  },
];
