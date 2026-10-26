<div align="center">
  <img src="public/logo/logo-dark.svg" alt="Logo Agoraya" width="220" />
  
  <p><strong>Transparansi data publik. Partisipasi warga. Tata kelola digital.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15" />
    <img src="https://img.shields.io/badge/React-19-149eca?logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript" alt="TypeScript 5" />
    <img src="https://img.shields.io/badge/Database-PostgreSQL-4169e1?logo=postgresql" alt="PostgreSQL" />
  </p>
</div>

Agoraya adalah gagasan platform digital untuk mempertemukan informasi pemerintahan, partisipasi warga, dan dukungan pengambilan keputusan dalam satu pengalaman yang mudah diakses. Platform ini dirancang agar data publik lebih mudah dipahami, aspirasi warga lebih mudah ditelusuri, dan pengelolaan informasi dapat mendukung tata kelola yang akuntabel.

## Tim Pengembang

Agoraya merupakan karya inovasi teknologi oleh **Gugu Gaga Team**.

| Nama                            | Peran      | Institusi               | Program Studi       |
| ------------------------------- | ---------- | ----------------------- | ------------------- |
| **Jundulloh Rizki Ananda**      | Ketua Tim  | Universitas Pamulang    | Teknik Informatika  |
| **Abdullah Jiddan Al Khairi**   | Anggota I  | Universitas Pamulang    | Sistem Informasi    |
| **Muhammad Alif Miftah Faridh** | Anggota II | Bina Sarana Informatika | Teknologi Informasi |

<p>
  Cabang Kompetisi <strong>Web In Action (WIA) — Multimedia In Action (MIA) 2026</strong><br />
  Diselenggarakan oleh <strong>KSM Multimedia UPN Veteran Jakarta</strong><br />
  Tema Kompetisi: <em>Designing Digital Futures – Powering Public Transparency</em>
</p>

## Daftar Isi

