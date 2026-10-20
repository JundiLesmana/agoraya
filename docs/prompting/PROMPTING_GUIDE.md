# 🎯 Panduan Format Prompting — GovHub.ID

> Panduan ini memastikan AI coding assistant tetap dalam konteks, hemat token, dan menghasilkan output yang konsisten.

---

## Daftar Isi

1. [Mengapa Perlu Format Prompting?](#1-mengapa-perlu-format-prompting)
2. [Prinsip Prompting](#2-prinsip-prompting)
3. [Template Prompt Standar](#3-template-prompt-standar)
4. [Prompt untuk Tiap Jenis Task](#4-prompt-untuk-tiap-jenis-task)
5. [Anti-Pattern (Jangan Lakukan)](#5-anti-pattern-jangan-lakukan)
6. [Checklist Sebelum Prompting](#6-checklist-sebelum-prompting)
7. [Context Management](#7-context-management)
8. [Contoh Prompt Nyata](#8-contoh-prompt-nyata)

---

## 1. Mengapa Perlu Format Prompting?

| Masalah | Solusi Format Prompting |
|---------|-------------------------|
| AI keluar konteks | Selalu sertakan scope & non-goals |
| Bolak-balik klarifikasi (boros token) | Berikan informasi lengkap di awal |
| Output tidak konsisten | Gunakan template standar |
| AI mengubah arsitektur | Sertakan constraint eksplisit |
| AI menambah dependency baru | Sebutkan "no new dependencies" |
| AI menulis code tanpa test | Minta test di acceptance criteria |

---

## 2. Prinsip Prompting

### 2.1 — SCOPE: Selalu Batasi Scope

```
✅ "Implementasi upload foto di halaman Lapor Warga"
❌ "Buat fitur reporting"  ← Terlalu luas
```

### 2.2 — CONTEXT: Berikan Konteks yang Cukup

```
✅ "File target: src/modules/reporting/service.ts. Gunakan pattern yang sama dengan src/modules/cms/service.ts"
❌ "Tambahin fitur di service"  ← Ambiguous
```

### 2.3 — CONSTRAINT: Sebutkan Batasan Eksplisit

```
✅ "Jangan tambah dependency baru. Gunakan Zod untuk validasi. Server-side only."
❌ (tidak menyebut constraint)  ← AI mungkin install library baru
```

### 2.4 — OUTPUT: Tentukan Format Output yang Diharapkan

```
✅ "Buat file service.ts dan schema.ts. Tambahkan unit test di __tests__/service.test.ts"
❌ "Buat kodenya"  ← AI tidak tahu mau ditaruh di mana
```

### 2.5 — VERIFY: Minta AI Memverifikasi

```
✅ "Setelah implementasi, jalankan pnpm typecheck && pnpm test && pnpm lint"
❌ (tidak minta verifikasi)  ← Tidak tahu apakah code valid
```

---

## 3. Template Prompt Standar

### 3.1 Template Utama (Copy-Paste)

```markdown
## Task
- Issue: GH-<nomor> — <judul singkat>
- Type: bug | feature | chore
- Module: <nama module yang terpengaruh>

## Context
Baca AGENTS.md dan docs/ai/INDEX.md sebelum coding.
File terkait:
- <path/to/file1.ts> — <fungsi file ini>
- <path/to/file2.ts> — <fungsi file ini>

## Problem
<Jelaskan masalah yang observable, bukan solusi>

## Expected Behavior
<Apa yang harus terjadi setelah fix>

## Acceptance Criteria
- [ ] <Kriteria yang bisa diverifikasi>
- [ ] <Kriteria yang bisa diverifikasi>
- [ ] Tests: <jenis test yang diperlukan>

## Non-Goals (JANGAN dilakukan)
- <Apa yang TIDAK boleh diubah>
- Jangan tambah dependency baru
- Jangan ubah schema database tanpa migration

## Constraints
- Ikuti pattern yang sudah ada di codebase
- TypeScript strict, no `any`
- Server-side validation dengan Zod
- Preserve existing API contracts

## Verification
Setelah selesai, jalankan:
```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Laporkan: files changed, commands run, pass/fail results.
```

### 3.2 Template Ringkas (untuk task kecil)

```markdown
Task: GH-<id> — <judul>
Module: <module>
Files: <target files>

Problem: <1-2 kalimat>
Fix: <apa yang harus dilakukan>
Test: <jenis test>
Constraint: no new deps, follow existing patterns, TypeScript strict
Verify: pnpm lint && pnpm typecheck && pnpm test
```

---

## 4. Prompt untuk Tiap Jenis Task

### 4.1 Bug Fix

```markdown
## Task
- Issue: GH-55 — OTP Expired Masih Bisa Digunakan
- Type: bug
- Module: auth

## Context
File: src/modules/auth/service.ts (fungsi validateOtp)
File: src/modules/auth/__tests__/service.test.ts

## Problem
OTP yang sudah expired (>5 menit) masih bisa digunakan untuk login.
Steps to reproduce:
1. Request OTP
2. Tunggu 6 menit
3. Input OTP → berhasil login (seharusnya gagal)

## Expected Behavior
OTP expired harus ditolak dengan error "OTP sudah kadaluarsa"

## Acceptance Criteria
- [ ] OTP expired → rejected dengan pesan yang jelas
- [ ] Unit test: OTP expired → error
- [ ] Unit test: OTP valid (< 5 menit) → success
- [ ] Existing tests tetap pass

## Non-Goals
- Jangan ubah flow login lainnya
- Jangan ubah schema database
- Jangan ubah cara OTP di-generate

## Verification
pnpm test src/modules/auth/
pnpm typecheck
```

### 4.2 New Feature

```markdown
## Task
- Issue: GH-42 — Upload Foto di Lapor Warga
- Type: feature
- Module: reporting

## Context
Baca: AGENTS.md, docs/ai/SECURITY_BASELINE.md (bagian file upload)
File: src/modules/reporting/service.ts
File: src/app/lapor/page.tsx
Pattern reference: (jika ada file serupa)

## Problem
Warga belum bisa melampirkan foto bukti saat membuat laporan.

## Expected Behavior
Warga bisa upload 1-5 foto (max 5MB each, jpg/png) saat membuat laporan.
Foto disimpan di Cloudinary dengan akses private.

## Acceptance Criteria
- [ ] Upload 1-5 foto format jpg/png, max 5MB per file
- [ ] Validasi file size & type di server-side
- [ ] Simpan ke Cloudinary via existing adapter
- [ ] Akses foto memerlukan authorization
- [ ] UI: preview foto sebelum submit, loading state, error state
- [ ] Unit test: validasi file type, size, count
- [ ] Negative test: file terlalu besar → rejected
- [ ] Negative test: file type tidak didukung → rejected

## Non-Goals
- Jangan implement video upload
- Jangan buat image processing/resize di server
- Jangan expose upload URL ke publik

## Constraints
- Gunakan Cloudinary adapter yang sudah ada
- Server-side validation (jangan trust client-side saja)
- Zod schema untuk request validation
- TypeScript strict

## Verification
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

### 4.3 UI Component

```markdown
## Task
- Issue: GH-70 — Status Badge Component
- Type: feature
- Module: components (shared)

## Context
Design: design-figma/Civic Reporting & Accountability — Desktop · Terang.pdf
File: src/components/ui/

## Expected Behavior
Reusable StatusBadge component dengan warna sesuai status:
- 🟢 RESOLVED → green
- 🟡 IN_PROGRESS → yellow
- 🔴 OVERDUE → red
- ⚪ PENDING → gray

## Acceptance Criteria
- [ ] Props: status (enum), size (sm/md/lg), className (optional)
- [ ] Warna sesuai design Figma
- [ ] Accessible: aria-label, sufficient contrast
- [ ] Dark mode support
- [ ] Storybook/unit test

## Non-Goals
- Jangan ubah existing components
- Jangan tambah animation library

## Constraints
- shadcn/ui + Tailwind CSS
- Semantic HTML
- Mobile-first responsive
```

### 4.4 Database Migration

```markdown
## Task
- Issue: GH-80 — Add report_votes Table
- Type: feature
- Module: reporting (database)

## Context
Baca: docs/ai/ENGINEERING_STANDARDS.md (bagian Database)
File: src/db/schema.ts (atau lokasi schema Drizzle)

## Problem
Perlu tabel untuk tracking vote/upvote laporan warga.

## Expected Behavior
Tabel report_votes dengan:
- report_id (FK ke reports)
- user_id (FK ke users)
- unique constraint (1 user = 1 vote per report)
- created_at timestamp

## Acceptance Criteria
- [ ] Migration file dibuat
- [ ] Schema Drizzle di-update
- [ ] Unique constraint: satu user satu vote per report
- [ ] Foreign keys dengan proper cascading
- [ ] RLS policy untuk tenant isolation
- [ ] Test migration di database kosong
- [ ] Rollback plan documented

## Non-Goals
- Jangan ubah tabel existing
- Jangan seed data di migration
- Jangan edit migration yang sudah deployed

## Verification
pnpm db:generate
pnpm db:migrate (di database dev)
pnpm typecheck
```

### 4.5 API Endpoint

```markdown
## Task
- Issue: GH-90 — GET /api/reports/:id Endpoint
- Type: feature
- Module: reporting (API)

## Context
File: src/app/api/reports/[id]/route.ts
Schema: src/modules/reporting/schema.ts
Service: src/modules/reporting/service.ts

## Expected Behavior
GET endpoint yang mengembalikan detail laporan dengan:
- Auth required (session cookie)
- RBAC: CITIZEN (own reports only), STAFF/ADMIN (by tenant)
- ABAC: filter by user attributes (wilayah, instansi)

## Acceptance Criteria
- [ ] Response sesuai Zod schema
- [ ] Auth check: unauthenticated → 401
- [ ] RBAC check: unauthorized role → 403
- [ ] ABAC check: wrong tenant → 404 (bukan 403, anti-enumeration)
- [ ] Citizen hanya bisa lihat laporan sendiri
- [ ] Not found → 404
- [ ] Integration test: authorized access → 200
- [ ] Negative test: cross-tenant → 404
- [ ] Negative test: citizen akses laporan orang lain → 404

## Non-Goals
- Jangan expose PII (NIK, email reporter) di response
- Jangan include audit trail di response ini

## Constraints
- Validate all params with Zod
- Use existing auth middleware
- Follow existing route handler patterns
```

---

## 5. Anti-Pattern (Jangan Lakukan)

### ❌ Prompt Terlalu Vague

```
"Buat fitur reporting"
"Fix bug login"
"Tambahin fitur baru"
```

**Masalah:** AI tidak tahu scope, akan membuat asumsi sendiri, boros token untuk klarifikasi.

### ❌ Prompt Tanpa Constraint

```
"Buat API untuk upload file"
```

**Masalah:** AI mungkin install multer, express-fileupload, atau library lain. Mungkin buat public URL.

**Fix:**
```
"Buat API upload file menggunakan Cloudinary adapter yang sudah ada (src/lib/cloudinary.ts).
Validasi server-side: max 5MB, jpg/png only. Storage: private access.
Jangan tambah dependency baru."
```

### ❌ Prompt yang Minta Banyak Hal Sekaligus

```
"Buat fitur laporan warga lengkap dengan upload foto, tracking status,
notifikasi email, dan integrasi peta semua sekaligus"
```

**Masalah:** Terlalu luas, AI akan kehilangan fokus, output tidak berkualitas.

**Fix:** Pecah jadi beberapa task:
1. GH-42: Upload foto
2. GH-43: Tracking status
3. GH-44: Notifikasi email
4. GH-45: Integrasi peta

### ❌ Prompt Tanpa File Reference

```
"Update service reporting"
```

**Masalah:** AI harus cari-cari file, boros token.

**Fix:**
```
"Update src/modules/reporting/service.ts — fungsi createReport()"
```

### ❌ Prompt Tanpa Verification Step

```
"Implementasi fitur X"
(langsung selesai tanpa test)
```

**Fix:** Selalu akhiri dengan:
```
"Jalankan: pnpm lint && pnpm typecheck && pnpm test && pnpm build
Laporkan hasil setiap command."
```

---

## 6. Checklist Sebelum Prompting

Sebelum menulis prompt, pastikan:

- [ ] **Issue ID** sudah ada (GH-XX)
- [ ] **Acceptance criteria** sudah jelas dan testable
- [ ] **File target** sudah diidentifikasi
- [ ] **Non-goals** sudah disebutkan
- [ ] **Constraint** sudah eksplisit
- [ ] **Test expectation** sudah disebutkan
- [ ] **Verification command** sudah ditentukan
- [ ] **Satu prompt = satu scope** (tidak campur banyak task)

---

## 7. Context Management

### 7.1 Kapan Harus Reload Context

Minta AI reload context jika:
- Percakapan sudah panjang (>20 messages)
- AI mulai "lupa" constraint
- Pindah ke task/issue baru
- Setelah context compaction

**Prompt reload:**
```
"Reload context: baca ulang AGENTS.md dan docs/ai/INDEX.md.
Lalu inspect git status dan branch saat ini.
Task baru: GH-XX"
```

### 7.2 Hemat Token

| Teknik | Cara |
|--------|------|
| Berikan info lengkap di awal | Kurangi bolak-balik |
| Gunakan template | Konsisten, tidak perlu jelaskan format |
| Sebutkan file path | AI tidak perlu search |
| Batasi scope per prompt | Output lebih fokus |
| Minta plan dulu | Review sebelum implement |

### 7.3 Multi-Step Approach (untuk task besar)

```
Step 1: "Buat rencana implementasi untuk GH-42. List files yang akan diubah,
         dependencies, dan test plan. JANGAN coding dulu."

Step 2: (Review rencana, adjust jika perlu)

Step 3: "Implement sesuai rencana. Mulai dari schema.ts dan service.ts."

Step 4: "Tambahkan unit tests dan negative tests."

Step 5: "Jalankan pnpm lint && pnpm typecheck && pnpm test && pnpm build"
```

---

## 8. Contoh Prompt Nyata

### Contoh 1: Implementasi Skor Urgensi

```markdown
## Task
- Issue: GH-100 — Implement Urgency Score Calculator
- Type: feature
- Module: reporting

## Context
Baca AGENTS.md (section tentang AI explanatory only).
File baru: src/modules/reporting/domain.ts
File test: src/modules/reporting/__tests__/domain.test.ts

## Problem
Laporan warga saat ini hanya di-sort by vote count. Perlu composite urgency score.

## Expected Behavior
Fungsi pure `calculateUrgencyScore()` yang menghitung:
- voteWeight (0.20) — normalized vote count
- categoryWeight (0.25) — category severity mapping
- proximityWeight (0.15) — proximity to vital areas
- impactWeight (0.20) — impact type (life > property)
- aiClassWeight (0.10) — AI classification confidence (0-1)
- ageWeight (0.10) — report age in hours, capped at 168h

Output: number 0.0 - 1.0
Mapping: CRITICAL (≥0.8), HIGH (0.6-0.79), MEDIUM (0.4-0.59), LOW (<0.4)

## Acceptance Criteria
- [ ] Pure function, no side effects, deterministic
- [ ] Input: UrgencyInput (Zod schema)
- [ ] Output: { score: number, level: UrgencyLevel }
- [ ] Edge cases: semua weight 0 → score 0
- [ ] Edge cases: semua weight max → score 1.0
- [ ] 10+ unit tests covering boundaries
- [ ] AI weight BUKAN penentu utama (hanya 0.10)

## Non-Goals
- Jangan integrasikan ke API endpoint (task terpisah)
- Jangan import AI provider (score calculation is deterministic code)
- Jangan ubah database schema

## Constraints
- Pure TypeScript function (no external deps)
- Zod schema untuk input validation
- Follow docs/adr/0003-ai-is-explanatory.md

## Verification
pnpm test src/modules/reporting/__tests__/domain.test.ts
pnpm typecheck
```

### Contoh 2: Fix Bug Eskalasi

```markdown
Task: GH-111 — SLA Escalation Langsung ke Atasan
Module: reporting
File: src/modules/reporting/service.ts, fungsi handleEscalation()

Problem: Eskalasi SLA langsung ke atasan tanpa tahap peer-to-peer dulu.
Expected: Tahap 1 (1x SLA) → offer ke peer. Tahap 2 (2x SLA) → baru ke atasan.
Fix: Cek escalation_count di report_escalations table sebelum escalate.

Acceptance Criteria:
- [ ] 1x SLA → peer escalation (bukan atasan)
- [ ] 2x SLA → atasan + status publik
- [ ] Unit test: 1x SLA → peer only
- [ ] Unit test: 2x SLA → atasan
- [ ] Existing escalation tests tetap pass

Non-goals: Jangan ubah SLA duration config. Jangan ubah notification template.
Verify: pnpm test src/modules/reporting/
```

---

*Gunakan panduan ini setiap kali berinteraksi dengan AI coding assistant. Konsistensi = kualitas + efisiensi.*
