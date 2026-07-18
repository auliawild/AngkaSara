# Bug & Error Log — AngkaSara

> Catatan tiap error/bug + cara mengatasinya. Entri terbaru di ATAS.
> Format: **ID — Judul** · Gejala · Sebab · Solusi · Status.

---

## MEM-01 — "Jest worker encountered N child process exceptions, exceeding retry limit"
- **Gejala:** membuka halaman berat (mis. `/guru/laporan/‹siswaId›?semester=2026-1`) di `next dev`
  menampilkan overlay **Runtime Error: "Jest worker encountered 2 child process exceptions,
  exceeding retry limit"** dengan call stack hanya berisi `ChildProcessWorker.initialize` /
  `_onExit` di `next/dist/compiled/jest-worker` — **tidak ada satu pun frame kode kita**.
- **Sebab:** **kehabisan RAM**, bukan bug kode. Laptop dev hanya **±4 GB total** dan saat kejadian
  sisa **±450 MB** (Chrome 15 proses ±580 MB, dev server Next ±455 MB, dll). Next merender Route
  di proses anak (jest-worker); ketika anak itu mati karena memori, Next mencoba ulang lalu
  menyerah dan menampilkan pesan pembungkus di atas. Pesan aslinya (kalau ada) hanya muncul di
  terminal `npm run dev`, bukan di browser — jadi jangan mencari bug di kode halamannya.
- **Bukti negatif (sudah dicek):** jalur data ke DB untuk siswa tsb jalan normal via skrip tsx
  (siswa ada, 0 PracticeActivity, `agregatProgres` OK di 3 mode); `tsc --noEmit` bersih;
  `npm test` & `npm run build` sukses di commit yang sama.
- **Solusi:**
  1. **Restart `next dev`.** Setelah "exceeding retry limit" pool worker-nya rusak — halaman akan
     terus error walau memori sudah lega, sampai server di-restart.
  2. **Lapangkan RAM sebelum ngoding:** tutup tab Chrome yang tak perlu (WhatsApp Web & Docker
     Desktop dashboard paling boros), tutup Word/aplikasi lain. Docker Desktop tidak dipakai
     (dev pakai SQLite — lihat SQLITE-01), jadi pastikan ia tidak berjalan.
  3. **Konfigurasi hemat memori** (sudah diterapkan di `next.config.ts`):
     `onDemandEntries` (`maxInactiveAge` 60 dtk, `pagesBufferLength` 2) supaya halaman menganggur
     dibuang dari memori, plus `experimental.turbopackMemoryLimit` ±1 GB dan
     `experimental.memoryBasedWorkersCount`.
- **Status:** ✅ teratasi (operasional + mitigasi config; bukan bug kode).

## PRISMA7-02 — Model Prisma baru `undefined` di `next dev` yang sudah jalan (client ter-cache)
- **Gejala:** setelah tambah model (SkibaTopicState) + `prisma migrate/generate`, runtime error
  `TypeError: Cannot read properties of undefined (reading 'findMany')` di `prisma.skibaTopicState`,
  padahal `tsc --noEmit` bersih (tipe sudah ada di `src/generated/prisma`).
- **Sebab:** proses `next dev` yang sedang berjalan memuat Prisma Client LAMA di memori; HMR tak
  memuat ulang client hasil generate (mirip modul node_modules).
- **Solusi:** **restart dev server** setelah `prisma generate`/`migrate dev`. (Stop proses listener
  port 3000 lalu `npm run dev` lagi.) tsc tetap benar karena baca tipe dari disk.
- **Status:** ✅ teratasi (operasional; bukan bug kode).

## EXCEL-01 — Impor siswa: `"use server"` hanya boleh export async + exceljs jangan di-bundle
- **Gejala/risiko:** (a) menaruh helper murni sinkron (`hitungImpor`) di file `src/server/students.ts` yg berdirektif `"use server"` → build gagal (aturan Next: SEMUA export file server action wajib async function). (b) exceljs (lib Node besar) berisiko error saat di-bundle Turbopack/webpack untuk route handler & server action.
- **Solusi (diterapkan):**
  1. Logika validasi murni dipindah ke `src/lib/impor.ts` (bukan `"use server"`) → bebas export sinkron + bisa diuji Vitest langsung. `src/server/students.ts` hanya berisi async server action ber-guard `requireStaf` yang memanggilnya. Type-only export dari file `"use server"` juga dihindari (klien impor `ImporLaporan` dari `@/lib/impor`).
  2. `next.config.ts`: `serverExternalPackages: ["exceljs"]` → exceljs di-`require` runtime, tak di-bundle.
  3. NISN berawalan nol: kolom NISN di `templateSiswa()` diformat teks (`ws.getColumn(1).numFmt = "@"`) + parser membaca `cell.text`/richText apa adanya → nol depan tak hilang.
- **Verifikasi:** `npm run build` sukses (rute `/guru/siswa`, `/guru/siswa/template` ter-compile); Vitest 26/26; round-trip DB (parse xlsx→hitungImpor→createMany→baca→hapus) — nol depan utuh, "XII TPTUP 1" ditolak, duplikat dilewati.
- **Status:** ✅ solved.

