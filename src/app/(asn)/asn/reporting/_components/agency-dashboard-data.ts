export type AgencyApplicationStatus =
  "Diterima" | "Diproses" | "Perlu Dokumen" | "Selesai";
export type NoteVisibility = "internal" | "public";

export interface AgencyHistoryEntry {
  status: AgencyApplicationStatus;
  description: string;
  occurredAt: string;
  actor: string;
  note?: string;
  visibility?: NoteVisibility;
}

export interface AgencyDocument {
  name: string;
  uploadedAt: string;
  status: "Terverifikasi" | "Menunggu pemeriksaan";
}

export interface AgencyApplication {
  id: string;
  trackingNumber: string;
  serviceName: string;
  category: string;
  applicantName: string;
  nik: string;
  phone: string;
  address: string;
  submittedAt: string;
  targetAt: string;
  status: AgencyApplicationStatus;
  agency: string;
  assignedTeam: string;
  documents: AgencyDocument[];
  history: AgencyHistoryEntry[];
}

const AGENCY = "Dinas Perhubungan Kota Contoh";

export const AGENCY_APPLICATIONS: readonly AgencyApplication[] = [
  {
    id: "lampu-jalan",
    trackingNumber: "PGD-261027-00128",
    serviceName: "Lampu jalan padam di Jl. Melati",
    category: "Pengaduan fasilitas umum",
    applicantName: "Warga Simulasi A",
    nik: "0000000000001001",
    phone: "080000000101",
    address: "Jl. Melati No. 12, Kecamatan Contoh",
    submittedAt: "2026-10-27T08:15:00+07:00",
    targetAt: "2026-10-29T17:00:00+07:00",
    status: "Diproses",
    agency: AGENCY,
    assignedTeam: "Tim PJU 02",
    documents: [
      {
        name: "Foto lokasi dan titik lampu.jpg",
        uploadedAt: "2026-10-27T08:16:00+07:00",
        status: "Terverifikasi",
      },
      {
        name: "Bukti kondisi lampu.jpg",
        uploadedAt: "2026-10-27T08:16:00+07:00",
        status: "Menunggu pemeriksaan",
      },
    ],
    history: [
      {
        status: "Diterima",
        description: "Pengajuan masuk dan nomor pelacakan diterbitkan.",
        occurredAt: "2026-10-27T08:15:00+07:00",
        actor: "Sistem simulasi",
      },
      {
        status: "Diproses",
        description: "Pengajuan diverifikasi dan diteruskan ke tim lapangan.",
        occurredAt: "2026-10-27T10:30:00+07:00",
        actor: "Petugas Dinas Perhubungan",
      },
    ],
  },
  {
    id: "rambu-rusak",
    trackingNumber: "PGD-261026-00035",
    serviceName: "Rambu lalu lintas rusak",
    category: "Pengaduan fasilitas umum",
    applicantName: "Budi Contoh",
    nik: "0000000000001002",
    phone: "080000000102",
    address: "Jl. Kenanga No. 8, Kecamatan Contoh",
    submittedAt: "2026-10-26T15:45:00+07:00",
    targetAt: "2026-10-28T17:00:00+07:00",
    status: "Diterima",
    agency: AGENCY,
    assignedTeam: "Belum ditugaskan",
    documents: [
      {
        name: "Foto rambu rusak.jpg",
        uploadedAt: "2026-10-26T15:46:00+07:00",
        status: "Menunggu pemeriksaan",
      },
    ],
    history: [
      {
        status: "Diterima",
        description: "Pengajuan masuk dan menunggu pemeriksaan petugas.",
        occurredAt: "2026-10-26T15:45:00+07:00",
        actor: "Sistem simulasi",
      },
    ],
  },
  {
    id: "halte",
    trackingNumber: "PGD-261026-00032",
    serviceName: "Permintaan perbaikan halte",
    category: "Pengaduan fasilitas umum",
    applicantName: "Siti Contoh",
    nik: "0000000000001003",
    phone: "080000000103",
    address: "Jl. Merdeka, Kecamatan Contoh",
    submittedAt: "2026-10-26T11:20:00+07:00",
    targetAt: "2026-10-31T17:00:00+07:00",
    status: "Perlu Dokumen",
    agency: AGENCY,
    assignedTeam: "Tim Sarana Jalan",
    documents: [
      {
        name: "Foto halte.jpg",
        uploadedAt: "2026-10-26T11:22:00+07:00",
        status: "Terverifikasi",
      },
    ],
    history: [
      {
        status: "Diterima",
        description: "Pengajuan masuk dan menunggu pemeriksaan petugas.",
        occurredAt: "2026-10-26T11:20:00+07:00",
        actor: "Sistem simulasi",
      },
      {
        status: "Perlu Dokumen",
        description:
          "Petugas meminta foto lokasi yang memperlihatkan kondisi halte secara menyeluruh.",
        occurredAt: "2026-10-27T09:05:00+07:00",
        actor: "Petugas Dinas Perhubungan",
        note: "Mohon unggah foto halte dari sisi depan.",
        visibility: "public",
      },
    ],
  },
  {
    id: "marka-jalan",
    trackingNumber: "PGD-261025-00019",
    serviceName: "Marka jalan perlu diperbarui",
    category: "Pengaduan fasilitas umum",
    applicantName: "Andi Contoh",
    nik: "0000000000001004",
    phone: "080000000104",
    address: "Jl. Anggrek No. 4, Kecamatan Contoh",
    submittedAt: "2026-10-25T09:10:00+07:00",
    targetAt: "2026-11-02T17:00:00+07:00",
    status: "Diproses",
    agency: AGENCY,
    assignedTeam: "Tim Marka Jalan",
    documents: [
      {
        name: "Foto marka jalan.jpg",
        uploadedAt: "2026-10-25T09:11:00+07:00",
        status: "Terverifikasi",
      },
    ],
    history: [
      {
        status: "Diterima",
        description: "Pengajuan masuk dan nomor pelacakan diterbitkan.",
        occurredAt: "2026-10-25T09:10:00+07:00",
        actor: "Sistem simulasi",
      },
      {
        status: "Diproses",
        description: "Tim marka jalan telah ditugaskan untuk pemeriksaan.",
        occurredAt: "2026-10-26T13:00:00+07:00",
        actor: "Petugas Dinas Perhubungan",
      },
    ],
  },
  {
    id: "zebra-cross",
    trackingNumber: "PGD-261022-00011",
    serviceName: "Permohonan zebra cross",
    category: "Permohonan fasilitas",
    applicantName: "Dewi Contoh",
    nik: "0000000000001005",
    phone: "080000000105",
    address: "Jl. Pahlawan No. 20, Kecamatan Contoh",
    submittedAt: "2026-10-22T14:00:00+07:00",
    targetAt: "2026-10-29T17:00:00+07:00",
    status: "Selesai",
    agency: AGENCY,
    assignedTeam: "Tim Rekayasa Lalu Lintas",
    documents: [
      {
        name: "Surat permohonan warga.pdf",
        uploadedAt: "2026-10-22T14:02:00+07:00",
        status: "Terverifikasi",
      },
    ],
    history: [
      {
        status: "Diterima",
        description: "Pengajuan masuk dan nomor pelacakan diterbitkan.",
        occurredAt: "2026-10-22T14:00:00+07:00",
        actor: "Sistem simulasi",
      },
      {
        status: "Diproses",
        description: "Lokasi telah ditinjau oleh tim rekayasa lalu lintas.",
        occurredAt: "2026-10-23T10:00:00+07:00",
        actor: "Petugas Dinas Perhubungan",
      },
      {
        status: "Selesai",
        description: "Permohonan selesai ditindaklanjuti.",
        occurredAt: "2026-10-25T16:15:00+07:00",
        actor: "Petugas Dinas Perhubungan",
        note: "Hasil peninjauan lokasi telah disampaikan.",
        visibility: "public",
      },
    ],
  },
];

export const AGENCY_NAME = AGENCY;

export function maskNik(nik: string): string {
  if (nik.length <= 4) return "•".repeat(nik.length);
  return `${"•".repeat(nik.length - 4)}${nik.slice(-4)}`;
}

export function maskPhone(phone: string): string {
  if (phone.length <= 4) return "•".repeat(phone.length);
  return `${"•".repeat(phone.length - 4)}${phone.slice(-4)}`;
}

export function maskApplicantName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return `${parts[0].slice(0, 1)}***`;
  return [parts[0], ...parts.slice(1).map((part) => `${part.slice(0, 1)}***`)].join(" ");
}
