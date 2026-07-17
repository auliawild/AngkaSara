# Migrasi LitNum → AngkaSara (Next.js) — Rencana Phase 1

## Context

Aplikasi literasi-numerasi SMKN 1 Badegan saat ini adalah kumpulan file HTML single-file di `D:\LitNum` (portal, SKIBA Math, SKIBACA, Check Point, Evaluasi) dengan data di **localStorage per-perangkat**. Keterbatasan yang berulang kali muncul sepanjang proyek:

- **Data tidak terpusat** — tiap PC menyimpan datanya sendiri; guru tak pernah bisa melihat 46 kelas dari satu layar. Ini masalah #1.
- **Kunci join rapuh** — `nama` siswa + string `kelas` dipakai sebagai penghubung antar-record; tak ada ID unik.
- **Integritas lemah** — penilaian & kunci "1x per bulan" berjalan di klien (localStorage), mudah dilewati. Bug historis (mis. jawaban selalu di opsi A, timer hardcoded, cap `Math.min`) hanya ketahuan lewat verifikasi manual.
- **`.xlsx` tak terbaca** — tanpa build step, impor Excel hanya bisa salin-tempel/CSV.

Tujuan: memindahkan aplikasi ke **Next.js + PostgreSQL** dengan struktur yang bersih, data terpusat, integritas sisi-server, dan pipeline uji otomatis — di-deploy ke VPS pakai Docker. Target folder: `D:\AngkaSara` (saat ini kosong).

**Dikerjakan bertahap.** Phase 1 (sesi ini) = fondasi + Check Point + Evaluasi. Setelah Phase 1, user akan **meng-clear sesi**, jadi dokumentasi handoff (`CLAUDE.md`, `progress.md`, `plans/`, `buglog.md`) adalah **deliverable wajib**, bukan pelengkap.

## Keputusan yang sudah dikunci (dari Q&A)

| Aspek | Keputusan |
|---|---|
| Hosting | VPS + domain milik user, deploy pakai **Docker**. DB = **PostgreSQL**. |
| Identitas siswa | **NISN** (unik) — menggantikan nama sebagai kunci utama. |
| Login staf | Email + password, RBAC (ADMIN / GURU). |
| Cakupan | **Bertahap.** Phase 1 = backbone + Check Point + Evaluasi. Phase 2 = SKIBA Math. Phase 3 = SKIBACA. |
| Toolchain lokal | User pasang **Node.js 24 LTS + Docker Desktop** → build & verifikasi penuh di mesin ini sebelum deploy. |

> Catatan: **MCP Context7 tidak tersambung** di sesi ini (tidak ada di registry). Versi & praktik terbaru diambil dari dokumentasi resmi + pencarian web (Juli 2026) dan dicantumkan eksplisit di bawah. Saat implementasi, dokumentasi API detail diverifikasi ulang lewat web/官方 docs per paket.

## Stack & paket (jawaban "plugin apa saja")

Versi per Juli 2026 (dikonfirmasi via web):

**Inti**
- `next@16` (App Router, LTS 16.2.x), `react@19`, `react-dom@19`, `typescript`
- `@types/node`, `@types/react`, `@types/react-dom`

**UI**
- `tailwindcss@4` + `@tailwindcss/postcss` (config CSS-first via `@theme`, tanpa `tailwind.config.js`)
- **shadcn/ui** (via CLI `shadcn init`; Radix primitives), `tw-animate-css` (pengganti `tailwindcss-animate`)
- `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`
- `recharts` — grafik dashboard Evaluasi (alternatif: port komponen SVG kustom yang sudah ada; Recharts dipilih agar ringkas & aksesibel)

**Data & backend**
- `prisma` + `@prisma/client` (Prisma 7 — engine TS/WASM, migrasi otomatis, **Prisma Studio** GUI untuk guru menelusuri data). Dipilih di atas Drizzle karena DX & keterbacaan untuk handoff antar-sesi + migrasi matang.
- `better-auth` — auth staf (email+password, RBAC). Rekomendasi default 2026 untuk app self-hosted baru. Login siswa (NISN) = server action + cookie sesi ber-tanda tangan (`jose`), divalidasi ke tabel Student.
- `zod` — validasi skema (form, server action, parsing impor)
- `react-hook-form` + `@hookform/resolvers` — form (impor siswa, CRUD, login)
- `xlsx` (SheetJS) — **impor `.xlsx`/`.xls`/`.csv` sungguhan** (menuntaskan keterbatasan lama) + ekspor rapor

**Uji & kualitas**
- `vitest` — unit test untuk logika murni (generator numerasi, scoring, config kelas, seleksi Check Point). **Wajib** — di sinilah semua bug historis berada.
- `@testing-library/react` (opsional, uji komponen), `playwright` (e2e, Phase 1 akhir/Phase 2)
- `eslint` (config next), `prettier`