- [Tim Pengembang](#tim-pengembang)
- [Tujuan](#tujuan)
- [Latar Belakang](#latar-belakang)
- [Permasalahan](#permasalahan)
- [Perbandingan Platform](#perbandingan-platform)
- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Arsitektur](#arsitektur)
- [Menjalankan Secara Lokal](#menjalankan-secara-lokal)
- [Perintah Pengembangan dan Pengujian](#perintah-pengembangan-dan-pengujian)
- [Struktur Proyek](#struktur-proyek)
- [Kontribusi dan Dokumentasi](#kontribusi-dan-dokumentasi)
- [Lisensi](#lisensi)

## Tujuan

Agoraya bertujuan untuk:

1. **Memperluas akses informasi publik** melalui penyajian data pemerintahan yang terstruktur, kontekstual, dan mudah dipahami masyarakat.
2. **Mendorong partisipasi warga** dengan menyediakan alur untuk menyampaikan laporan serta mengikuti proses tindak lanjutnya.
3. **Mendukung akuntabilitas layanan** melalui informasi status, target waktu, dan jejak proses yang dapat dipantau.
4. **Membantu pengelola dan pengambil keputusan** membaca data, mengenali prioritas, dan mengevaluasi program secara lebih terarah.
5. **Menghubungkan ekosistem informasi publik** tanpa menggantikan kewenangan, kanal resmi, atau sistem milik instansi pemerintah.

## Latar Belakang

Informasi pemerintahan, kanal pengaduan, layanan publik, dan data kinerja umumnya tersedia melalui sumber serta sistem yang berbeda. Masyarakat perlu berpindah kanal untuk mencari data, memahami konteks anggaran atau program, menyampaikan masalah, lalu mencari tahu apakah laporan tersebut telah ditangani.

Di sisi pemerintah, data yang tersebar dapat menyulitkan penyusunan gambaran lintas layanan dan pemantauan tindak lanjut. Agoraya dirancang sebagai lapisan akses dan koordinasi yang menyajikan informasi publik secara lebih terpadu, sambil tetap merujuk pada sumber resmi dan mekanisme instansi terkait.

## Permasalahan

- **Informasi tersebar:** statistik, anggaran, proyek, dan layanan memiliki portal serta format penyajian yang berbeda-beda.
- **Data sulit dipahami:** dokumen dan tabel publik tidak selalu disertai ringkasan, visualisasi, atau konteks yang membantu warga menafsirkan isinya.
- **Keterputusan antara data dan partisipasi:** informasi program atau proyek tidak selalu mudah ditautkan dengan laporan dan kebutuhan warga.
- **Transparansi tindak lanjut terbatas:** pelapor membutuhkan cara yang jelas untuk mengetahui status, proses, dan hasil penanganan.
- **Pemantauan lintas layanan menantang:** pengelola memerlukan ringkasan dan analitik yang membantu membaca tren serta prioritas, dengan tetap memperhatikan kualitas dan perlindungan data.

## Perbandingan Platform

Agoraya diposisikan sebagai pelengkap yang menyatukan akses informasi, partisipasi, dan dukungan analitik—bukan pengganti platform resmi yang sudah memiliki mandat dan proses sendiri.

| Platform / pendekatan                                                      | Fokus utama                                                                                           | Posisi Agoraya                                                                                                                                                                 |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [SP4N-LAPOR!](https://www.lapor.go.id/)                                    | Kanal pengaduan dan aspirasi masyarakat yang diteruskan kepada instansi berwenang.                    | Melengkapi ekosistem partisipasi dengan konteks data publik, program, dan analitik dalam satu pengalaman. Pengaduan resmi tetap mengikuti kanal dan prosedur instansi terkait. |
| [Portal Satu Data Indonesia](https://data.go.id/) dan portal data sektoral | Publikasi dan penemuan dataset pemerintah dari berbagai produsen data.                                | Mengolah dan menyajikan informasi terpilih melalui dashboard serta menghubungkannya dengan pengalaman layanan dan partisipasi warga.                                           |
| [Badan Pusat Statistik](https://www.bps.go.id/)                            | Penyediaan statistik resmi dan indikator sosial-ekonomi.                                              | Menjadi rujukan data statistik ketika sesuai; Agoraya berperan pada lapisan penyajian dan konteks, bukan sebagai produsen atau pengganti statistik resmi.                      |
| Portal layanan dan pengaduan instansi                                      | Informasi, formulir, serta proses layanan sesuai mandat masing-masing instansi.                       | Mengarah pada pengalaman lintas area yang lebih konsisten, dengan tetap menghormati proses dan sumber resmi tiap instansi.                                                     |
| **Agoraya**                                                                | Transparansi informasi publik, partisipasi warga, pemantauan tindak lanjut, dan insight pemerintahan. | Mengintegrasikan perspektif data, warga, pengelola, dan pengambil keputusan sebagai satu platform digital.                                                                     |

Perbandingan ini menjelaskan perbedaan fokus, bukan penilaian kualitas atau kelengkapan layanan. Agoraya tetap perlu merujuk pada kanal dan data resmi yang berlaku untuk setiap layanan.

## Fitur Utama

Fitur berikut menggambarkan cakupan kapabilitas yang dirancang untuk Agoraya.

### Public Dashboard & Open Data

- **Landing Page** — Visualisasi data agregat publik, termasuk data statistik pemerintah.
- **Statistik Daerah** — Peta dan grafik indikator sosial, anggaran, serta infrastruktur per wilayah.
- **Open Government Data** — Dataset terbuka dengan filter, pencarian, dan unduhan.
- **Leaderboard Instansi** — Gambaran kinerja penanganan laporan dengan mempertimbangkan tingkat kesulitan.

### Civic Reporting & Accountability

- **Lapor Warga** — Pelaporan masalah dengan foto atau dokumen, geotag, dan kategori.
- **Tracking Laporan** — Pemantauan status laporan dan perkiraan waktu penanganan.
- **Skor Urgensi Otomatis** — Penggabungan dukungan warga, klasifikasi AI, kedekatan lokasi, dan dampak.
- **Eskalasi SLA** — Alur eskalasi dari penanganan hingga pemantauan keterlambatan secara publik.
- **Visualisasi Bencana** — Peta kejadian seperti kebakaran dan banjir berdasarkan urgensi.

### CMS & Pendataan (Maker-Checker)

- **CMS Civic Reporting** — Pengelolaan dan peninjauan laporan warga.
- **CMS Open Government Data** — Pengelolaan dataset publik.
- **CMS Data-Driven Insight** — Pengelolaan analitik dan insight.
- **CMS Public Service Tracking** — Pengelolaan informasi pelacakan layanan publik.

### Data-Driven Insight

- **Anggaran** — Visualisasi anggaran melalui peta dan grafik.
- **Proyek** — Dukungan prioritisasi proyek pemerintah menggunakan Decision Engine.
- **Insight Dashboard** — Analisis tren, anomali, dan rekomendasi berbasis data.

### Layanan Publik Digital

- **Pengajuan & Perizinan Online** — Formulir daring dengan pemantauan status.
- **Download Surat** — Akses mandiri terhadap surat yang telah selesai diproses.
- **Public Service Tracking** — Pemantauan progres layanan oleh warga dan instansi.

### Gamification & Civic Rewards

- **Poin Individu** — Apresiasi atas partisipasi warga.
- **Kredit Sipil RT/Kelurahan** — Poin kolektif untuk mendukung proyek komunitas.

### AI & Chatbot

- **Chatbot Bantuan** — Jawaban berbasis dataset dan arahan layanan.
- **Escalate ke Operator** — Pengalihan pertanyaan kompleks kepada petugas.
- **AI Classification** — Klasifikasi dan ekstraksi informasi dari laporan.

### Command Center

- **Dashboard Monitoring** — Ringkasan laporan aktif dan waktu penyelesaian.
- **Indikator Status** — Visualisasi status layanan berdasarkan target SLA.
- **Prioritas Urgensi** — Pemeringkatan laporan dengan mempertimbangkan dukungan warga dan tingkat urgensi.

### Identity & Auth

- **NIK sebagai Username** — Identitas untuk proses autentikasi warga dan verifikasi sesuai kebutuhan layanan.
- **Manual KYC** — Verifikasi identitas manual untuk mendukung validitas data.
- **RBAC + ABAC** — Pengaturan akses berdasarkan peran, instansi, jabatan, dan wilayah.

## Tech Stack

### Core

| Teknologi                   | Fungsi                               |
| --------------------------- | ------------------------------------ |
| **Next.js 15** (App Router) | Framework aplikasi web full-stack    |
| **TypeScript** (strict)     | Type safety                          |
| **React 19**                | UI library                           |
| **Tailwind CSS 4**          | Utility-first CSS                    |
| **shadcn/ui + Radix**       | Pola dan primitif komponen antarmuka |

### Data & Backend

| Teknologi             | Fungsi                           |
| --------------------- | -------------------------------- |
| **PostgreSQL** (Neon) | Basis data relasional            |
| **Drizzle ORM**       | ORM type-safe dan migrasi        |
| **Zod**               | Validasi skema dan input         |
| **BPS API**           | Sumber data statistik pemerintah |

### Infrastruktur

| Teknologi      | Fungsi                                           |
| -------------- | ------------------------------------------------ |
| **Vercel**     | Platform deployment                              |
| **Cloudinary** | Pengelolaan media dan CDN                        |
| **Brevo**      | Email transaksional, termasuk OTP dan notifikasi |

### Visualisasi

| Teknologi                 | Fungsi                              |
| ------------------------- | ----------------------------------- |
| **Recharts**              | Grafik dan visualisasi data         |
| **MapLibre GL + GeoJSON** | Peta interaktif dan data geospasial |

### Testing & CI

| Teknologi          | Fungsi                       |
| ------------------ | ---------------------------- |
| **Vitest**         | Pengujian unit dan integrasi |
| **Playwright**     | Pengujian end-to-end         |
| **k6**             | Pengujian beban dan performa |
| **GitHub Actions** | Otomatisasi pemeriksaan CI   |

Teknologi integrasi dan layanan eksternal memerlukan konfigurasi serta kredensial yang sesuai. Daftar ini menjelaskan stack yang digunakan atau direncanakan dalam rancangan Agoraya; penyebutan suatu teknologi tidak menyatakan bahwa setiap integrasi sudah terhubung ke seluruh alur produk.

## Arsitektur

Agoraya menggunakan pendekatan modular monolith: antarmuka, API, dan modul domain berada dalam satu codebase dengan batas tanggung jawab per area fitur.

```text
Browser
  └─ Next.js App Router (halaman per area pengguna dan API routes)
       ├─ components/       UI bersama
       ├─ lib/              konfigurasi, database, validasi, utilitas
       └─ modules/          domain dan layanan per fitur
            ├─ identity / kyc / rbac
            ├─ reporting / cms
            ├─ analytics / audit
            ├─ integrations / notifications / jobs
            └─ ai / decision-engine
                  └─ PostgreSQL melalui Drizzle ORM
```

Lapisan aplikasi menggunakan pembagian domain, layanan, repository, dan adapter. Repository Drizzle menangani akses PostgreSQL, sementara implementasi in-memory mendukung pengujian terisolasi. Modul analitik menyediakan agregasi, cache, penyamaran sel kecil, materialized view, dan mekanisme refresh terproteksi `CRON_SECRET`. Modul audit menyediakan hash-chain dan verifikasi integritas.

## Menjalankan Secara Lokal

### Prasyarat

- Node.js 22 atau lebih baru (`.nvmrc`)
- pnpm 9 atau lebih baru
- PostgreSQL lokal atau database PostgreSQL yang dapat diakses

### Instalasi

```bash
git clone https://github.com/JundiLesmana/agoraya.git
cd agoraya
nvm use
pnpm install --frozen-lockfile
cp .env.example .env.local
```

Isi `DATABASE_URL` dan `AUTH_SECRET` di `.env.local` sebelum menjalankan aplikasi atau mengakses fungsi yang memerlukan konfigurasi tersebut. `AUTH_SECRET` harus memiliki setidaknya 32 karakter. Simpan kredensial hanya di environment lokal atau secret manager—jangan commit file `.env.local`.

Untuk PostgreSQL lokal, siapkan database dengan `bash scripts/setup-local-db.sh`, lalu jalankan migrasi:

```bash
pnpm db:migrate:local
```

Seed data demo jika diperlukan, lalu mulai server pengembangan:

```bash
pnpm db:seed
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000). Lihat [.env.example](./.env.example) untuk daftar konfigurasi, termasuk variabel opsional. Variabel berawalan `NEXT_PUBLIC_` dapat terekspos ke browser dan tidak boleh berisi secret.

## Perintah Pengembangan dan Pengujian

```bash
pnpm dev                 # Server pengembangan
pnpm build               # Build produksi
pnpm start               # Menjalankan build produksi
pnpm lint                # ESLint
pnpm typecheck           # Pemeriksaan TypeScript
pnpm test                # Seluruh tes Vitest
pnpm test:unit           # Tes unit
pnpm test:integration    # Tes integrasi
pnpm test:security       # Tes keamanan
pnpm test:load           # Tes beban
pnpm test:all            # Unit, integrasi, keamanan, dan beban
pnpm e2e                 # Tes Playwright
```

CI menjalankan lint, typecheck, `pnpm test:all`, tes keamanan, dan build. E2E dapat dijalankan secara terpisah dengan `pnpm e2e`.

Perintah database dan utilitas yang umum:

```bash
pnpm db:migrate:local
pnpm db:generate
pnpm db:seed
pnpm script:verify-audit
pnpm script:export-snapshot -- out.json
```

Periksa konfigurasi dan environment yang diperlukan sebelum menjalankan perintah database atau skrip operasional.

## Struktur Proyek

```text
agoraya/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   ├── feature_request.yml
│   │   └── task.yml
│   ├── workflows/
│   │   └── ci.yml
│   └── pull_request_template.md
├── db/
│   ├── migrations/
│   │   ├── 0001_initial_schema.sql
│   │   ├── 0001_initial_schema.down.sql
│   │   ├── 0002_rbac_module.sql
│   │   ├── 0002_rbac_module.down.sql
│   │   ├── 0003_cms_module.sql
│   │   ├── 0003_cms_module.down.sql
│   │   ├── 0004_reporting_module.sql
│   │   ├── 0004_reporting_module.down.sql
│   │   ├── 0005_analytics_module.sql
│   │   └── 0005_analytics_module.down.sql
│   └── seed/
│       ├── bps-snapshot.ts
│       ├── demo-scenario.ts
│       └── index.ts
├── public/
│   ├── data/
│   │   ├── anggaran-realisasi-apbd.csv
│   │   ├── indikator-statistik-daerah.csv
│   │   └── progres-proyek-daerah.csv
│   ├── datasets/
│   │   └── progres-proyek-metadata.json
│   ├── landing/
│   │   ├── footer-desktop.png
│   │   ├── footer-mobile.png
│   │   ├── hero-desktop.png
│   │   └── hero-mobile.png
│   └── logo/
│       ├── logo-dark.svg
│       └── logo-light.svg
├── scripts/
│   ├── export-snapshot.ts
│   ├── reset-demo.ts
│   ├── rollback-migration.ts
│   ├── seed.ts
│   ├── setup-local-db.sh
│   └── verify-audit.ts
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (admin)/
│   │   │   ├── admin/page.tsx
│   │   │   ├── system/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (asn)/
│   │   │   ├── asn/dashboard/page.tsx
│   │   │   ├── asn/reporting/page.tsx
│   │   │   ├── data-management/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (auth)/
│   │   │   ├── callback/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (citizen)/
│   │   │   ├── citizen/dashboard/page.tsx
│   │   │   ├── citizen/reporting/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── tracking/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (executive)/
│   │   │   ├── analytics/page.tsx
│   │   │   ├── executive/dashboard/
│   │   │   │   ├── _components/    # Kartu ringkasan dan grafik
│   │   │   │   ├── error.tsx
│   │   │   │   ├── loading.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── insights/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (public)/
│   │   │   ├── _components/        # Pencarian utama dan preview dashboard
│   │   │   ├── anggaran/page.tsx
│   │   │   ├── data/
│   │   │   │   ├── _components/    # Katalog, ringkasan, dan tabel proyek
│   │   │   │   ├── anggaran/page.tsx
│   │   │   │   ├── project/page.tsx
│   │   │   │   └── statistik/
│   │   │   │       ├── _components/
│   │   │   │       └── page.tsx
│   │   │   ├── data-pemerintah/proyek/
│   │   │   │   ├── _components/    # Filter, dashboard, informasi, unduhan
│   │   │   │   ├── metodologi/page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── audit/route.ts
│   │   │   ├── auth/route.ts
│   │   │   ├── cron/analytics/refresh/route.ts
│   │   │   ├── health/route.ts
│   │   │   ├── notifications/route.ts
│   │   │   ├── projects/
│   │   │   │   ├── route.ts
│   │   │   │   └── summary/route.ts
│   │   │   ├── rbac/route.ts
│   │   │   └── reports/route.ts
│   │   ├── forbidden/page.tsx
│   │   └── layout.tsx
│   ├── components/                 # Komponen UI lintas halaman
│   │   ├── charts/                 # Grafik dan formatter
│   │   ├── forms/                  # Field dan formulir bersama
│   │   ├── map/
│   │   ├── source-badges/
│   │   ├── ui/                     # Komponen dasar
│   │   └── *.tsx                   # Navigasi, footer, filter, ringkasan
│   ├── lib/                        # Infrastruktur dan helper bersama
│   │   ├── auth/
│   │   ├── db/
│   │   │   └── schema/             # Foundation, RBAC, CMS, KYC, reporting
│   │   ├── env/
│   │   ├── errors/
│   │   ├── idempotency/
│   │   ├── logger/
│   │   ├── rbac/
│   │   ├── result/
│   │   └── *.ts                    # Currency, project data, summary, utilities
│   └── modules/                    # Domain, schema, service, repository, dan adapter
│       ├── ai/
│       ├── analytics/
│       │   ├── aggregates/
│       │   ├── materialized-views/
│       │   └── suppression/
│       ├── audit/
│       ├── cms/
│       │   ├── risk-review/
│       │   ├── state-machine/
│       │   └── versioning/
│       ├── decision-engine/
│       ├── identity/
│       │   ├── otp/
│       │   ├── providers/
│       │   │   ├── identity-provider/
│       │   │   └── mock-dukcapil/
│       │   └── session/
│       ├── integrations/
│       ├── jobs/
│       ├── kyc/
│       │   ├── dual-approval/
│       │   ├── lifecycle/
│       │   └── roster/
│       ├── notifications/
│       ├── rbac/
│       │   ├── grants/
│       │   ├── pdp/
│       │   └── policies/
│       └── reporting/
│           ├── dedup/
│           ├── qc-evidence/
│           ├── sla/
│           ├── state-machine/
│           └── voting/
├── tests/
│   ├── e2e/
│   │   ├── anggaran-filter.test.ts
│   │   └── README.md
│   ├── helpers/
│   │   ├── setup-react.ts
│   │   └── test-utils.ts
│   ├── integration/
│   │   ├── cms/
│   │   ├── integrations/
│   │   ├── kyc/
│   │   ├── rbac/
│   │   ├── reporting/
│   │   └── *.test.ts(x)            # Tes integrasi pada root kategori
│   ├── load/
│   ├── security/
│   │   ├── cms/
│   │   ├── rbac/
│   │   └── *.test.ts(x)
│   └── unit/
│       ├── analytics/
│       ├── audit/
│       ├── cms/
│       ├── db/
│       ├── integrations/
│       ├── jobs/
│       ├── kyc/
│       ├── lib/
│       ├── notifications/
│       ├── rbac/
│       ├── reporting/
│       └── *.test.ts(x)            # Tes halaman, UI, domain, dan utilitas
├── .env.example                    # Template konfigurasi tanpa secret
├── .gitignore
├── .nvmrc
├── .prettierignore
├── .prettierrc.json
├── CONTRIBUTING.md
├── DOCUMENTATION.md
├── drizzle.config.ts
├── drizzle.config.local.ts
├── eslint.config.mjs
├── next-env.d.ts
├── package.json
├── playwright.config.ts
├── pnpm-lock.yaml
├── postcss.config.mjs
├── README.md
├── tsconfig.json
├── vercel.json
└── vitest.config.ts
```

Tree ini merangkum seluruh area utama dan subdirektori fitur yang ada. Berkas hasil build/cache, dependency terpasang, serta `.env` lokal tidak ditampilkan. Dokumentasi teknis utama berada di `DOCUMENTATION.md`.

## Kontribusi dan Dokumentasi

Sebelum mengirim perubahan, baca panduan [CONTRIBUTING.md](./CONTRIBUTING.md). Dokumentasi teknis proyek tersedia di [DOCUMENTATION.md](./DOCUMENTATION.md).

## Lisensi

Proprietary. Hak cipta dilindungi.
