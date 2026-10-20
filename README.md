# Agoraya

> **Platform Transparansi, Pelaporan Publik, dan Tata Kelola Pemerintahan Digital untuk Indonesia**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql)](https://neon.tech/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

---

## Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Arsitektur](#-arsitektur)
- [Prasyarat](#-prasyarat)
- [Instalasi & Setup](#-instalasi--setup)
- [Environment Variables](#-environment-variables)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Struktur Proyek](#-struktur-proyek)
- [Contributing](#-contributing)
- [Dokumentasi Lengkap](#-dokumentasi-lengkap)
- [Tim](#-tim)

---

## Tentang Proyek

Agoraya adalah platform web yang dirancang untuk meningkatkan transparansi pemerintahan, memfasilitasi pelaporan warga, dan mengoptimalkan pengambilan keputusan berbasis data di sektor publik Indonesia.

### Visi
Membangun ekosistem digital yang menghubungkan warga dengan pemerintah melalui transparansi data, pelaporan yang akuntabel, dan gamifikasi partisipasi sipil.

### Target Pengguna

| Peran | Deskripsi |
|-------|-----------|
| **Warga (Citizen)** | Melapor masalah, tracking layanan publik, lihat data publik |
| **Pegawai Junior (Maker)** | Input data real-time, buat draft laporan |
| **Pegawai Mid-Level (Checker)** | Review & approve data, validasi anomali |
| **Admin Instansi** | Kelola CMS, pantau command center |
| **Superadmin** | Kelola tenant, audit, KYC |

---

## Fitur Utama

### Public Dashboard & Open Data
- **SatuData.id Landing Page** — Visualisasi data agregat publik (BPS API)
- **Statistik Daerah** — Peta & grafik kemiskinan, anggaran, infrastruktur per wilayah
- **Open Government Data** — Dataset terbuka dengan filter, search, dan download
- **Leaderboard Instansi** — Peringkat kinerja penanganan laporan dengan tingkat kesulitan

### Civic Reporting & Accountability
- **Lapor Warga** — Pelaporan masalah dengan foto/dokumen, geotag, dan kategori
- **Tracking Laporan** — Status real-time dengan ETA pasti
- **Skor Urgensi Otomatis** — Gabungan vote warga + AI classification + proximity + dampak
- **Eskalasi SLA** — Peer-to-peer → atasan → dashboard publik ("Terlambat Ditangani")
- **Visualisasi Bencana** — Peta bencana (kebakaran, banjir) sesuai urgensi

### CMS & Pendataan (Maker-Checker)
- **CMS Civic Reporting** — Input & review laporan warga
- **CMS Open Government Data** — Kelola dataset publik
- **CMS Data-Driven Insight** — Analitik & insight
- **CMS Public Service Tracking** — Tracking layanan publik

### Data-Driven Insight
- **Anggaran** — Visualisasi anggaran dengan peta & grafik
- **Proyek** — Prioritisasi proyek pemerintah (Decision Engine)
- **Insight Dashboard** — Analitik tren, anomali, dan rekomendasi AI

### Layanan Publik Digital
- **Pengajuan & Perizinan Online** — Formulir daring dengan tracking status
- **Download Surat** — Surat jadi bisa diunduh mandiri
- **Public Service Tracking** — Warga & instansi bisa pantau progress

### Gamification & Civic Rewards
- **Poin Individu** — Reward untuk partisipasi warga
- **Kredit Sipil RT/Kelurahan** — Poin kolektif untuk proyek komunitas (taman, dll.)

### AI & Chatbot
- **Chatbot Bantuan** — Jawab berdasarkan dataset, arahkan user
- **Escalate ke Operator** — Tombol hubungi operator untuk kasus kompleks
- **AI Classification** — Klasifikasi & ekstraksi otomatis untuk laporan

### Command Center
- **Dashboard Monitoring** — Jumlah laporan aktif, rata-rata penyelesaian
- **Indikator Status** — Merah/Kuning/Hijau berdasarkan SLA
- **Prioritas Urgensi** — Laporan warga yang ter-upvote naik prioritas

### Identity & Auth
- **NIK sebagai Username** — Login dengan NIK + OTP Email
- **Manual KYC** — Verifikasi identitas manual untuk validitas data maksimal
- **RBAC + ABAC** — Isolasi akses granular per instansi, jabatan, wilayah

---

## 🛠️ Tech Stack

### Core
| Teknologi | Fungsi |
|-----------|--------|
| **Next.js 15** (App Router) | Full-stack React framework |
| **TypeScript** (strict) | Type safety |
| **React 19** | UI library |
| **Tailwind CSS 4** | Utility-first CSS |
| **shadcn/ui + Radix** | Component library |

### Data & Backend
| Teknologi | Fungsi |
|-----------|--------|
| **PostgreSQL** (Neon) | Primary database (OLTP) |
| **Drizzle ORM** | Type-safe ORM + migrations |
| **Zod** | Schema validation |
| **BPS API** | Data statistik pemerintah |

### Infrastruktur
| Teknologi | Fungsi |
|-----------|--------|
| **Vercel** | Hosting & deployment |
| **Cloudinary** | CDN & media management |
| **Brevo** | Transactional email (OTP, notifikasi) |

### Visualisasi
| Teknologi | Fungsi |
|-----------|--------|
| **Recharts** | Grafik & chart |
| **MapLibre + GeoJSON** | Peta interaktif |

### Testing & CI
| Teknologi | Fungsi |
|-----------|--------|
| **Vitest** | Unit & integration tests |
| **Playwright** | E2E testing |
| **GitHub Actions** | CI pipeline |

---

## Arsitektur

### Modular Monolith

```
┌─────────────────────────────────────────────────┐
│                  Next.js App                     │
├────────────┬────────────┬───────────┬───────────┤
│  Module 1  │  Module 2  │ Module 3  │ Module 4  │
│  Identity  │  CMS &     │ Analytics │ Audit &   │
│  & Auth    │  Pendataan │ & Landing │ KYC       │
├────────────┴────────────┴───────────┴───────────┤
│            Shared Infrastructure                 │
│   (DB, Email, AI Router, File Storage, Audit)    │
├─────────────────────────────────────────────────┤
│              PostgreSQL (Neon)                    │
│         + RLS + Audit Log (Append-only)          │
└─────────────────────────────────────────────────┘
```

### Dependency Direction
```
UI / Route Handler / Server Action
        ↓
Application Service / Use-case
        ↓
Domain Rules (pure, deterministic)
        ↓
Repository / Data Access
        ↓
Infrastructure Adapter (Brevo, BPS, AI, Cloudinary)
```

### Database Pattern (CQRS-Inspired)
- **Write Path (OLTP)**: PostgreSQL untuk input data real-time
- **Read Path**: Materialized views / pre-aggregated data untuk dashboard publik
- **Audit Log**: Append-only, immutable, dengan hash-chain verification

> Lihat [DOCUMENTATION.md](./DOCUMENTATION.md) untuk detail lengkap arsitektur.

---

## Prasyarat

- **Node.js** ≥ 22 (lihat `.nvmrc`)
- **pnpm** ≥ 9 (package manager)
- **PostgreSQL** 16+ (atau Neon account)
- **Git** ≥ 2.40

### Akun Layanan (untuk fitur penuh)
- [Neon](https://neon.tech/) — Database PostgreSQL
- [Vercel](https://vercel.com/) — Deployment
- [Brevo](https://www.brevo.com/) — Transactional email
- [Cloudinary](https://cloudinary.com/) — CDN & media
- [BPS API](https://webapi.bps.go.id/) — Data statistik

---

## Instalasi & Setup

### 1. Clone Repository
```bash
git clone https://github.com/<org>/agoraya.git
cd agoraya
```

### 2. Install Dependencies
```bash
nvm use          # otomatis pakai Node 22 dari .nvmrc
pnpm install --frozen-lockfile
```

### 3. Setup Environment
```bash
cp .env.example .env.local
# Edit .env.local dengan credentials Anda
```

### 4. Setup Database
```bash
pnpm db:generate   # Generate migration files
pnpm db:migrate     # Jalankan migrations
pnpm db:seed        # (Opsional) Seed data demo
```

### 5. Jalankan Development Server
```bash
pnpm dev
```
Buka [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Buat file `.env.local` dari `.env.example`. **Jangan pernah commit nilai secret.**

```bash
# Database
DATABASE_URL=              # Neon PostgreSQL connection string
DATABASE_URL_UNPOOLED=     # Direct connection untuk migrations

# Auth
AUTH_SECRET=               # Random secret untuk session encryption
OTP_EXPIRY_MINUTES=5       # Durasi OTP (default: 5 menit)
OTP_MAX_ATTEMPTS=3         # Maksimal percobaan OTP

# Brevo (Email)
BREVO_API_KEY=             # API key dari Brevo dashboard
BREVO_SENDER_EMAIL=        # Email pengirim terverifikasi
BREVO_SENDER_NAME=         # Nama pengirim

# Cloudinary (CDN)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=   # Cloud name
CLOUDINARY_API_KEY=                  # API key
CLOUDINARY_API_SECRET=               # API secret

# BPS API
BPS_API_KEY=               # API key dari webapi.bps.go.id

# AI Providers (opsional)
AI_PROVIDER=               # gemini | cerebras | groq | openrouter
AI_API_KEY=                # API key provider AI

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Penting**: Variabel `NEXT_PUBLIC_*` akan terekspos ke client. Jangan taruh secret di sana.

---

## Development

### Scripts Utama

```bash
pnpm dev            # Development server (hot reload)
pnpm build          # Production build
pnpm start          # Start production server
pnpm lint           # ESLint check
pnpm typecheck      # TypeScript type check
pnpm format         # Prettier format
pnpm test           # Unit tests (Vitest)
pnpm test:integration  # Integration tests
pnpm db:studio      # Drizzle Studio (DB GUI)
```

### Branch Model

```
main (protected)        ← production, deploy otomatis
  └── development       ← integration branch
       ├── feature/GH-42-lapor-warga
       ├── bugfix/GH-55-otp-expiry
       └── chore/GH-60-update-deps
```

### Commit Convention
```
<type>(<scope>): <description> (#issue)

Contoh:
feat(reporting): add photo upload to citizen report (#42)
fix(auth): prevent OTP replay attack (#55)
chore(deps): update drizzle-orm to 0.35 (#60)
```

---

## Testing

### Test Pyramid

```
        ┌─────────┐
        │   E2E   │  ← Playwright (critical journeys)
       ┌┴─────────┴┐
       │Integration │  ← DB + RLS + adapters
      ┌┴───────────┴┐
      │    Unit      │  ← Domain rules, validators, scoring
     ┌┴─────────────┴┐
     │Security Negative│ ← Cross-tenant, escalation, audit
     └───────────────┘
```

```bash
# Jalankan semua test
pnpm test

# Jalankan test spesifik
pnpm test src/modules/reporting/

# Watch mode
pnpm test --watch

# E2E
pnpm exec playwright test
```

> Detail lengkap: lihat `docs/ai/TESTING_STRATEGY.md`

---

## Deployment

### Vercel (Recommended)

1. Connect repository ke Vercel
2. Set environment variables di Vercel dashboard (per environment)
3. Branch `main` → Production
4. PR branches → Preview deployments

### Database Migrations (Production)

```bash
# Jangan jalankan migration di production secara langsung!
# Gunakan CI/CD pipeline atau preview database untuk test dulu
pnpm db:migrate
```

### Checklist Deploy

- [ ] Environment variables tersetting di Vercel (Development/Preview/Production)
- [ ] Database migrations sudah dijalankan
- [ ] Brevo sender domain terverifikasi (SPF/DKIM)
- [ ] Cloudinary cloud name dan credentials benar
- [ ] BPS API key aktif
- [ ] Branch protection di GitHub sudah aktif
- [ ] CI checks pass

---

## Struktur Proyek

```
agoraya/
├── .github/                  # GitHub templates & workflows
│   ├── ISSUE_TEMPLATE/       # Bug, feature, task templates
│   ├── workflows/ci.yml      # CI pipeline
│   └── pull_request_template.md
├── src/
│   ├── app/                  # Next.js App Router pages
│   ├── components/           # Shared UI components
│   ├── lib/                  # Shared infrastructure
│   └── modules/              # Feature modules
│       ├── auth/             # Identity & Auth (NIK, OTP, RBAC)
│       ├── reporting/        # Civic Reporting & Accountability
│       ├── cms/              # CMS & Pendataan (Maker-Checker)
│       ├── analytics/        # Analytics & Landing Page
│       ├── audit/            # Audit & KYC
│       ├── services/         # Layanan Publik & Perizinan
│       ├── gamification/     # Poin & Kredit Sipil
│       ├── chatbot/          # AI Chatbot
│       └── command-center/   # Command Center
├── CONTRIBUTING.md           # Contributing guide
├── DOCUMENTATION.md          # Dokumentasi lengkap
├── README.md                
└── package.json
```

---

## Contributing

Baca panduan lengkap di [CONTRIBUTING.md](./CONTRIBUTING.md).

### Quick Start

1. Checkout dari `development`: `git checkout -b feature/GH-XX-deskripsi development`
2. Implement dengan scope minimal — satu issue per branch
3. Tambah tests (unit + negative security jika relevan)
4. Jalankan quality gates: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
5. Buka PR ke `development` dengan template yang sudah disediakan

---

## Dokumentasi Lengkap

| Dokumen | Deskripsi |
|---------|-----------|
| [DOCUMENTATION.md](./DOCUMENTATION.md) | **Dokumentasi teknis lengkap** |

---

## Lisensi

Proprietary. Hak cipta dilindungi.