**Infra**
- `Dockerfile` (multi-stage, base `node:24-alpine`, `output: 'standalone'`), `docker-compose.yml` (app + `postgres:17`), `.dockerignore`, `.env` / `.env.example`

## Struktur folder target (`D:\AngkaSara`)

```
D:\AngkaSara\
  CLAUDE.md                 # panduan repo untuk sesi Claude berikutnya (WAJIB)
  progress.md               # log progres tiap langkah (WAJIB, di-update terus)
  buglog.md                 # catatan error/bug + cara mengatasinya (WAJIB)
  plans/
    phase-1-backbone.md     # rincian Phase 1 (checklist bertanda)
    phase-2-skiba-math.md   # rencana port SKIBA Math
    phase-3-skibaca.md      # rencana port SKIBACA
    schema.md               # dokumentasi skema DB + kontrak data
  README.md
  package.json  tsconfig.json  next.config.ts  .env.example  Dockerfile  docker-compose.yml
  prisma/
    schema.prisma
    seed.ts                 # jurusan, 46 kelas, 32 bacaan Check Point
  src/
    app/
      (auth)/masuk/         # login: NISN (siswa) & email (staf)
      (siswa)/              # area siswa
        check-point/        # alur Check Point
      (guru)/               # area guru/admin
        siswa/              # kelola siswa + impor Excel
        evaluasi/           # dashboard terpusat (per kelas, periode, klasifikasi)
      api/
    lib/
      soal-numerasi.ts      # PORT dari assets/soal-numerasi.js (TS + RNG ber-seed)
      checkpoint.ts         # PORT logika bangunSoal/scoring → server, deterministik
      kelas.ts              # PORT dari assets/kelas.js (config + helper periode)
      rng.ts                # mulberry32 (PRNG ber-seed)
      auth.ts, db.ts, excel.ts
    components/ui/          # shadcn
    server/                 # server actions (impor, checkpoint submit, dll)
  tests/
    soal-numerasi.test.ts  checkpoint.test.ts  kelas.test.ts
```

## Skema database (Prisma / PostgreSQL) — ringkas

Detail lengkap ditulis ke `plans/schema.md`. Inti:

- **Jurusan** `{ id, kode @unique, nama, icon }` — 5 baris (TKR/TSM/TKJ/Kuliner/TPTUP).
- **Kelas** `{ id, tingkat(enum X|XI|XII), jurusanId, rombel(int), label @unique }` — 46 baris, `@@unique([tingkat,jurusanId,rombel])`. `label` = hasil `namaKelas()` (mis. "XI TKJ 2").
- **Student** `{ id, nisn @unique, nama, kelasId, aktif, createdAt }` — **NISN jadi kunci identitas** (memperbaiki join rapuh).
- **Staff** `{ id, email @unique, nama, role(ADMIN|GURU) }` — password dikelola tabel Better Auth (user/session/account/verification).
- **PracticeActivity** (= `litnum_riwayat`) `{ id, studentId→, kelasLabel(snapshot), domain(NUMERASI|LITERASI), category, level, activity, score, wpm?, stars?, points?, detail?, createdAt }`.
- **CheckpointResult** (= `litnum_ujian`) `{ id, studentId→, kelasLabel, period("YYYY-MM"), seed, numerasi, literasi, total, benarNum, totalNum, benarLit, totalLit, durasiDetik, waktuHabis, payload(Json, soal+jawaban utk review), status, startedAt, submittedAt }`, `@@unique([studentId, period])` → **kunci 1x/bulan dipaksa DB**.
- **ReadingPassage** `{ id, kode @unique, tema, title, text, source(CHECKPOINT|SKIBACA), aktif }` + **ReadingQuestion** `{ passageId→, urutan, q, options(Json string[4]), answerIndex }` — bank 32 bacaan Check Point di-seed ke DB (bisa dikelola admin nanti).

Keputusan desain penting:
- **`kelasLabel` didenormalisasi** ke tiap record aktivitas/checkpoint (snapshot saat kejadian) — supaya rekap per-kelas tetap benar meski siswa naik kelas. (Meniru perilaku lama yang menyimpan `kelas` di tiap record.)
- **Kenaikan kelas / tahun ajaran**: Phase 1 pakai `Student.kelasId` (kelas berjalan) + re-impor tiap tahun. Model `Enrollment(studentId, kelasId, tahunAjaran)` dicatat sebagai peningkatan lanjutan (tidak di Phase 1).
- Soal **numerasi tetap dibangkitkan** (bukan disimpan). Hanya **bacaan** yang disimpan sebagai konten.

