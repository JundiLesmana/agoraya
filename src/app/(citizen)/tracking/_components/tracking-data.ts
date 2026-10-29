export type TrackingStatus =
  | 'Sedang diproses'
  | 'Perlu dokumen'
  | 'Diverifikasi'
  | 'Selesai';

export type TrackingCategory = 'Pengaduan' | 'Perizinan' | 'Sosial' | 'Kesehatan';

export interface TrackingTimelineItem {
  title: string;
  description: string;
  occurredAt: string;
  completed: boolean;
}

export interface TrackingApplication {
  id: string;
  trackingNumber: string;
  serviceName: string;
  category: TrackingCategory;
  status: TrackingStatus;
  submittedAt: string;
  targetAt: string;
  deadlineAt?: string;
  currentStep: number;
  progressLabel: string;
  progressDescription: string;
  agency: string;
  team: string;
  responseEstimate: string;
  timeline: TrackingTimelineItem[];
}

const documentDeadline = '2026-10-29T17:00:00+07:00';

export const TRACKING_APPLICATIONS: readonly TrackingApplication[] = [
  {
    id: 'lampu-jalan',
    trackingNumber: 'PGD-261012-00128',
    serviceName: 'Lampu jalan padam di Jl. Melati',
    category: 'Pengaduan',
    status: 'Sedang diproses',
    submittedAt: '2026-10-12T09:15:00+07:00',
    targetAt: '2026-10-19T17:00:00+07:00',
    currentStep: 3,
    progressLabel: 'Diproses',
    progressDescription: 'Tim lapangan sedang melakukan pemeriksaan dan tindak lanjut.',
    agency: 'Dinas Perhubungan (View)',
    team: 'Tim PJU 02',
    responseEstimate: '1 hari kerja',
    timeline: [
      {
        title: 'Pengajuan diterima',
        description: 'Laporan lampu jalan tercatat. Nomor pelacakan diterbitkan.',
        occurredAt: '2026-10-12T09:15:00+07:00',
        completed: true,
      },
      {
        title: 'Verifikasi selesai',
        description: 'Lokasi dan informasi laporan diverifikasi oleh Dinas Perhubungan.',
        occurredAt: '2026-10-13T11:00:00+07:00',
        completed: true,
      },
      {
        title: 'Tim lapangan ditugaskan',
        description: 'Tim PJU 02 ditugaskan untuk pemeriksaan dan tindak lanjut.',
        occurredAt: '2026-10-14T14:20:00+07:00',
        completed: true,
      },
      {
        title: 'Perbaikan dijadwalkan',
        description: 'Pemeriksaan awal selesai. Target selesai 19 Okt 2026.',
        occurredAt: '2026-10-15T10:30:00+07:00',
        completed: false,
      },
    ],
  },
  {
    id: 'izin-mikro',
    trackingNumber: 'ZN-261011-00084',
    serviceName: 'Perizinan usaha mikro',
    category: 'Perizinan',
    status: 'Perlu dokumen',
    submittedAt: '2026-10-11T10:00:00+07:00',
    targetAt: '2026-10-30T17:00:00+07:00',
    deadlineAt: documentDeadline,
    currentStep: 2,
    progressLabel: 'Menunggu kelengkapan',
    progressDescription: 'Unggah salinan bukti lokasi agar verifikasi dapat dilanjutkan.',
    agency: 'Dinas Penanaman Modal dan PTSP',
    team: 'Tim Perizinan Usaha',
    responseEstimate: '2 hari kerja',
    timeline: [
      {
        title: 'Pengajuan diterima',
        description: 'Permohonan perizinan tercatat dan masuk antrean.',
        occurredAt: '2026-10-11T10:00:00+07:00',
        completed: true,
      },
      {
        title: 'Pemeriksaan dokumen',
        description: 'Petugas meminta bukti lokasi untuk melengkapi permohonan.',
        occurredAt: '2026-10-12T13:40:00+07:00',
        completed: false,
      },
    ],
  },
  {
    id: 'bantuan-pendidikan',
    trackingNumber: 'BSL-261010-00051',
    serviceName: 'Pengajuan pendidikan',
    category: 'Sosial',
    status: 'Diverifikasi',
    submittedAt: '2026-10-10T08:30:00+07:00',
    targetAt: '2026-10-22T17:00:00+07:00',
    currentStep: 3,
    progressLabel: 'Diverifikasi',
    progressDescription: 'Data pengajuan telah diverifikasi dan menunggu keputusan.',
    agency: 'Dinas Sosial',
    team: 'Tim Pendidikan',
    responseEstimate: '3 hari kerja',
    timeline: [
      {
        title: 'Pengajuan diterima',
        description: 'Permohonan masuk ke sistem untuk diperiksa.',
        occurredAt: '2026-10-10T08:30:00+07:00',
        completed: true,
      },
      {
        title: 'Dokumen diverifikasi',
        description: 'Pemeriksaan kelengkapan dokumen selesai.',
        occurredAt: '2026-10-12T14:00:00+07:00',
        completed: true,
      },
      {
        title: 'Menunggu keputusan',
        description: 'Instansi sedang meninjau hasil verifikasi.',
        occurredAt: '2026-10-13T09:00:00+07:00',
        completed: false,
      },
    ],
  },
  {
    id: 'rambu-rusak',
    trackingNumber: 'PGD-261008-00035',
    serviceName: 'Rambu lalu lintas rusak',
    category: 'Pengaduan',
    status: 'Selesai',
    submittedAt: '2026-10-08T15:45:00+07:00',
    targetAt: '2026-10-20T17:00:00+07:00',
    currentStep: 4,
    progressLabel: 'Selesai',
    progressDescription: 'Penanganan selesai. Terima kasih telah membantu menjaga keselamatan.',
    agency: 'Dinas Perhubungan (View)',
    team: 'Tim Perlengkapan Jalan',
    responseEstimate: '1 hari kerja',
    timeline: [
      {
        title: 'Pengajuan diterima',
        description: 'Laporan kerusakan rambu tercatat.',
        occurredAt: '2026-10-08T15:45:00+07:00',
        completed: true,
      },
      {
        title: 'Lokasi diverifikasi',
        description: 'Petugas memastikan lokasi dan kondisi rambu.',
        occurredAt: '2026-10-09T10:10:00+07:00',
        completed: true,
      },
      {
        title: 'Perbaikan dilakukan',
        description: 'Tim teknis memperbaiki rambu lalu lintas.',
        occurredAt: '2026-10-11T13:00:00+07:00',
        completed: true,
      },
      {
        title: 'Pengajuan selesai',
        description: 'Hasil penanganan telah dikonfirmasi oleh instansi.',
        occurredAt: '2026-10-12T16:30:00+07:00',
        completed: true,
      },
    ],
  },
];

export const TRACKING_NUMBER_PATTERN = /^[A-Z]{2,3}-\d{6}-\d{5}$/;