## AUTH-02 — `middleware.ts` di-deprecate di Next 16 (→ `proxy.ts`)
- **Gejala:** dev server memperingatkan `The "middleware" file convention is deprecated. Please use "proxy" instead.`
- **Sebab:** Next.js 16 mengganti nama konvensi `middleware.ts` → `proxy.ts` (API sama; internal sudah dialias — log memang menyebut `proxy.ts` saat rute diproses).
- **Status:** ⬜ ditunda (bukan bloker). `src/middleware.ts` MASIH berfungsi & sudah terverifikasi (proteksi /guru & /siswa jalan). Saat migrasi: rename file → `src/proxy.ts` dan fungsi `middleware` → `proxy` (blok `config` tetap). Verifikasi ulang proteksi setelah rename.

## AUTH-01 — Better Auth + Prisma 7 (driver-adapter) + SQLite: setup manual
- **Gejala/risiko:** `@better-auth/cli generate` rewel dgn Prisma 7 (URL datasource di `prisma.config.ts`, bukan schema) + generator `prisma-client` output kustom (`src/generated/prisma`). Selain itu client Prisma yang belum di-`generate` ulang membuat `prisma.user` `undefined`.
- **Solusi (diterapkan):**
  1. Tabel Better Auth (`user`/`session`/`account`/`verification`) **ditulis manual** di `schema.prisma` (SQLite-compatible, `@@map` ke nama tabel lowercase). `role` = kolom di `user` (additionalField). Model `Staff` lama DIHAPUS (identitas staf = `user`).
  2. `src/lib/auth.ts`: `betterAuth({ database: prismaAdapter(prisma, { provider: "sqlite" }), emailAndPassword:{enabled:true}, user:{ additionalFields:{ role } }, plugins:[nextCookies()] })`. `nextCookies()` WAJIB plugin terakhir agar cookie tertulis di server action.
  3. Route handler `src/app/api/auth/[...all]/route.ts` = `toNextJsHandler(auth.handler)`.
  4. **Setelah tiap ubah model auth: `npx prisma generate`** sebelum jalankan skrip/seed — kalau tidak, delegasi model (`prisma.user`) `undefined`.
  5. Seed admin (`prisma/seed-admin.ts`): buat `user` + `account(providerId:"credential", password: hashPassword(pw))` pakai `hashPassword` dari `better-auth/crypto` (hasher default = scrypt) → cocok saat sign-in. Hindari `auth.api.signUpEmail` di skrip (nextCookies butuh konteks request).
  6. Siswa TIDAK lewat Better Auth: login via NISN → cookie `jose` (`src/lib/student-session.ts` + `src/server/student-auth.ts`), rahasia `STUDENT_SESSION_SECRET`.
- **Verifikasi (browser, dev):** login siswa (NISN) → `/siswa`; login staf (admin) → `/guru` dgn badge peran `ADMIN`; middleware tolak /guru utk sesi siswa → redirect `/masuk?tab=staf`; logout staf → /guru terproteksi lagi; NISN asing → pesan galat. `tsc --noEmit` bersih, Vitest 19/19.
- **Catatan kinerja:** kompilasi rute pertama LAMBAT (drive D: ~19–49 dtk/rute; Next memperingatkan "Slow filesystem"). Ini bukan bug — request kedua <500 ms.
- **Status:** ✅ solved.

## SQLITE-01 — Beralih ke SQLite (Docker/Postgres tak kompatibel di mesin dev)
- **Gejala:** Docker Desktop gagal dipasang (laptop tak kompatibel: butuh WSL2/Hyper-V/virtualisasi). Postgres via `docker compose up db` tak bisa jalan → semua kerja DB terblokir.
- **Keputusan (disepakati user 2026-07-17):** pakai **SQLite** untuk dev lokal **sementara**. Produksi (VPS) tetap direncanakan **PostgreSQL** (keputusan terkunci di CLAUDE.md tak berubah).
- **Solusi (diterapkan):**
  1. `npm i @prisma/adapter-better-sqlite3 better-sqlite3`. **Wajib** `npm approve-scripts better-sqlite3 && npm rebuild better-sqlite3` (npm 11 blokir build-script native; tanpa ini `better_sqlite3.node` tak terbentuk → runtime gagal `require`).
  2. `schema.prisma`: `datasource.provider = "sqlite"`.
  3. **SQLite di Prisma tak dukung `enum` maupun `Json`.** Semua enum → `String` (nilai kanonik divalidasi di app/Zod): `Tingkat`, `Domain`, `Role`(default `"GURU"`), `PassageSource`(default `"CHECKPOINT"`). Field `Json` → `String` (JSON.stringify/parse manual): `CheckpointResult.payload`, `ReadingQuestion.options`. Blok `enum {}` dihapus (dicatat sbg komentar di schema).
  4. `.env` / `.env.example`: `DATABASE_URL="file:./prisma/data/dev.db"` (baris Postgres disimpan sbg komentar).
  5. `src/lib/db.ts`: adapter `PrismaBetterSqlite3({ url })` (perhatikan ejaan kelas: `Sqlite3`, bukan `SQLite3`). Import dari `@prisma/adapter-better-sqlite3`.
  6. `.gitignore`: tambah `prisma/**/*.db*` supaya `prisma/data/dev.db` + sidecar WAL/SHM tak ter-commit.