## Logika yang diport (peta reuse dari `D:\LitNum`)

Rekonesans sudah memetakan semuanya — port, jangan tulis ulang dari nol:

1. **`assets/soal-numerasi.js` → `src/lib/soal-numerasi.ts`** (paling bersih; tanpa DOM/global). Port apa adanya: util (`randInt, pick, shuffle, gcd, fmtNum, li, lf, clamp, loAt, buildOptions, buildFracOptions`), `TOPICS`, `GEN[topicId](level)→{q,ctx?,answer,options}`, `generateQuestion`, `generateUniqueQuestion`. **Perubahan wajib untuk server**:
   - Ganti `Math.random()` global → **RNG ber-seed** (`src/lib/rng.ts` mulberry32) yang di-inject, agar Check Point tiap siswa **reproducible & bisa dinilai ulang server-side**.
   - `questionHistory` (Map module-global mutable) → state per-generasi (bukan module-global) agar aman multi-request.
   - `fracHTML`/`qHTML` (markup di data): pisahkan `value` (kanonik, utk perbandingan skor via `fmtNum` koma Indonesia) dari render.
2. **Logika Check Point (`ujian.html`) → `src/lib/checkpoint.ts` + server actions`**. Port: konstanta (`JML_NUM=20, JML_BACAAN=3, SOAL_PER_BACAAN=5, DURASI_MENIT=30, LEVELS=[8,10,12,14,16,18,20,20,18,16], GESER_PUTARAN=2`), `bangunSoal()` (numerasi 2/topik dengan rotasi `seed`, seleksi bacaan `mulai=(seed*JML_BACAAN)%n` + `LOMPAT=floor(n/JML_BACAAN)`, `acakOpsiBacaan`), scoring `selesai()` (`total=avg(numerasi,literasi)`), klasifikasi (≥90 Mahir / ≥75 Baik / ≥60 Cukup / else Perlu Bimbingan). **Perubahan**: generasi & penilaian pindah **ke server**; `seed` menyertakan `studentId`+`period` (profil kesulitan `LEVELS` tetap invariant agar adil antar-bulan); kunci 1x/bulan lewat `@@unique`.
3. **`assets/kelas.js` → `src/lib/kelas.ts`**. Port `JURUSAN_LIST` (dengan rombel per-tingkat: TKR 5/5/5, TSM 3/3/3, TKJ 5/5/5, Kuliner 2/2/2, TPTUP 1/0/0 = 46 kelas), helper `jumlahRombel/rombelUntuk/jurusanUntuk/namaKelas/semuaKelas/ikonJurusan/urutkanKelas`, dan helper periode `isoWeek/bucketKey/bucketLabel/bucketTerakhir` + `BUCKET_JUMLAH/BUCKET_NAMA`. Dipakai untuk seed kelas & dashboard periode.
4. **Bank bacaan Check Point (`assets/soal-literasi.js`, 32 bacaan × 5 soal)** → di-seed ke tabel ReadingPassage/ReadingQuestion via `prisma/seed.ts`. Kunci disimpan di `answerIndex` (bank mentah selalu index 0; pengacakan opsi terjadi saat build attempt, seperti `acakOpsiBacaan`).
5. **`reportLitNum` (bridge di skiba-math & skibaca) → server action** yang menulis `PracticeActivity`. Shape sudah konsisten antar kedua produsen. (Aktif penuh di Phase 2/3; di Phase 1 endpoint sudah disiapkan.)

## Rincian Phase 1 (urutan kerja) → ditulis ke `plans/phase-1-backbone.md`

1. **Bootstrap toolchain** — user pasang Node 24 LTS + Docker Desktop; verifikasi `node -v`, `docker -v`.
2. **Scaffold** — `create-next-app` (TS, App Router, Tailwind v4, alias `@/*`), `shadcn init`, struktur folder di atas. Commit awal (git sudah ada).
3. **Docker + DB** — `docker-compose.yml` (postgres:17 + app), `.env`, koneksi Prisma; `prisma migrate dev` pertama.
4. **Skema + seed** — `schema.prisma`; seed Jurusan, 46 Kelas (via `kelas.ts`), 32 bacaan Check Point. Verifikasi via Prisma Studio.
5. **Port lib + tes** — `rng.ts`, `soal-numerasi.ts`, `kelas.ts`, `checkpoint.ts`. **Tulis & jalankan Vitest** yang menegakkan invarian yang dulu jadi bug: 960 kunci numerasi benar lintas level; profil `LEVELS` identik tiap bulan (rata 15,2); tiap topik dapat level berbeda; 0 tumpang-tindih bacaan antar bulan; opsi teracak (kunci tak selalu index 0).
6. **Auth** — Better Auth (staf, RBAC) + login siswa via NISN (server action + cookie). Middleware proteksi rute `(guru)` / `(siswa)`.
7. **Kelola siswa** — impor Excel **`.xlsx` sungguhan** (SheetJS) + salin-tempel/CSV (port parser & validasi `normalKelas` yang sudah teruji), CRUD, daftar per kelas. Uji skala ~1840 siswa.
8. **Check Point (siswa)** — alur: pilih/mulai (generate server, seed per siswa+periode) → 20 soal numerasi → 3 bacaan × 5 → submit → **nilai dihitung server** → simpan CheckpointResult → layar hasil + perbandingan bulan lalu. Kunci 1x/bulan.
9. **Evaluasi (guru) — nilai inti migrasi**: dashboard **terpusat lintas kelas** dari DB — filter kelas/periode, rata numerasi/literasi/total, klasifikasi, grafik perkembangan (harian/mingguan/bulanan/tahunan via helper bucket), notifikasi siswa belum Check Point, ekspor CSV/`.xlsx`.
10. **Verifikasi end-to-end** (lihat bawah) + finalisasi dokumen handoff.

## Deliverable dokumentasi (WAJIB, untuk handoff antar-sesi)

- **`CLAUDE.md`** — cara kerja repo: perintah (`docker compose up`, `npm run dev`, `prisma migrate`, `npm test`), arsitektur, kontrak data, konvensi, "gotcha" (RNG ber-seed, `fmtNum` koma, `kelasLabel` snapshot), status tiap fase.
- **`progress.md`** — log kronologis tiap langkah selesai (tanggal, apa yang dibuat, keputusan, hasil verifikasi). Di-update **setiap** langkah agar sesi baru langsung paham posisi.
- **`buglog.md`** — tiap error/bug: gejala → sebab → solusi. Diisi selama implementasi (mis. kejutan Tailwind v4, Prisma di Docker, Better Auth).
- **`plans/`** — `phase-1-backbone.md` (checklist bertanda ✅/⬜), `phase-2-skiba-math.md`, `phase-3-skibaca.md`, `schema.md`.

## Verifikasi (bagaimana Phase 1 dibuktikan)

- **Unit (Vitest)** — jalankan `npm test`; semua invarian numerasi/checkpoint hijau (lihat langkah 5). Ini jaring pengaman utama.
- **DB** — Prisma Studio: 5 jurusan, 46 kelas, 32 bacaan ter-seed benar.
- **Alur end-to-end (dev server + Browser pane)** — impor ~40 siswa via `.xlsx`; login siswa via NISN; kerjakan Check Point sampai layar hasil; cek CheckpointResult tersimpan + kunci 1x/bulan menolak percobaan kedua; buka Evaluasi → data muncul lintas kelas, grafik & klasifikasi benar, ekspor jalan.
- **Integritas** — buktikan penilaian server-side (bukan klien) & bacaan teracak (strategi "asal pilih A" → ~25%, bukan 100%).
- **Build produksi** — `docker compose up --build` sukses; app jalan di container terhubung Postgres.

## Fase berikutnya (ringkas)

- **Phase 2 — SKIBA Math**: port arena game (level 1-20, tes diagnostik, papan peringkat, unlock topik) memakai `soal-numerasi.ts` yang sudah ada; persist `topic_state`/leaderboard ke DB (lintas perangkat). `reportLitNum`→PracticeActivity aktif.
- **Phase 3 — SKIBACA**: port 5 jurusan × 5 level × 20 bacaan (500 bacaan, termasuk 100 TPTUP) ke DB; WPM; fitur "ringkasan" (bacaan 16-20) **butuh LLM API** — perlu keputusan penyedia (dulu memanggil `api.anthropic.com` tanpa kunci = tak jalan offline). Volume konten besar → dikerjakan bertahap per jurusan.

## Risiko & catatan terbuka

- **Login NISN tanpa password** = kredensial lunak (siapa tahu NISN bisa masuk sebagai siswa itu). Sesuai pilihan user & cocok untuk app latihan taruhan-rendah; opsi PIN bisa ditambah nanti.
- **Data lama tidak dimigrasi** — localStorage per-perangkat + data Check Point lama tercemar bug "jawaban selalu A". Mulai bersih; roster diimpor via Excel. (Skrip impor `litnum_riwayat` bisa dibuat bila user mau, tapi tidak direkomendasikan.)
- **Context7 MCP belum tersambung** — dipakai web/docs resmi. Bila user menyambungkan Context7, sesi implementasi bisa memakainya untuk verifikasi API terbaru.
- **Instalasi Node/Docker butuh hak admin** — langkah pertama implementasi, dijalankan/di-OK-i user.
