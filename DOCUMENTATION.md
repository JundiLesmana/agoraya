# DOCUMENTATION.md — Agoraya

> Dokumentasi teknis lengkap untuk pengembangan, deployment, dan pemeliharaan platform Agoraya.
> Terakhir diperbarui: 2026-10-20

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Modul & Fitur](#3-modul--fitur)
4. [Database & Schema](#4-database--schema)
5. [Autentikasi & Otorisasi](#5-autentikasi--otorisasi)
6. [API Reference](#6-api-reference)
7. [UI/UX & Design System](#7-uiux--design-system)
8. [Integrasi Eksternal](#8-integrasi-eksternal)
9. [AI & Chatbot](#9-ai--chatbot)
10. [Setup & Konfigurasi](#10-setup--konfigurasi)
11. [Testing Strategy](#11-testing-strategy)
12. [CI/CD & Deployment](#12-cicd--deployment)
13. [Security](#13-security)
14. [Audit & Compliance](#14-audit--compliance)
15. [Performance & Monitoring](#15-performance--monitoring)
16. [Contributing](#16-contributing)
17. [Troubleshooting](#17-troubleshooting)
18. [Glossary](#18-glossary)
19. [Appendix: Decision Records](#19-appendix-decision-records)

---

## 1. Pendahuluan

### 1.1 Apa itu Agoraya?

Agoraya adalah platform web tata kelola pemerintahan digital yang menggabungkan:
- **Transparansi data publik** — Visualisasi anggaran, statistik, dan open government data
- **Pelaporan warga** — Sistem pelaporan dan tracking masalah publik
- **CMS pemerintahan** — Pendataan dengan workflow Maker-Checker
- **Gamifikasi sipil** — Reward partisipasi warga dan kredit komunitas
- **Decision Engine** — Prioritisasi proyek pemerintah berbasis data

### 1.2 Prinsip Utama

1. **Privacy-First** — Data publik hanya agregat; PII dilindungi
2. **Deterministic Decisions** — AI menjelaskan, bukan memutuskan
3. **Web-Only** — Tidak ada CCTV/IoT/hardware
4. **Audit-Everything** — Setiap aksi tercatat, tidak bisa dihapus
5. **Mobile-First** — Responsive untuk semua device

### 1.3 Tech Stack Overview

```
Frontend:  Next.js 15 App Router + React 19 + TypeScript strict
Styling:   Tailwind CSS 4 + shadcn/ui + Radix UI
Backend:   Next.js API Routes + Server Actions
Database:  PostgreSQL 16 (Neon) + Drizzle ORM
Email:     Brevo Transactional API
CDN:       Cloudinary
Data:      BPS API (real) + Synthetic/Mock (demo)
AI:        Gemini/Cerebras/Groq via AI Router
Testing:   Vitest + Playwright
CI/CD:     GitHub Actions + Vercel
```

---

## 2. Arsitektur Sistem

### 2.1 Modular Monolith

Agoraya menggunakan arsitektur **Modular Monolith** — satu aplikasi Next.js dengan modul-modul feature yang terisolasi.

**Mengapa bukan microservices?**
- Tim kecil; satu deployable unit lebih efisien
- Vercel + Neon sudah cukup untuk skala target
- Mengurangi operational complexity
- Lihat: [ADR-0001: Modular Monolith](./docs/adr/0001-modular-monolith.md)

### 2.2 Diagram Arsitektur

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│  React 19 + Tailwind + shadcn/ui + Recharts + MapLibre          │
└───────────────────────────────┬──────────────────────────────────┘
                                │ HTTPS
┌───────────────────────────────▼──────────────────────────────────┐
│                     NEXT.JS APP ROUTER                           │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  Routes  │ │  Server  │ │   API    │ │Middleware│           │
│  │  (Pages) │ │ Actions  │ │ Handlers │ │(Auth/RLS)│           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────┘           │
│       └─────────────┼───────────┘                               │
│                     ▼                                            │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              APPLICATION SERVICES                     │       │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │       │
│  │  │ Auth │ │  CMS │ │Report│ │Analyt│ │Audit │      │       │
│  │  │Module│ │Module│ │Module│ │Module│ │Module│      │       │
│  │  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘      │       │
│  └─────┼────────┼────────┼────────┼────────┼───────────┘       │
│        └────────┼────────┼────────┼────────┘                    │
│                 ▼        ▼        ▼                              │
│  ┌──────────────────────────────────────────────────────┐       │
│  │           SHARED INFRASTRUCTURE                       │       │
│  │  Database │ Email │ AI Router │ Storage │ Audit Log   │       │
│  └──────────────────────────────────────────────────────┘       │
└──────────────────────────────┬───────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
   │ PostgreSQL   │   │    Brevo     │   │  Cloudinary  │
   │   (Neon)     │   │  (Email)     │   │    (CDN)     │
   └──────────────┘   └──────────────┘   └──────────────┘
          │
          ▼
   ┌──────────────┐
   │   BPS API    │
   │ (Data Gov)   │
   └──────────────┘
```

### 2.3 Feature Modules

Setiap modul mengikuti pattern yang konsisten:

```
src/modules/<feature>/
├── index.ts            # Public entry point (stable exports)
├── schema.ts           # Zod request/response contracts
├── types.ts            # Feature-specific types (jika perlu)
├── service.ts          # Use-case orchestration
├── repository.ts       # Data access / queries
├── domain.ts           # Pure business rules & state transitions
└── adapters/           # External provider implementations
```

**Aturan dependency:**
- UI hanya import dari `index.ts` modul lain (never deep import)
- Domain layer TIDAK boleh import dari infrastructure
- Repository TIDAK boleh punya business logic
- Adapters terisolasi di belakang interface

### 2.4 Database Architecture (CQRS-Inspired)

```
                    WRITE PATH                  READ PATH
                    ──────────                  ─────────
    ┌──────────┐                         ┌──────────────┐
    │  Junior  │──┐                      │   Landing    │
    │  (Maker) │  │                      │   Page       │
    └──────────┘  │   ┌──────────┐       └──────┬───────┘
                  ├──▶│PostgreSQL│               │
    ┌──────────┐  │   │  (OLTP)  │               ▼
    │Mid-Level │──┘   │          │       ┌──────────────┐
    │(Checker) │      │ Tables + │──────▶│ Materialized │
    └──────────┘      │   RLS    │       │    Views     │
                      │          │       │  (Read-only  │
                      │ Triggers │       │  Aggregates) │
                      │          │       └──────────────┘
                      │Audit Log │
                      │(Append)  │
                      └──────────┘
```

**Prinsip:**
- **OLTP** (Write) — Real-time data input dari pegawai
- **Materialized Views** (Read) — Pre-aggregated data untuk dashboard publik
- **Audit Log** — Append-only, immutable, hash-chain verification
- **RLS** (Row-Level Security) — Tenant isolation di level database

---

## 3. Modul & Fitur

### 3.1 Module 1: Identity & Auth (`src/modules/auth/`)

#### NIK sebagai Identifier
- NIK digunakan sebagai username, **BUKAN** password
- Autentikasi: **NIK + OTP via Email**
- NIK bersifat identifier, bukan rahasia

#### Flow Autentikasi
```
[User Input NIK] → [Lookup User] → [Generate OTP]
       → [Send via Brevo] → [User Input OTP]
       → [Validate OTP] → [Create Session]
```

#### OTP Security
| Parameter | Nilai |
|-----------|-------|
| Expiry | 5 menit (configurable) |
| Max Attempts | 3 per OTP |
| Rate Limit | 1 OTP per 60 detik per NIK |
| Storage | Hashed (bukan plaintext) |
| Single-use | Ya, invalidasi setelah digunakan |

#### RBAC + ABAC

**RBAC (Role-Based)**
| Role | Deskripsi |
|------|-----------|
| `CITIZEN` | Warga — lapor, tracking, lihat data publik |
| `JUNIOR_STAFF` | Pegawai Junior (Maker) — input data |
| `MID_STAFF` | Pegawai Mid-Level (Checker) — review & approve |
| `ADMIN` | Admin Instansi — kelola CMS & command center |
| `SUPERADMIN` | Superadmin — kelola tenant, audit, KYC |

**ABAC (Attribute-Based)**
```typescript
// Contoh: Junior A hanya bisa lihat data Instansi X, Jabatan Y
{
  role: "JUNIOR_STAFF",
  attributes: {
    instansi_id: "instansi-x",
    jabatan: "staff-pendataan",
    wilayah: ["jakarta-selatan"]
  }
}
```

- RBAC menentukan **apa** yang bisa dilakukan
- ABAC menentukan **scope data** yang bisa diakses
- Server-side enforcement (middleware + RLS)
- Deny by default

#### KYC (Know Your Customer) — Manual

```
[User Registrasi]
  → [Submit Data + Dokumen]
  → [Status: PENDING_KYC]
  → [Admin KYC Review Manual]
  → [Validasi Identitas]
    ├── [APPROVED] → Akun aktif
    └── [REJECTED / FLAGGED] → Notifikasi user + revisi
```

**Mengapa manual?**
- Memastikan validitas data maksimal
- Admin KYC manusia menangani semua verifikasi
- Data valid = keputusan valid

#### Registrasi Flow (dari Figma)
1. **Identitas & Akun** — NIK, nama, email, password
2. **Alamat** — Provinsi, kota/kabupaten, kecamatan, kelurahan, RT/RW
3. **Instansi & Kepegawaian** — (untuk pegawai) instansi, jabatan, NIP
4. **Dokumen** — Upload KTP, foto selfie, dokumen pendukung
5. **Tinjau & Persetujuan** — Review data, agree T&C, submit

---

### 3.2 Module 2: CMS & Pendataan (`src/modules/cms/`)

#### Maker-Checker Workflow

```
 ┌─────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
 │  DRAFT  │────▶│ PENDING │────▶│ APPROVED │────▶│PUBLISHED │
 └─────────┘     └─────────┘     └──────────┘     └──────────┘
   Junior          Junior          Mid-Level        System
   (create)        (submit)        (approve)     (auto-publish)
                      │
                      ▼
                 ┌──────────┐
                 │ REJECTED │
                 └──────────┘
                   Mid-Level
                   (reject + reason)
```

| State | Siapa | Aksi |
|-------|-------|------|
| `DRAFT` | Junior | Membuat/mengedit data |
| `PENDING` | Junior | Submit untuk review |
| `APPROVED` | Mid-Level | Approve setelah review |
| `REJECTED` | Mid-Level | Reject dengan alasan |
| `PUBLISHED` | System | Auto-publish ke dashboard publik |

#### CMS Variants
1. **CMS Civic Reporting** — Input & review laporan warga
2. **CMS Open Government Data** — Kelola dataset publik
3. **CMS Data-Driven Insight** — Analitik & insight
4. **CMS Public Service Tracking** — Tracking layanan publik

#### Automated Validation
- Rules engine memvalidasi format data saat input
- AI sederhana mendeteksi anomali & format errors
- Mid-Level hanya review anomali, bukan semua data
- Mengurangi beban reviewer secara signifikan

---

### 3.3 Module 3: Analytics & Landing Page (`src/modules/analytics/`)

#### Public Dashboard (SatuData.id)

**Prinsip Privacy-First:**
- Hanya menampilkan **data agregat & teranonimisasi**
- ✅ "Jumlah warga miskin di Jakarta: 500.000"
- ❌ TIDAK menampilkan daftar nama/NIK warga
- Small-cell suppression untuk data < threshold

#### Visualisasi yang Tersedia

| Visualisasi | Teknologi | Deskripsi |
|-------------|-----------|-----------|
| Anggaran | Recharts + MapLibre | Pie chart, bar chart, peta per wilayah |
| Kemiskinan | Recharts + MapLibre | Heatmap, tren, distribusi per daerah |
| Infrastruktur | MapLibre + GeoJSON | Peta proyek, status, dan progress |
| Statistik Daerah | Recharts | Grafik demografi, ekonomi per daerah |
| Leaderboard | Custom | Ranking instansi + tingkat kesulitan |

#### Leaderboard & Gamifikasi Instansi
- **Ranking instansi** berdasarkan:
  - Jumlah laporan ditangani
  - Rata-rata waktu penyelesaian
  - Rating warga
  - Tingkat kesulitan laporan (weighted)
- **Tujuan**: Pegawai pemerintah berlomba menangani laporan
- **Tingkat kesulitan**: EASY | MEDIUM | HARD | CRITICAL

#### Insight Dashboard
- Tren pelaporan per periode
- Anomali & outlier detection (AI-assisted)
- Rekomendasi prioritas (explanatory, bukan decision)
- Perbandingan antar wilayah/instansi

---

### 3.4 Civic Reporting (`src/modules/reporting/`)

#### Flow Pelaporan Warga

```
[Warga]                [Sistem]               [PIC]              [Dashboard]
   │                      │                      │                    │
   ├── Buat Laporan ─────▶│                      │                    │
   │   (foto, lokasi,     │── Assign PIC ──────▶│                    │
   │    kategori,         │   (auto by area &    │                    │
   │    deskripsi)        │    category)         │                    │
   │                      │                      │                    │
   │                      │── Hitung Skor ──────▶│                    │
   │                      │   Urgensi Otomatis   │                    │
   │                      │                      │                    │
   │◀── Tracking ID ──────│                      │                    │
   │    + ETA              │                      │                    │
   │                      │                      │── Proses ────────▶│
   │                      │                      │   Laporan          │
   │◀── Status Update ────│◀─────────────────────│                    │
   │    (real-time)       │                      │                    │
   │                      │                      │                    │
   │── Konfirmasi ───────▶│── Verifikasi ──────▶│                    │
   │   Selesai             │   Independen         │                    │
```

#### Skor Urgensi Otomatis

Laporan **tidak hanya** dinilai dari jumlah vote. Skor urgensi = komposit:

```typescript
urgencyScore = (
  voteWeight      * 0.20 +  // Jumlah vote/upvote warga
  categoryWeight  * 0.25 +  // Kategori (bencana > sampah)
  proximityWeight * 0.15 +  // Kedekatan dgn area vital
  impactWeight    * 0.20 +  // Dampak (jiwa > material)
  aiClassWeight   * 0.10 +  // AI classification confidence
  ageWeight       * 0.10    // Umur laporan (makin lama makin urgent)
)
```

| Level Urgensi | Skor | Warna | SLA |
|---------------|------|-------|-----|
| CRITICAL | ≥ 0.8 | 🔴 Merah | 2 jam |
| HIGH | 0.6 - 0.79 | 🟠 Oranye | 12 jam |
| MEDIUM | 0.4 - 0.59 | 🟡 Kuning | 48 jam |
| LOW | < 0.4 | 🟢 Hijau | 7 hari |

#### Eskalasi SLA (Smart Escalation)

```
[PIC tidak respon dalam SLA]
         │
         ▼ (1x SLA)
[Tawarkan ke Rekan Sejawat]  ← Peer-to-Peer
         │
         │ Jika masih diabaikan
         ▼ (2x SLA)
[Eskalasi ke Atasan]  ← + Notifikasi email
         │
         ▼
[Status: "Terlambat Ditangani"]  ← Tampil di dashboard publik
         │                          (Social Pressure)
         ▼
[Command Center Alert]  ← Indikator MERAH
```

**Tidak langsung membanjiri atasan!** Tahapan:
1. **1x SLA** — Offer ke peer (rekan sejawat satu level)
2. **2x SLA** — Eskalasi ke atasan + status publik
3. **3x SLA** — Command center alert + laporan ke Superadmin

#### Tracking Laporan dengan ETA

Warga bisa melihat:
- Status saat ini (SUBMITTED → ASSIGNED → IN_PROGRESS → RESOLVED → VERIFIED)
- **ETA yang pasti** berdasarkan kategori, historis, dan beban kerja PIC
- Timeline aktivitas
- PIC yang menangani (nama/badge, bukan detail pribadi)
- Kemampuan konfirmasi penyelesaian

#### Visualisasi Bencana

```
Peta interaktif menampilkan:
├── Bencana aktif (pin dengan warna urgensi)
│   ├── 🔴 Kebakaran (CRITICAL)
│   ├── 🟠 Banjir (HIGH)
│   ├── 🟡 Longsor (MEDIUM)
│   └── 🟢 Pohon Tumbang (LOW)
├── Area terdampak (polygon overlay)
├── Status penanganan
└── Jumlah warga terdampak
```

---

### 3.5 Layanan Publik Digital (`src/modules/services/`)

#### Pengajuan & Perizinan Online

```
[Warga Pilih Layanan]
    → [Isi Formulir Online]
    → [Upload Dokumen Pendukung]
    → [Submit Pengajuan]
    → [Status: SUBMITTED]
    → [Review Petugas]
       ├── [APPROVED] → Generate Surat → [Download Mandiri]
       └── [REVISION_NEEDED] → Notifikasi → [Warga Revisi]
```

**Jenis layanan:**
- Surat Keterangan Domisili
- Surat Pengantar RT/RW
- Perizinan IMB/PBG
- Surat Keterangan Tidak Mampu
- Dan lainnya (configurable per instansi)

**Tracking status:**
- Progress bar visual
- Timeline detail setiap tahap
- Estimasi waktu per tahap
- Notifikasi email setiap perubahan status
- Download surat yang sudah jadi

---

### 3.6 Command Center (`src/modules/command-center/`)

#### Dashboard Monitoring

```
┌──────────────────────────────────────────────┐
│              COMMAND CENTER                    │
├──────────────┬──────────────┬────────────────┤
│ 📊 Laporan   │ ⏱️ Rata-rata │ 🚦 Status     │
│    Aktif     │ Penyelesaian │    Sistem      │
│    1,234     │   4.2 jam    │  🟢 Normal     │
├──────────────┴──────────────┴────────────────┤
│                                               │
│  🔴 Critical (12)  🟠 High (45)              │
│  🟡 Medium (234)   🟢 Low (943)              │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │ Laporan Terbaru (prioritas urgensi)     │  │
│  │ 1. 🔴 Kebakaran Jl. Sudirman [2m ago]  │  │
│  │ 2. 🔴 Banjir Kemang [15m ago]           │  │
│  │ 3. 🟠 Jalan Rusak Menteng [1h ago]      │  │
│  └─────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

#### Indikator Warna

| Warna | Kondisi |
|-------|---------|
| 🟢 Hijau | Normal — semua laporan dalam SLA |
| 🟡 Kuning | Warning — >10% laporan mendekati SLA |
| 🔴 Merah | Critical — ada laporan melebihi SLA |

#### Upvote → Urgensi di Command Center
- Laporan yang banyak di-upvote warga otomatis naik prioritas
- Skor urgensi dihitung ulang setiap ada vote baru
- Command center sort by urgency score
- Admin bisa override manual dengan alasan (ter-audit)

---

### 3.7 Gamification & Civic Rewards (`src/modules/gamification/`)

#### Poin Individu

| Aksi | Poin |
|------|------|
| Submit laporan valid | +10 |
| Laporan terverifikasi selesai | +25 |
| Upvote laporan yang terverifikasi | +2 |
| Konfirmasi penyelesaian | +15 |
| Partisipasi KYC | +50 |

#### Kredit Sipil RT/Kelurahan
- Poin individu di-agregasi ke level RT/Kelurahan
- Kredit bisa digunakan untuk **proyek komunitas**:
  - Bangun taman
  - Perbaikan jalan lingkungan
  - Fasilitas umum
- Threshold minimum untuk jenis proyek tertentu
- Perlu approval admin wilayah

---

### 3.8 AI & Chatbot (`src/modules/chatbot/`)

#### Chatbot

```
[User bertanya]
    → [NLP Classification]
    → [Cari di Dataset/FAQ]
       ├── [Jawaban ditemukan] → Tampilkan jawaban + sumber
       └── [Kasus kompleks / tidak ditemukan]
           → Tampilkan: "Maaf, saya tidak bisa membantu lebih lanjut"
           → [🔴 Tombol "Hubungi Operator"]
           → [Redirect ke live chat / form eskalasi]
```

**Prinsip Chatbot:**
- Jawab berdasarkan **dataset yang sudah di-curate**
- Berikan arahan navigasi untuk user
- **Tidak** membuat keputusan atau mengubah data
- Tombol "Hubungi Operator" untuk kasus kompleks
- Fallback yang jujur (bukan hallucination)

---

## 4. Database & Schema

### 4.1 Tabel Utama

```sql
-- Users & Auth
users                   -- Data pengguna
user_sessions           -- Session management
otp_tokens              -- OTP storage (hashed)
user_roles              -- RBAC assignments
user_attributes         -- ABAC attributes
kyc_requests            -- KYC verification queue

-- Reporting
reports                 -- Laporan warga
report_evidence         -- Foto/dokumen bukti
report_votes            -- Upvote tracking
report_timeline         -- Status change history
report_assignments      -- PIC assignments
report_escalations      -- Escalation history

-- CMS
cms_records             -- Content records (Maker-Checker)
cms_review_history      -- Review audit trail
cms_datasets            -- Open data datasets

-- Services
service_requests        -- Pengajuan layanan
service_documents       -- Dokumen pendukung
service_letters         -- Surat jadi (generated)

-- Analytics
budget_data             -- Data anggaran
infrastructure_projects -- Data proyek infrastruktur
poverty_statistics      -- Statistik kemiskinan
disaster_reports        -- Data bencana

-- Gamification
user_points             -- Poin individu
community_credits       -- Kredit sipil RT/Kelurahan
community_projects      -- Proyek komunitas

-- Audit
audit_logs              -- Append-only audit trail
audit_hash_chain        -- Hash chain verification

-- Multi-tenant
tenants                 -- Instansi/organisasi
tenant_memberships      -- User-tenant assignments
```

### 4.2 Row-Level Security (RLS)

```sql
-- Contoh: User hanya bisa lihat data tenant mereka sendiri
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON reports
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Citizen hanya bisa lihat laporan mereka sendiri
CREATE POLICY citizen_own_reports ON reports
  FOR SELECT
  USING (
    reporter_id = current_setting('app.current_user_id')::uuid
    OR current_setting('app.current_role') IN ('ADMIN', 'SUPERADMIN', 'MID_STAFF')
  );
```

### 4.3 Audit Log Schema

```sql
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id         UUID NOT NULL REFERENCES users(id),
  action          TEXT NOT NULL,  -- CREATE, READ, UPDATE, DELETE
  resource_type   TEXT NOT NULL,  -- reports, cms_records, etc.
  resource_id     UUID NOT NULL,
  tenant_id       UUID NOT NULL,
  ip_address      INET,
  before_value    JSONB,         -- State sebelum aksi
  after_value     JSONB,         -- State setelah aksi
  metadata        JSONB,         -- Konteks tambahan
  hash            TEXT NOT NULL,  -- SHA-256 hash untuk chain
  previous_hash   TEXT NOT NULL   -- Hash entry sebelumnya
);

-- APPEND-ONLY: Tidak ada UPDATE/DELETE
REVOKE UPDATE, DELETE ON audit_logs FROM app_user;
```

### 4.4 Migration Workflow

```bash
# Generate migration dari schema changes
pnpm db:generate

# Jalankan migrations
pnpm db:migrate

# Buka Drizzle Studio untuk inspect
pnpm db:studio

# Seed data demo
pnpm db:seed
```

**Aturan:**
- Setiap schema change = migration file baru
- Jangan edit migration yang sudah di-deploy
- Test migration di preview/staging database dulu
- Sertakan rollback plan
- Tidak boleh mutasi production data secara manual

---

## 5. Autentikasi & Otorisasi

### 5.1 Flow NIK + OTP

```
                                    ┌──────────┐
                                    │  Brevo   │
                                    │  (Email) │
                                    └────┬─────┘
                                         │ OTP Email
    ┌────────┐    NIK     ┌──────────┐   │    ┌──────────┐
    │  User  │───────────▶│  Server  │───┘    │  Neon    │
    │Browser │            │  Auth    │◀──────▶│PostgreSQL│
    │        │◀───────────│  Module  │        │          │
    │        │   Session  │          │        │ users    │
    │        │    Cookie  │          │        │ sessions │
    └────────┘            └──────────┘        │ otp_hash │
                                              └──────────┘
```

### 5.2 Session Security

| Parameter | Konfigurasi |
|-----------|-------------|
| Cookie flags | `httpOnly`, `secure` (prod), `sameSite=lax` |
| Session rotation | Setiap login baru |
| Session expiry | Configurable (default: 24h) |
| Anti-enumeration | Response sama untuk NIK ada/tidak ada |

### 5.3 Authorization Middleware

```typescript
// Pseudocode — middleware pattern
export async function authorize(request: Request, config: {
  requiredRole: Role[];
  requiredAttributes?: AttributeCheck[];
  resourceOwnerId?: string;
}) {
  const session = await getSession(request);
  if (!session) throw new UnauthorizedError();

  // RBAC check
  if (!config.requiredRole.includes(session.role)) {
    throw new ForbiddenError();
  }

  // ABAC check
  if (config.requiredAttributes) {
    for (const check of config.requiredAttributes) {
      if (!matchAttribute(session.attributes, check)) {
        throw new ForbiddenError();
      }
    }
  }

  // Resource ownership check
  if (config.resourceOwnerId && config.resourceOwnerId !== session.userId) {
    if (!['ADMIN', 'SUPERADMIN'].includes(session.role)) {
      throw new ForbiddenError();
    }
  }
}
```

---

## 6. API Reference

### 6.1 Konvensi API

| Aspek | Standar |
|-------|---------|
| Format | JSON (application/json) |
| Auth | Session cookie (httpOnly) |
| Validation | Zod schema (server-side) |
| Errors | Structured error response |
| Pagination | Cursor-based atau offset-based |

### 6.2 Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Data input tidak valid",
    "details": [
      {
        "field": "email",
        "message": "Format email tidak valid"
      }
    ]
  }
}
```

### 6.3 Endpoint Groups

| Group | Path Prefix | Deskripsi |
|-------|-------------|-----------|
| Auth | `/api/auth/*` | Login, OTP, session |
| Reports | `/api/reports/*` | CRUD laporan warga |
| CMS | `/api/cms/*` | Content management |
| Analytics | `/api/analytics/*` | Data agregat publik |
| Services | `/api/services/*` | Pengajuan & perizinan |
| Admin | `/api/admin/*` | Admin operations |
| Chatbot | `/api/chatbot/*` | AI chatbot queries |

---

## 7. UI/UX & Design System

### 7.1 Design Principles

- **Mobile-First** — Design dimulai dari mobile, lalu scale up
- **Dark/Light Mode** — Semua halaman mendukung kedua tema
- **Responsive** — Desktop (≥1280px), Tablet (768px), Mobile (<768px)
- **Accessible** — Semantic HTML, keyboard nav, focus visible, contrast

### 7.2 Pages (dari Figma)

| Halaman | Variasi | Dark/Light |
|---------|---------|------------|
| SatuData.id (Landing) | Desktop, Tablet, Mobile | ✅ / ✅ |
| Tentang SatuData.id | Desktop, Tablet, Mobile | ✅ / ✅ |
| Masuk (Login) | Responsive | ✅ |
| Daftar (Register) | 5 step flow | ✅ |
| Civic Reporting | Desktop, Tablet, Mobile | ✅ / ✅ |
| Lapor Warga | Desktop, Mobile | ✅ |
| Open Government Data | Desktop, Tablet, Mobile | ✅ / ✅ |
| Anggaran | Desktop, Tablet, Mobile | ✅ / ✅ |
| Insight | Desktop, Tablet, Mobile | ✅ / ✅ |
| Proyek | Desktop, Tablet, Mobile | ✅ / ✅ |
| Statistik Daerah | Desktop, Tablet, Mobile | ✅ / ✅ |
| Public Service Tracking | Desktop, Tablet, Mobile | ✅ / ✅ |
| Ruang Instansi | Desktop, Tablet, Mobile | ✅ / ✅ |
| Ruang Statistik | Tablet, Mobile | ✅ / ✅ |
| CMS (4 variants) | Responsive | ✅ |
| Ajukan Layanan Publik | Responsive | ✅ |
| Pengajuan Terkirim | Responsive | ✅ |

### 7.3 Component Library

Menggunakan **shadcn/ui + Radix UI** dengan Tailwind CSS:
- Buttons, Inputs, Selects, Dialogs
- Cards, Tables, Tabs
- Charts (Recharts)
- Maps (MapLibre)
- Dark/Light theme toggle
- Loading skeletons
- Empty states
- Error boundaries

### 7.4 Design Tokens

```css
/* Disesuaikan dengan Figma exports */
--primary: ...;
--secondary: ...;
--success: #22c55e;   /* Status hijau */
--warning: #eab308;   /* Status kuning */
--danger: #ef4444;    /* Status merah */
--background: ...;
--foreground: ...;
```

---

## 8. Integrasi Eksternal

### 8.1 Brevo (Email)

**Satu-satunya provider email outbound.**

| Jenis Email | Trigger |
|-------------|---------|
| OTP Login | User request login |
| Verifikasi KYC | Status KYC berubah |
| Status Laporan | Laporan di-update |
| Eskalasi SLA | PIC tidak merespon |
| Layanan Publik | Status pengajuan berubah |

**Implementasi:**
- Semua melalui adapter `src/lib/email/brevo-adapter.ts`
- Business logic panggil `sendOtpEmail()`, bukan Brevo langsung
- Template typed & version-controlled
- User content di-escape (no raw HTML injection)
- Retry dengan idempotency
- Mock di testing

> Detail: [docs/ai/EMAIL_BREVO.md](./docs/ai/EMAIL_BREVO.md)

### 8.2 BPS API (Data Statistik)

- Sumber data pemerintah yang real
- Cache-first dengan snapshot fallback
- Attributed — label sumber data jelas (`BPS_API`)
- Rate-limited & timeout-handled

### 8.3 Cloudinary (CDN & Media)

- Upload evidence/bukti laporan
- Transform & optimize images
- Private access — authorized download only
- Validate file size/type
- **Jangan** trust filename/MIME header

### 8.4 AI Providers

- Multi-provider melalui AI Router tunggal
- Support: Gemini, Cerebras, Groq, OpenRouter
- Config-driven (environment variables)
- Output di-validate dengan Zod
- PII scrubbing sebelum prompt
- Fallback & circuit breaker
- **AI tidak boleh** mengubah deterministic scores/rankings

> Detail: [ADR-0003: AI Is Explanatory](./docs/adr/0003-ai-is-explanatory.md)

---

## 9. AI & Chatbot

### 9.1 Prinsip AI dalam Agoraya

```
┌─────────────────────────────────────────────────────────┐
│                    AI BOLEH                              │
│  ✅ Menjelaskan data                                    │
│  ✅ Mengklasifikasi laporan                             │
│  ✅ Mengekstrak informasi terstruktur                   │
│  ✅ Memberikan second opinion                            │
│  ✅ Menjawab FAQ (chatbot)                               │
│  ✅ Mendeteksi anomali (rekomendasi, bukan aksi)        │
├─────────────────────────────────────────────────────────┤
│                    AI TIDAK BOLEH                        │
│  ❌ Mengubah skor/ranking deterministic                  │
│  ❌ Mengubah policy weights/anggaran                     │
│  ❌ Menutup laporan otomatis                             │
│  ❌ Membuat keputusan legal/finansial                    │
│  ❌ Override project ranking                             │
│  ❌ Mengedit audit records                               │
└─────────────────────────────────────────────────────────┘
```

### 9.2 AI Router Architecture

```
[Business Module] → [AI Router] → [Provider Adapter]
                                    ├── Gemini
                                    ├── Cerebras
                                    ├── Groq
                                    └── OpenRouter

AI Router handles:
├── Provider selection (config-driven)
├── Rate limiting & quotas
├── Timeout & retries (bounded)
├── Fallback / circuit breaker
├── Response caching
├── Output validation (Zod)
├── PII scrubbing (input)
├── Call observability
└── Error handling (safe fallback)
```

---

## 10. Setup & Konfigurasi

### 10.1 Quick Start

```bash
# 1. Clone
git clone https://github.com/<org>/agoraya.git
cd agoraya

# 2. Node version
nvm use  # Node 22

# 3. Install
pnpm install --frozen-lockfile

# 4. Environment
cp .env.example .env.local
# Edit .env.local

# 5. Database
pnpm db:generate
pnpm db:migrate
pnpm db:seed  # optional

# 6. Run
pnpm dev
```

### 10.2 Environment per Stage

| Variable | Development | Preview | Production |
|----------|-------------|---------|------------|
| `DATABASE_URL` | Local/Neon Dev | Neon Preview | Neon Production |
| `BREVO_API_KEY` | Test key | Test key | Production key |
| `AUTH_SECRET` | Random | Random | Strong random |
| `NEXT_PUBLIC_APP_URL` | localhost:3000 | Preview URL | Production URL |

### 10.3 Neon Database Setup

1. Buat project di [Neon Console](https://console.neon.tech/)
2. Buat branch untuk development & preview
3. Copy connection string ke `.env.local`
4. Gunakan `DATABASE_URL_UNPOOLED` untuk migrations

### 10.4 Brevo Setup

1. Daftar di [Brevo](https://www.brevo.com/)
2. Verifikasi sender domain (SPF/DKIM)
3. Buat API key
4. Set `BREVO_API_KEY` dan `BREVO_SENDER_EMAIL`

### 10.5 Cloudinary Setup

1. Daftar di [Cloudinary](https://cloudinary.com/)
2. Copy Cloud Name, API Key, API Secret
3. Set environment variables

### 10.6 VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "ms-playwright.playwright"
  ]
}
```

---

## 11. Testing Strategy

### 11.1 Test Pyramid

| Level | Tool | Focus | Coverage Target |
|-------|------|-------|----------------|
| Unit | Vitest | Domain rules, validators, scoring | ≥ 80% |
| Integration | Vitest + Neon | DB + RLS + adapters | Critical paths |
| E2E | Playwright | Critical user journeys | Happy + error paths |
| Security | Vitest | Negative tests (access control) | All auth changes |

### 11.2 Wajib: Negative Security Tests

Setiap perubahan auth/access harus include:

- [ ] Cross-tenant access: denied, no data leak
- [ ] Role escalation: denied
- [ ] Expired/revoked grant: denied
- [ ] Self-approval (CMS): rejected
- [ ] Illegal state transition: rejected
- [ ] Audit modification: rejected
- [ ] OTP replay/expired/rate-limit: handled
- [ ] Public endpoint: no PII leak

### 11.3 Test Commands

```bash
pnpm test                    # Unit tests
pnpm test:integration        # Integration tests
pnpm exec playwright test    # E2E tests
pnpm test -- --coverage      # Coverage report
```

> Detail: [docs/ai/TESTING_STRATEGY.md](./docs/ai/TESTING_STRATEGY.md)

---

## 12. CI/CD & Deployment

### 12.1 CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
on:
  pull_request:
    branches: [development, main]

jobs:
  quality:
    steps:
      - pnpm install --frozen-lockfile
      - pnpm lint
      - pnpm typecheck
      - pnpm test
      - pnpm test:integration  # jika configured
      - pnpm build
```

### 12.2 Deployment Flow

```
feature/GH-XX → PR → CI ✅ → Review ✅ → Merge ke development
                                              │
                                        Vercel Preview
                                              │
development → Release PR → CI ✅ → Review ✅ → Merge ke main
                                                    │
                                              Vercel Production
```

### 12.3 Vercel Configuration

- Framework: Next.js (auto-detected)
- Root Directory: `/`
- Build Command: `pnpm build`
- Output Directory: `.next`
- Node.js Version: 22

> Detail: [docs/ai/CI_CD.md](./docs/ai/CI_CD.md)

---

## 13. Security

### 13.1 Security Checklist

| Area | Kontrol |
|------|---------|
| Auth | Server-side, NIK+OTP, session cookies |
| Authorization | RBAC+ABAC, server-side, deny-by-default |
| Data isolation | RLS PostgreSQL, tenant boundaries |
| Input validation | Zod schemas, server-side |
| Secrets | Environment variables only, never committed |
| PII | Redacted logs, aggregated public data |
| Audit | Append-only, hash-chain, immutable |
| File upload | Size/type validation, private storage |
| AI | Output validated, PII scrubbed, no auto-decisions |
| Email | Brevo only, escaped content, no PII in subjects |

### 13.2 Data Classification

| Level | Contoh | Akses |
|-------|--------|-------|
| **PUBLIC** | Statistik agregat, leaderboard | Semua orang |
| **INTERNAL** | Laporan detail, CMS records | Pegawai terotorisasi |
| **CONFIDENTIAL** | NIK, data KYC, audit trail | Admin + system |
| **SECRET** | API keys, OTP hashes, session tokens | System only |

### 13.3 Apa yang TIDAK BOLEH di-log

- ❌ OTP codes
- ❌ Session tokens
- ❌ Full NIK (mask: `****-****-****-1234`)
- ❌ API keys / secrets
- ❌ Raw email addresses di log publik
- ❌ Evidence URLs (private)

> Detail: [docs/ai/SECURITY_BASELINE.md](./docs/ai/SECURITY_BASELINE.md)

---

## 14. Audit & Compliance

### 14.1 Audit Log Fields

Setiap entry mencatat:

| Field | Deskripsi |
|-------|-----------|
| `timestamp` | Waktu aksi (server-side) |
| `user_id` | Siapa yang melakukan |
| `action` | CREATE, READ, UPDATE, DELETE |
| `resource_type` | Tabel/entitas yang diubah |
| `resource_id` | ID resource |
| `ip_address` | IP address pelaku |
| `before_value` | State sebelum perubahan |
| `after_value` | State setelah perubahan |
| `hash` | SHA-256 hash entry ini |
| `previous_hash` | Hash entry sebelumnya (chain) |

### 14.2 Hash-Chain Verification

```
Entry 1: hash = SHA256(data_1 + "genesis")
Entry 2: hash = SHA256(data_2 + hash_1)
Entry 3: hash = SHA256(data_3 + hash_2)
...
```

Jika satu entry dimanipulasi, semua hash berikutnya akan invalid → **tamper-evident**.

### 14.3 WORM (Write Once Read Many)

- Audit log table: `REVOKE UPDATE, DELETE`
- Bahkan Superadmin tidak bisa menghapus/edit
- Retention policy sesuai regulasi
- Export capability untuk compliance audit

---

## 15. Performance & Monitoring

### 15.1 Performance Guidelines

| Area | Strategi |
|------|----------|
| **Database** | Paginate large queries, avoid N+1, use indexes |
| **Dashboard** | Materialized views, pre-aggregated data |
| **Media** | Cloudinary CDN, lazy-loading, responsive images |
| **Charts** | Recharts lazy-loading, responsive |
| **Maps** | MapLibre vector tiles, clustering |
| **Bundle** | Code splitting, dynamic imports |
| **API** | Bounded queries, cursor pagination |

### 15.2 Monitoring Checklist

- [ ] Vercel Analytics (built-in)
- [ ] Structured logging (correlation IDs)
- [ ] Error tracking (Sentry atau equivalent)
- [ ] Database query performance (Neon dashboard)
- [ ] API response times
- [ ] Email delivery status (Brevo dashboard)

---

## 16. Contributing

### 16.1 Workflow Singkat

1. Checkout branch dari `development`
2. Implement satu issue, satu branch
3. Tambah tests
4. Jalankan quality gates
5. Buka PR ke `development`
6. Tunggu review + CI

### 16.2 Naming Conventions

| Item | Convention | Contoh |
|------|-----------|--------|
| Branch | `<type>/GH-<id>-<desc>` | `feature/GH-42-lapor-warga` |
| Commit | Conventional Commits | `feat(reporting): add photo upload (#42)` |
| Files | kebab-case | `report-service.ts` |
| Components | PascalCase | `ReportCard.tsx` |
| Functions | camelCase | `calculateUrgencyScore()` |
| Types | PascalCase | `ReportStatus` |
| Constants | SCREAMING_SNAKE | `MAX_OTP_ATTEMPTS` |
| DB tables | snake_case | `audit_logs` |
| DB columns | snake_case | `created_at` |
| Env vars | SCREAMING_SNAKE | `DATABASE_URL` |

### 16.3 Code Review Checklist

- [ ] Scope: Hanya perubahan yang relevan dengan issue
- [ ] Security: Auth, authorization, tenant isolation
- [ ] Tests: Unit + negative security
- [ ] Types: No `any`, no `@ts-ignore`
- [ ] Errors: Proper handling, no swallowed errors
- [ ] PII: No secrets, no unredacted data
- [ ] UI: Loading, empty, error states
- [ ] Accessibility: Semantic HTML, keyboard nav

> Detail: [docs/ai/QUALITY_GATE.md](./docs/ai/QUALITY_GATE.md)

---

## 17. Troubleshooting

### 17.1 Common Issues

**Database connection gagal**
```bash
# Cek connection string
echo $DATABASE_URL
# Pastikan Neon project aktif dan IP diallow
```

**OTP email tidak terkirim**
```bash
# Cek Brevo API key
# Cek sender domain verification (SPF/DKIM)
# Cek rate limit Brevo
```

**Build gagal di Vercel**
```bash
# Jalankan build lokal dulu
pnpm build
# Cek env vars di Vercel dashboard
```

**TypeScript error**
```bash
pnpm typecheck
# Jangan gunakan @ts-ignore — fix the type properly
```

**Migration gagal**
```bash
# Cek DATABASE_URL_UNPOOLED (bukan pooled connection)
pnpm db:generate
pnpm db:migrate
```

### 17.2 Support Channels

- GitHub Issues — Bug reports & feature requests
- GitHub Discussions — Questions & discussions
- Internal Slack/Discord — Team communication

---

## 18. Glossary

| Istilah | Definisi |
|---------|----------|
| **ABAC** | Attribute-Based Access Control — otorisasi berdasarkan atribut user |
| **ADR** | Architecture Decision Record — dokumen keputusan arsitektur |
| **BPS** | Badan Pusat Statistik — sumber data pemerintah |
| **CQRS** | Command Query Responsibility Segregation — pisahkan write dan read path |
| **KYC** | Know Your Customer — verifikasi identitas |
| **Maker-Checker** | Workflow dua-level: input (maker) dan review (checker) |
| **NIK** | Nomor Induk Kependudukan — identifier warga Indonesia |
| **OLAP** | Online Analytical Processing — optimized untuk query analitik |
| **OLTP** | Online Transaction Processing — optimized untuk transaksi |
| **OTP** | One-Time Password — kode sekali pakai untuk autentikasi |
| **PIC** | Person In Charge — penanggung jawab laporan |
| **RBAC** | Role-Based Access Control — otorisasi berdasarkan role |
| **RLS** | Row-Level Security — isolasi data di level database row |
| **SLA** | Service Level Agreement — batas waktu penanganan |
| **WORM** | Write Once Read Many — storage yang tidak bisa dimodifikasi |

---

## 19. Appendix: Decision Records

### ADR Index

| ID | Judul | Status |
|----|-------|--------|
| [ADR-0001](./docs/adr/0001-modular-monolith.md) | Keep as Modular Monolith | ✅ Accepted |
| [ADR-0002](./docs/adr/0002-web-only-integrations.md) | Web-Only Evidence & Brevo Email | ✅ Accepted |
| [ADR-0003](./docs/adr/0003-ai-is-explanatory.md) | AI Does Not Own Decisions | ✅ Accepted |

### Decision Log

| ID | Keputusan |
|----|-----------|
| D-001 | Web-only product, no CCTV/IoT |
| D-002 | Email via Brevo only |
| D-003 | Next.js modular monolith |
| D-004 | Mock identity for demo |
| D-005 | AI explanatory only |
| D-006 | Data provenance labels |
| D-007 | Feature → development → main branch model |

> Detail: [docs/ai/DECISION_LOG.md](./docs/ai/DECISION_LOG.md)

---

*Dokumentasi ini adalah source of truth untuk pengembangan Agoraya. Update setiap ada perubahan arsitektur, fitur, atau keputusan penting.*
