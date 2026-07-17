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
- ✅ `prisma/seed.ts`: Jurusan (5), Kelas (46 via `kelas.ts`), ReadingPassage+Question (32 bacaan dari `bacaan-checkpoint.ts`). Script `npm run seed`. Idempoten (upsert + reset soal).
- ✅ **Verifikasi (query langsung):** 5 jurusan, 46 kelas (X16/XI15/XII15), 32 bacaan × 5 = 160 soal; options tersimpan sbg JSON kanonik (answerIndex 0); 46 label unik; re-run tetap 5/46/32/160.

## 5. Port lib + Vitest (jaring pengaman) ✅
- ✅ `src/lib/rng.ts` — mulberry32(seed) + hashSeed(FNV-1a) + helper ber-seed (randIntWith/pickWith/shuffleWith).
- ✅ `src/lib/soal-numerasi.ts` — port `soal-numerasi.js`; RNG di-inject (`createNumerasiEngine(rng)`); `questionHistory` per-engine (non-global).
- ✅ `src/lib/kelas.ts` — port `kelas.js` (config 46 kelas + helper periode/bucket/klasifikasi/normalKelas).
- ✅ `src/lib/checkpoint.ts` — `buildCheckpoint({period,studentKey,passages})` + `nilaiCheckpoint(...)` (server). Seed periode utk rotasi (adil), RNG per-siswa utk isi (anti-nyontek).
- ✅ **Vitest** (`tests/`, 19 tes, 4 file) — invarian yang dulu jadi bug ditegakkan:
  - 10 topik × 20 level: kunci numerasi benar via **evaluator independen** — 1200 sampel, 0 salah.
  - Profil `LEVELS` identik 24 bulan (rata 15,2); tiap topik dapat 2 level BEDA (0 kembar).
  - Seleksi bacaan: 0 tumpang-tindih antar bulan; 0 Check Point setema-seragam — **diuji pada bank sintetis DAN bank asli 32 bacaan (36 bulan)** (`checkpoint-bank.test.ts`).
  - `acakOpsiBacaan`: sebaran posisi kunci >1 (bukan selalu 0); kunci tetap menunjuk jawaban benar; "asal pilih A" ≈ 25%.
  - Determinisme: seed sama → attempt sama; seed beda → beda; siswa beda → bacaan/level sama, angka beda.
- ✅ `npm test` hijau (19/19); `tsc --noEmit` bersih.

## 6. Auth ✅
- ✅ Better Auth (`src/lib/auth.ts`): email+password, field `role` (ADMIN/GURU) sbg additionalField. Tabel auth ditulis manual di schema (lihat AUTH-01). Seed admin: `npm run seed:admin` (`prisma/seed-admin.ts`, idempoten, hash via `better-auth/crypto`).
- ✅ Login siswa NISN: `src/server/student-auth.ts` (`masukSiswa`) validasi ke `Student` → cookie `jose` (`src/lib/student-session.ts`, rahasia `STUDENT_SESSION_SECRET`).
- ✅ `src/middleware.ts`: proteksi `/guru` (staf, cek cookie Better Auth) & `/siswa` (verifikasi jose); redirect ke `/masuk` (+`next`). URL prefix nyata dipakai (bukan route group tak tampak). Catatan: Next 16 deprecate `middleware.ts` → `proxy.ts` (AUTH-02, ditunda).
- ✅ Halaman `/masuk` (`masuk-form.tsx`, tab Siswa NISN / Staf email) + dasbor terproteksi `/guru` & `/siswa` + logout. Landing `/` → tombol Masuk.
- ✅ **Verifikasi browser end-to-end:** login siswa→/siswa, login admin→/guru (badge ADMIN), middleware tolak lintas-peran, logout, NISN asing tertolak. `tsc` bersih, Vitest 19/19.