- **Verifikasi:** `prisma validate` valid 🚀 · `prisma generate` sukses · `prisma migrate dev --name init` buat `dev.db` + `prisma/migrations/20260717055804_init` · smoke test tsx (create/read/count/delete lintas model, cek eks-enum `tingkat`/`source` & eks-Json `options`) OK · `tsc --noEmit` bersih · Vitest 16/16 lulus.
- **Cara kembali ke PostgreSQL (produksi):** balik `provider = "postgresql"`; kembalikan blok `enum` + tipe field `Json`; `db.ts` → `PrismaPg({ connectionString })`; `DATABASE_URL` → URL Postgres; hapus migrasi SQLite lalu `prisma migrate dev` ulang. `docker-compose.yml`/`Dockerfile` masih dikonfigurasi Postgres (tak diubah).
- **Status:** ✅ solved (SQLite jalan untuk dev). Postgres ditunda ke fase produksi.

## NPM11-01 — npm 11 menunda install-script (sharp, unrs-resolver, dll.)
- **Gejala:** tiap `npm install` muncul `npm warn allow-scripts ... packages have install scripts not yet covered by allowScripts` untuk `sharp`, `unrs-resolver`, `esbuild`, `prisma`, `@prisma/engines`.
- **Sebab:** npm 11 punya gate keamanan: postinstall paket tak dijalankan sampai di-approve.
- **Dampak nyata:** TIDAK memblok. Diuji: `tsx`, `vitest`, `prisma -v`, `prisma generate` semua jalan (Prisma 7 pakai WASM + schema-engine .exe yang sudah ada; esbuild binary teresolusi). `sharp` (optimasi gambar next/image) belum ter-build — hanya berpengaruh kalau pakai next/image dgn optimasi; bisa di-approve nanti bila perlu:
  `npm approve-scripts sharp` lalu `npm rebuild sharp`.
- **Status:** 🚧 workaround (dibiarkan; non-blocking).

## PRISMA7-01 — `datasource.url` tidak lagi didukung di schema.prisma (Prisma 7)
- **Gejala:** `npx prisma validate` → `P1012: The datasource property 'url' is no longer supported in schema files.`
- **Sebab:** Perubahan besar Prisma 7 — URL koneksi pindah ke `prisma.config.ts`; runtime WAJIB pakai **driver adapter** (bukan lagi engine bawaan).
- **Solusi (diterapkan):**
  1. `schema.prisma` datasource hanya `provider = "postgresql"` (tanpa `url`).
  2. Generator diganti ke `provider = "prisma-client"` + `output = "../src/generated/prisma"` (generator baru; hindari isu resolusi `.prisma/client/default` di Next 16 + Turbopack).
  3. `prisma.config.ts` di root: `defineConfig({ schema, datasource:{ url: env("DATABASE_URL") } })` + `import "dotenv/config"`.
  4. `npm i @prisma/adapter-pg pg dotenv` + `-D @types/pg`.
  5. `src/lib/db.ts`: `new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })`, import `PrismaClient` dari `@/generated/prisma/client`.
  6. `src/generated/` di-gitignore → sesi/clone baru WAJIB `npx prisma generate` sebelum build.
- **Verifikasi:** `prisma validate` → valid 🚀; `prisma generate` sukses; `tsc --noEmit` bersih.
- **Ref:** prisma.io/docs/guides/upgrade-prisma-orm/v7 · pris.ly/d/prisma7-client-config
- **Status:** ✅ solved.

## BOOT-01 — Node.js / npm / Docker belum terpasang
- **Gejala:** `node/npm/docker` NOT FOUND di PATH & lokasi umum. Shell Claude bukan admin.
- **Solusi Node (DITERAPKAN, tanpa admin):** unduh build portable resmi
  `node-v24.18.0-win-x64.zip` → ekstrak ke `C:\Users\Student\node24\node-v24.18.0-win-x64`.
  Sudah ditambah ke User PATH, TAPI shell tool baru tidak otomatis mewarisi → tiap perintah
  Node diawali: `export PATH="/c/Users/Student/node24/node-v24.18.0-win-x64:$PATH"`.
  (Terminal user yang dibuka SETELAH ini akan otomatis punya node di PATH.)
- **Docker (MASIH PENDING — butuh admin + reboot):**
  ```powershell
  # PowerShell sebagai Administrator
  winget install -e --id Docker.DockerDesktop --accept-source-agreements --accept-package-agreements
  ```
  Reboot, buka Docker Desktop sekali (aktifkan WSL2). Verifikasi: `docker compose version`.
- **Status:** Node ✅ (portable) · Docker ⛔ pending user. DB/migrate/auth/UI menunggu Docker.

---

<!-- Template:
## KODE-XX — Judul
- **Gejala:** · **Sebab:** · **Solusi:** · **Status:**
-->
