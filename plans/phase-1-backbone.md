# Phase 1 — Backbone + Check Point + Evaluasi

Checklist actionable. Tandai ✅ saat selesai & terverifikasi; update `progress.md` tiap langkah.
Detail skema di `schema.md`; peta reuse & gotcha di `../CLAUDE.md`.

## 1. Bootstrap toolchain ⛔ (butuh user, admin)
- ⬜ Pasang Node.js 24 LTS + Docker Desktop (perintah: `buglog.md` BOOT-01).
- ⬜ Verifikasi: `node -v` (v24.x), `npm -v`, `docker -v`, `docker compose version`, Docker Desktop running.

## 2. Scaffold
- ⬜ `npx create-next-app@latest angkasara` → pindah/inisiasi di `D:\AngkaSara` (TS, App Router, Tailwind, ESLint, `src/`, alias `@/*`, **tanpa** Turbopack flag kalau bikin masalah).
- ⬜ `npx shadcn@latest init` (Tailwind v4 defaults) + tambah komponen dasar (button, input, table, dialog, select, card, sonner/toast).
- ⬜ `next.config.ts`: `output: 'standalone'` (utk Docker).
- ⬜ Struktur folder sesuai `../CLAUDE.md` (route group `(auth)`/`(siswa)`/`(guru)`, `src/lib`, `src/server`, `tests`).
- ⬜ Commit awal (git sudah ada di mesin).

## 3. Docker + Postgres + Prisma
- ⬜ `docker-compose.yml`: service `db` (`postgres:17`, volume, env) + `app` (build dari Dockerfile).
- ⬜ `Dockerfile` multi-stage (`node:24-alpine`, install → build → run standalone).
- ⬜ `.dockerignore`, `.env.example` (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`).
- ⬜ `npm i -D prisma && npm i @prisma/client`; `prisma init`; `src/lib/db.ts` (singleton, hindari koneksi ganda saat HMR).
- ⬜ `docker compose up -d db`; `npx prisma migrate dev --name init`.

## 4. Skema + seed
- ⬜ Tulis `prisma/schema.prisma` dari `schema.md`.
- ⬜ Better Auth: `npx @better-auth/cli generate` → gabung tabel auth ke skema → migrate.
- ⬜ `prisma/seed.ts`: Jurusan (5), Kelas (46 via `kelas.ts`), ReadingPassage+Question (32 bacaan dari `soal-literasi.js`). Script `npm run seed`.
- ⬜ **Verifikasi Prisma Studio:** 5 jurusan, 46 kelas (X16/XI15/XII15), 32 bacaan × 5 soal.

## 5. Port lib + Vitest (jaring pengaman)
- ⬜ `src/lib/rng.ts` — mulberry32(seed) + helper (randInt/pick/shuffle memakai RNG ber-seed).
- ⬜ `src/lib/soal-numerasi.ts` — port `soal-numerasi.js`; RNG di-inject; `questionHistory` non-global.
- ⬜ `src/lib/kelas.ts` — port `kelas.js` (config + helper periode/bucket).
- ⬜ `src/lib/checkpoint.ts` — `bangunCheckpoint(seed, passages)` + `nilaiCheckpoint(...)` (server).
- ⬜ **Vitest** (`tests/`): tegakkan invarian yang dulu jadi bug —
  - 10 topik × 20 level: kunci numerasi benar (eval independen) — target 0 salah.
  - Profil `LEVELS` identik 24 bulan (rata 15,2); tiap topik dapat 2 level BEDA (0 kembar).
  - Seleksi bacaan: 0 tumpang-tindih antar bulan; 0 Check Point setema-seragam.
  - `acakOpsiBacaan`: sebaran posisi kunci merata (bukan selalu 0); kunci tetap menunjuk jawaban benar.
  - Determinisme: seed sama → attempt sama; seed beda → beda.
- ⬜ `npm test` hijau.

## 6. Auth
- ⬜ Better Auth (`src/lib/auth.ts`): email+password, field `role` (ADMIN/GURU). Seed 1 admin awal.
- ⬜ Login siswa NISN: server action validasi ke `Student` → set cookie sesi (`jose`).
- ⬜ `middleware.ts`: proteksi `(guru)` (staf) & `(siswa)` (sesi siswa); redirect ke `/masuk`.
- ⬜ Halaman `/masuk` (tab: Siswa via NISN, Staf via email).

## 7. Kelola siswa + impor Excel
- ⬜ `src/lib/excel.ts` (SheetJS): parse `.xlsx/.xls/.csv` → baris {nama, kelas, nisn}.
- ⬜ Server action impor: validasi `normalKelas` (port dari evaluasi.html — tolak kelas tak-ada spt "XII TPTUP 1"), NISN unik, map ke `kelasId`; laporan {ditambah, dilewati (duplikat), gagal+alasan+baris}.
- ⬜ UI `(guru)/siswa`: tabel per kelas, tambah/edit/hapus, tombol impor + unduh template (46 kelas × 40 baris, kolom NISN & Nama kosong).
- ⬜ Verifikasi skala ~1840 siswa (impor cepat, halaman tak jebol — batasi render, paginate/virtualize).

## 8. Check Point (siswa)
- ⬜ Server action `mulaiCheckpoint`: cek belum ada CheckpointResult utk (student, period); generate soal (seed=hash(studentId,period)); simpan attempt `in_progress` + payload; kembalikan soal (tanpa kunci) ke klien.
- ⬜ UI: 20 soal numerasi (1/layar) → 3 bacaan × 5 → submit. Timer 30 menit (server yang berwenang atas waktu habis).
- ⬜ Server action `submitCheckpoint`: **nilai di server** (bandingkan ke payload), simpan skor + `submittedAt`; `@@unique` cegah dobel.
- ⬜ Layar hasil: numerasi/literasi/total, klasifikasi, perbandingan bulan lalu, rincian (opsional).
- ⬜ Verifikasi: penilaian server benar; kunci 1x/bulan menolak percobaan ke-2; "asal pilih A" ≈ 25%.

## 9. Evaluasi (guru) — nilai inti migrasi
- ⬜ Query agregat DB: rata numerasi/literasi/total per kelas & per periode; klasifikasi; jumlah ikut/belum Check Point.
- ⬜ Dashboard `(guru)/evaluasi`: filter kelas + periode; kartu ringkas; grafik perkembangan (harian/mingguan/bulanan/tahunan via `bucketTerakhir`); rekap **semua kelas** dalam satu tabel; notifikasi siswa belum Check Point (batasi chip spt app lama).
- ⬜ Ekspor CSV + `.xlsx` (ikut filter). Cetak/PDF (print CSS).
- ⬜ Verifikasi: data muncul lintas kelas dari DB (bukan per-perangkat) — ini pembuktian tujuan migrasi.

## 10. Verifikasi akhir + handoff
- ⬜ `npm test` hijau; e2e alur penuh (impor → login → Check Point → Evaluasi) via Browser pane.
- ⬜ `docker compose up --build` sukses (app+db) — mirip target VPS.
- ⬜ Finalisasi `progress.md`, `buglog.md`, `CLAUDE.md`. Commit. Siap user clear sesi.