## 7. Kelola siswa + impor Excel ✅
- ✅ `src/lib/excel.ts` (**exceljs**, bukan SheetJS): `parseSiswa` `.xlsx/.csv/.tsv` → {nisn, nama, kelas, baris}; deteksi header segala urutan (tanpa header → A/B/C). `.xls` biner ditolak dgn pesan jelas. `templateSiswa()` → workbook 46×40 (Kelas terisi, NISN teks agar nol tak hilang).
- ✅ Logika murni `src/lib/impor.ts` (`hitungImpor`) dipisah dari action (uji Vitest + patuh `"use server"`). Server action `imporSiswa` + `tambah/edit/hapusSiswa` di `src/server/students.ts` (guard `requireStaf`): validasi `normalKelas` (tolak "XII TPTUP 1"), NISN unik (vs DB & dalam-berkas), map `kelasId`; laporan {ditambah, perKelas, dilewati, gagal+alasan+baris}.
- ✅ UI `guru/siswa`: sidebar 46 kelas + jumlah (navigasi `?kelas=id`, render hanya 1 kelas ≈40 baris → tak jebol), panel impor + laporan, tabel per kelas tambah/edit-inline/hapus, unduh template via route `guru/siswa/template`. Kartu tautan di `/guru`.
- ✅ **Verifikasi:** `npm run build` sukses (rute ter-compile, exceljs ter-bundle via `serverExternalPackages`); Vitest **26/26** (+7 impor); round-trip DB langsung (parse→hitungImpor→createMany→baca→bersih); guard middleware redirect tanpa sesi. Data uji dibersihkan. Login staf via browser (ketik sandi) sengaja tak dilakukan agen.

## 8. Check Point (siswa) ✅
- ✅ `mulaiCheckpoint` (`src/server/checkpoint.ts`, guard `sesiSiswa`): cek CheckpointResult(student,period); `buildCheckpoint(seed=studentId,period)`; simpan `in_progress`+payload(kunci server-only); balapan 2-tab ditangani; kembalikan soal via `untukKlien` (TANPA kunci) + `sisaDetik`. Reload=resume.
- ✅ UI `/siswa/checkpoint` + `checkpoint-client.tsx`: 20 numerasi (1/layar, `qHTML`+opsi HTML) → 3 bacaan × 5; progress bar; timer 30 mnt mundur + auto-kumpul; konfirmasi bila kosong. Kartu status di `/siswa`.
- ✅ `submitCheckpoint`: **nilai di server** (`nilaiCheckpoint` thd payload, bukan input klien); simpan skor+`submittedAt`; tolak bila sudah submitted; `elapsed>=DURASI`→`waktuHabis`. `@@unique([studentId,period])` cegah dobel.
- ✅ Layar Hasil (server component): total+klasifikasi warna, numerasi/literasi, benar/total, durasi, perbandingan bulan lalu ▲▼.
- ✅ **Verifikasi:** build sukses; Vitest 31/31 (untukKlien tak bocor kunci; skor sempurna=100, kosong=0, literasi-only→50; "asal pilih A"≈25% sudah ada); round-trip DB (unique 1×/bln ditegakkan, resume tanpa bocor kunci, submit=100); browser kuis (render+timer+pilih+navigasi+rotasi topik).

## 9. Evaluasi (guru) — nilai inti migrasi ✅
- ✅ Agregat DB (`src/lib/evaluasi.ts` murni + `src/server/evaluasi.ts` `muatEvaluasi`): rata numerasi/literasi/total per kelas & periode; klasifikasi; jumlah ikut/belum. Rata pakai `kelasLabel` snapshot; jumlah dari `Student(aktif)`.
- ✅ Dashboard `/guru/evaluasi` (server) + `filter.tsx` (klien): filter kelas + periode; kartu ringkas; grafik perkembangan `grafik.tsx` (SVG garis 3 seri, jeda periode kosong) — Check Point bulanan → grafik BULANAN (bucket lain ditunda krn CP bln-an); rekap **semua kelas** satu tabel; notif belum Check Point (chip batas 60).
- ✅ Ekspor CSV + `.xlsx` (`/guru/evaluasi/export`, ikut filter periode). `print:hidden` pada kontrol (cetak bersih).
- ✅ **Verifikasi:** build sukses; Vitest 36/36 (+5 evaluasi); round-trip DB agregat (3 siswa uji lintas 2 kelas & 2 periode → ringkas/rekap/perkembangan/CSV cocok; data lintas kelas DARI DB = bukti tujuan migrasi). Guard 307 tanpa sesi.

## 10. Verifikasi akhir + handoff
- ✅ `npm test` hijau **36/36**. E2e alur siswa live (login NISN → Check Point resume → soal render + guards 307); alur guru (impor→evaluasi) terbukti round-trip DB #7/#9 (login staf butuh sandi, tak dijalankan agen).
- ⛔ `docker compose up --build` **DITUNDA** — dev SQLite, Docker tak kompatibel di mesin (buglog SQLITE-01); dilakukan saat deploy VPS/Postgres. Build produksi sukses kumulatif di #9.
- 🚧 Finalisasi `progress.md` ✅, `buglog.md`/`CLAUDE.md` (tetap valid). **Commit awal** menunggu konfirmasi user.
