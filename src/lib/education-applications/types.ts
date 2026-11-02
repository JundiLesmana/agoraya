export type EducationServiceType =
  | "BantuanBiaya"
  | "AdministrasiSiswa"
  | "KonsultasiPendidikan";

export type EducationApplicationPayload =
  | {
      category: "education";
      serviceType: "BantuanBiaya";
      serviceId: "bantuan-biaya";
      data: {
        namaPemohon: string;
        kontakNotifikasi: string;
        kecamatan: string;
        kelurahan: string;
        judulPengajuan: string;
        detailKebutuhan: string;
        jenjang: string;
        kelas: string;
      };
    }
  | {
      category: "education";
      serviceType: "AdministrasiSiswa";
      serviceId: "administrasi-siswa";
      data: {
        namaPemohon: string;
        kontakNotifikasi: string;
        kecamatan: string;
        kelurahan: string;
        judulPengajuan: string;
        namaSiswa: string;
        hubungan: string;
        namaSekolah: string;
        jenjangKelas: string;
        detailKebutuhan: string;
      };
    }
  | {
      category: "education";
      serviceType: "KonsultasiPendidikan";
      serviceId: "konsultasi-pendidikan";
      data: {
        namaPemohon: string;
        kontakNotifikasi: string;
        kecamatan: string;
        kelurahan: string;
        judulPengajuan: string;
        namaSiswa: string;
        hubungan: string;
        namaSekolah: string;
        jenjangKelas: string;
        detailKebutuhan: string;
      };
    };

export type EducationApplicationServiceKey =
  | "education:bantuan-biaya"
  | "education:administrasi-siswa"
  | "education:konsultasi-pendidikan";
