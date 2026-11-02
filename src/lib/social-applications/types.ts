export type SocialServiceType =
  | "KebutuhanDasar"
  | "DukunganKeluarga"
  | "BantuanDarurat";

type SocialApplicationBase = {
  category: "social";
  data: {
    namaPemohon: string;
    kontakNotifikasi: string;
    nik: string;
    kecamatan: string;
    kelurahan: string;
    judulPengajuan: string;
    detailKebutuhan: string;
  };
};

export type SocialApplicationPayload =
  | (SocialApplicationBase & {
      serviceType: "KebutuhanDasar";
      serviceId: "kebutuhan-dasar";
      data: SocialApplicationBase["data"] & {
        jenisKebutuhan: string;
        jumlahAnggotaKeluarga: string;
      };
    })
  | (SocialApplicationBase & {
      serviceType: "DukunganKeluarga";
      serviceId: "dukungan-keluarga";
      data: SocialApplicationBase["data"] & {
        jenisDukungan: string;
        hubunganPemohon: string;
      };
    })
  | (SocialApplicationBase & {
      serviceType: "BantuanDarurat";
      serviceId: "bantuan-darurat";
      data: SocialApplicationBase["data"] & {
        jenisDarurat: string;
        lokasiKejadian: string;
        tanggalKejadian: string;
      };
    });

export type SocialApplicationPayloadByServiceType<
  T extends SocialServiceType,
> = Extract<SocialApplicationPayload, { serviceType: T }>;

export type SocialServiceOption = {
  id: SocialApplicationPayload["serviceId"];
  name: string;
  description: string;
  type: SocialServiceType;
};

export const SOCIAL_SERVICES: readonly SocialServiceOption[] = [
  {
    id: "kebutuhan-dasar",
    name: "Kebutuhan dasar",
    description: "Usulan dukungan pangan dan kebutuhan harian.",
    type: "KebutuhanDasar",
  },
  {
    id: "dukungan-keluarga",
    name: "Dukungan keluarga",
    description: "Pendampingan keluarga dalam kondisi rentan.",
    type: "DukunganKeluarga",
  },
  {
    id: "bantuan-darurat",
    name: "Bantuan darurat",
    description: "Dukungan awal akibat musibah atau bencana.",
    type: "BantuanDarurat",
  },
];
