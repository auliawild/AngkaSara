# Progress — AngkaSara (migrasi LitNum → Next.js)

> Log kronologis. Entri terbaru di ATAS. Tiap langkah selesai dicatat di sini supaya
> sesi Claude berikutnya langsung paham posisi. Format tanggal: YYYY-MM-DD.

Status keseluruhan: **Phase 1 — baru mulai (bootstrap).**

Legend: ✅ selesai & terverifikasi · 🚧 sedang dikerjakan · ⬜ belum · ⛔ terblokir

---

## 2026-07-17 — Inisiasi Phase 1

### ✅ Perencanaan & rekonesans
- Rencana lengkap disetujui user. Master plan: `C:\Users\Student\.claude\plans\sekarang-saya-ingin-mengubah-shiny-piglet.md` (disalin juga ke `plans/` di repo ini).
- Rekonesans kode lama `D:\LitNum` selesai (data model, quiz engine, config kelas) — hasilnya masuk ke `plans/schema.md` dan bagian "Peta reuse" di `plans/phase-1-backbone.md`.
- Keputusan arsitektur dikunci (lihat `CLAUDE.md` → Keputusan):
  - Hosting: VPS + domain user, deploy Docker, DB **PostgreSQL**.
  - Identitas siswa: **NISN** (unik).
  - Login staf: email+password, RBAC ADMIN/GURU.
  - Stack: Next.js 16 (App Router, TS), React 19, Tailwind v4 + shadcn/ui, Prisma 7, Better Auth, Vitest.
  - Migrasi bertahap: Phase 1 backbone+CheckPoint+Evaluasi → Phase 2 SKIBA Math → Phase 3 SKIBACA.

### ✅ Skeleton repo & dokumentasi handoff
- Dibuat folder `D:\AngkaSara` + dokumen wajib: `progress.md`, `buglog.md`, `CLAUDE.md`, `README.md`, `plans/*`.

### ⛔ Bootstrap toolchain (BLOKER SAAT INI)
- Mesin ini **belum ada Node.js / npm / Docker** (dicek: tidak di PATH, tidak di lokasi umum).
- winget tersedia (v1.29), WSL ada, tapi shell Claude **bukan admin** → instalasi Node & Docker Desktop butuh elevasi user.
- **Aksi berikutnya (butuh user):** pasang Node.js 24 LTS + Docker Desktop (perintah ada di `buglog.md` entri BOOT-01 dan `CLAUDE.md` → Setup). Setelah terpasang & Docker jalan, lanjut ke scaffold.

---

## Checklist Phase 1 (ringkas — detail di `plans/phase-1-backbone.md`)

- ⛔ 1. Bootstrap toolchain (Node 24 LTS + Docker Desktop) — **butuh user**
- ⬜ 2. Scaffold Next.js (create-next-app, shadcn init)
- ⬜ 3. Docker + Postgres + koneksi Prisma
- ⬜ 4. Skema Prisma + seed (5 jurusan, 46 kelas, 32 bacaan)
- ⬜ 5. Port lib (rng, soal-numerasi, kelas, checkpoint) + Vitest
- ⬜ 6. Auth (Better Auth staf + NISN siswa)
- ⬜ 7. Kelola siswa + impor Excel .xlsx
- ⬜ 8. Alur Check Point (server-generated & server-graded)
- ⬜ 9. Dashboard Evaluasi terpusat
- ⬜ 10. Verifikasi end-to-end + build Docker
