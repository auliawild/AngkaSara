# CLAUDE.md — AngkaSara

Panduan repo untuk sesi Claude Code. **Baca ini dulu, lalu `progress.md` (posisi terkini)
dan `plans/phase-1-backbone.md` (checklist).**

## Apa ini

**AngkaSara** = migrasi aplikasi Literasi-Numerasi SMK Negeri 1 Badegan dari kumpulan
file HTML single-file (`D:\LitNum`, data di localStorage per-perangkat) ke **web app
Next.js + PostgreSQL** dengan data terpusat. Modul: **SKIBA Math** (numerasi),
**SKIBACA** (literasi), **Check Point** (ujian bulanan gabungan), **Evaluasi** (dashboard guru).

Alasan migrasi (masalah aplikasi lama): data tidak terpusat (guru tak bisa lihat 46 kelas
dari satu layar), kunci join rapuh (nama+string kelas), integritas penilaian di klien,
`.xlsx` tak terbaca. Detail: master plan di `plans/` dan `D:\LitNum` (kode lama, referensi port).

## Keputusan (dikunci, jangan diubah tanpa user)

- **Hosting:** VPS + domain user, deploy **Docker**. DB **PostgreSQL**.
- **Identitas siswa:** **NISN** (unik) — kunci utama. Login siswa = NISN (tanpa password; kredensial lunak, disepakati).
- **Staf:** email + password, RBAC **ADMIN / GURU** (Better Auth).
- **Migrasi bertahap:** **Phase 1** = backbone + Check Point + Evaluasi (SESI INI). Phase 2 = SKIBA Math. Phase 3 = SKIBACA.
- **Data lama tidak dimigrasi** (per-perangkat + data Check Point lama tercemar bug "jawaban selalu A"). Mulai bersih; roster diimpor via Excel.

## Stack (versi per Juli 2026)

- **Next.js 16** (App Router, LTS 16.2.x) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (`@theme`, tanpa `tailwind.config.js`) + **shadcn/ui** + `lucide-react`
- **Prisma 7** + **PostgreSQL** (Prisma Studio utk telusuri data)
- **Better Auth** (staf) + login NISN siswa (server action + cookie `jose`)
- **Zod** + **react-hook-form**; **xlsx** (SheetJS) utk impor/ekspor Excel
- **Vitest** (unit — WAJIB utk logika murni), Playwright (e2e nanti)
- **recharts** (grafik Evaluasi)

## Setup (sekali)

Butuh **Node.js 24 LTS + Docker Desktop** (lihat `buglog.md` BOOT-01 utk perintah winget; butuh admin).
```bash
cp .env.example .env            # isi DATABASE_URL, BETTER_AUTH_SECRET, dll.
docker compose up -d db         # Postgres
npm install
npx prisma migrate dev          # buat skema
npm run seed                    # jurusan, 46 kelas, 32 bacaan
npm run dev                     # http://localhost:3000
```

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | dev server |
| `npm test` | Vitest (jaring pengaman logika) |
| `npx prisma studio` | GUI telusuri DB |
| `npx prisma migrate dev` | buat/terapkan migrasi |
| `npm run seed` | seed jurusan/kelas/bacaan |
| `docker compose up --build` | build & jalankan produksi (app + db) |

## Arsitektur

- `src/app/(auth|siswa|guru)` — route group per peran. Middleware proteksi rute.
- `src/lib/` — **logika murni yang diport dari `D:\LitNum\assets`** (uji dgn Vitest):
  - `soal-numerasi.ts` ← `soal-numerasi.js` (generator, RNG **ber-seed**)
  - `checkpoint.ts` ← logika `ujian.html` (bangun soal + scoring, **server-side**)
  - `kelas.ts` ← `kelas.js` (config 46 kelas + helper periode/bucket)
  - `rng.ts` (mulberry32), `db.ts` (Prisma client singleton), `auth.ts`, `excel.ts`
- `src/server/` — server actions (impor siswa, mulai/submit Check Point, query Evaluasi).
- Konten bacaan Check Point ada di **DB** (seed dari `soal-literasi.js`), bukan di kode.

## Gotcha (jebakan yang WAJIB diingat — semua ini pernah jadi bug di app lama)

1. **RNG ber-seed.** Generator numerasi lama pakai `Math.random()` global + `questionHistory`
   Map module-global. Untuk server multi-request: inject RNG ber-seed per generasi, JANGAN
   state module-global. Seed Check Point = fungsi(`studentId`,`period`) → reproducible & bisa dinilai ulang.
2. **`fmtNum` koma Indonesia.** Jawaban numerasi dibandingkan sebagai STRING (`"2,41"`, `"n/d"`).
   Value opsi harus tetap string kanonik; jangan bandingkan sebagai number.
3. **Profil kesulitan Check Point invariant.** `LEVELS=[8,10,12,14,16,18,20,20,18,16]` dipakai
   utuh tiap bulan (rata 15,2) supaya skor antar-bulan sebanding. Hanya pasangan topik↔level yang
   dirotasi. `GESER_PUTARAN=2` (satu-satunya geseran yang bikin tiap topik dapat 2 level beda).
4. **Opsi bacaan HARUS diacak.** Bank mentah selalu taruh kunci di index 0. Kalau ditampilkan apa
   adanya → "asal pilih A" dapat 100%. Acak per attempt (spt `acakOpsiBacaan`), simpan `answerIndex` baru.
5. **Seleksi bacaan anti-ulang & anti-setema.** Geser jendela `seed*JML_BACAAN` (bukan 1) supaya
   bulan berurutan tak beririsan; ambil dgn `LOMPAT=floor(n/JML_BACAAN)` supaya 1 Check Point tak
   seluruhnya satu jurusan. Bank saat ini 32 bacaan.
6. **`kelasLabel` snapshot** di tiap record (bukan hanya FK) supaya rekap per-kelas tahan kenaikan kelas.
7. **Impor `.xlsx` sungguhan** kini mungkin (ada build step) via SheetJS — sekaligus menuntaskan
   keterbatasan lama. Tetap dukung salin-tempel & CSV. Port validasi `normalKelas` (tolak kelas
   yang tak ada di tingkat itu, mis. "XII TPTUP 1").

## Kontrak scoring & config

Lihat `plans/schema.md` → "Kontrak scoring" & tabel 46 kelas. Klasifikasi: ≥90 Mahir / ≥75 Baik
/ ≥60 Cukup / else Perlu Bimbingan.

## Status & handoff

Posisi terkini SELALU di `progress.md` (entri teratas). Checklist Phase 1 di
`plans/phase-1-backbone.md`. Bug & solusi di `buglog.md`. Kode lama sumber-port: `D:\LitNum`.

**Kebiasaan wajib:** tiap langkah selesai → update `progress.md`; tiap error → catat di `buglog.md`;
tiap fitur previewable → verifikasi di browser (jangan minta user cek manual). Proyek lama
membuktikan verifikasi menangkap bug kritis; pertahankan disiplin itu.
