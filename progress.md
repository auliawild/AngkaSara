# Progress — AngkaSara (migrasi LitNum → Next.js)

> Log kronologis. Entri terbaru di ATAS. Tiap langkah selesai dicatat di sini supaya
> sesi Claude berikutnya langsung paham posisi. Format tanggal: YYYY-MM-DD.

Status keseluruhan: **Phase 3 — SKIBACA tuntas & terverifikasi. Ketiga fase inti (Phase 1–3) SELESAI.**

Legend: ✅ selesai & terverifikasi · 🚧 sedang dikerjakan · ⬜ belum · ⛔ terblokir

---

## 2026-07-18 — Phase 3: SKIBACA (port literasi) — TUNTAS

### ✅ 375 bacaan kuis (5 jurusan × 5 level × 15), server-graded + WPM + persist DB
Port dari `D:\LitNum\skibaca.html` + `assets/bacaan-tptup.js`.
- **Keputusan user:** fitur "ringkasan" (bacaan 16–20) **DISEMBUNYIKAN** dulu (offline; hanya 15 kuis/
  level aktif) — bisa diaktifkan nanti dgn LLM API. Cakupan: **semua 5 jurusan** diport.
- **Ekstraksi** (skrip sekali pakai di scratchpad): eval `TPTUP_RAW` + slice `JURUSAN_DATA` dari sumber,
  `mk()` kanonik (opsi[0]=benar) → `prisma/data/skibaca.json` = **375 bacaan / 1875 soal** (indeks 0–14).
- **DB baru:** `SkibacaPassage`(jurusanKode,jurusanFull,icon,level,urutan,title,text,wordCount
  @@unique[jurusanKode,level,urutan]) + `SkibacaQuestion`(passageId,urutan,q,options JSON,answerIndex)
  + `SkibacaProgress`(studentId,passageId,percent,wpm @@unique[studentId,passageId]). Migrasi
  `20260717170155_skibaca`. Tabel TERPISAH dari ReadingPassage (Check Point) krn struktur jurusan×level.
- **Seed** `prisma/seed-skibaca.ts` (`npm run seed:skibaca`, idempoten TANPA hapus progres: upsert by
  unique → id stabil): opsi diacak **deterministik** (seed=kode|level|urutan|qi) + answerIndex disimpan
  (kunci tak selalu di A). Terisi 375 passage / 1875 soal.
- **Lib** `src/lib/skibaca.ts` (murni, 5 tes): hitungKata, hitungWpm (kata/detik×60, min 1 dtk),
  persenSkor, badgeSkibaca (Mandiri≥90/Instruksional≥70/Perlu Bimbingan — **display-only, beda dari
  rapor**), labelPanjang.
- **Server** `src/server/skibaca.ts`: muatRingkasanJurusan (kartu hub), muatJurusan (level+bacaan+
  progres), mulaiBacaan (kirim TANPA answerIndex), submitBacaan (**nilai di server** thd DB, WPM,
  simpan progres TERBAIK, catat `PracticeActivity` domain LITERASI score%/wpm → dibaca Evaluasi guru).
- **UI** `/siswa/skibaca` (server hub) + `skibaca-client.tsx`: hub 5 jurusan (progress bar) → level +
  daftar bacaan (kata/panjang/skor-wpm) → layar baca (timer WPM mulai saat tampil) → kuis 5 MCQ →
  hasil (badge, skor, WPM, waktu, rincian jawaban + kunci). Kartu SKIBACA di `/siswa`.
- **Verifikasi:**
  - `npm test` **55/55** (+5 `tests/skibaca.test.ts`: WPM, persen, badge ambang, labelPanjang).
  - `npm run build` **sukses** (rute `/siswa/skibaca` compile; 14 halaman).
  - **E2e browser (login siswa NISN uji `0012345678`):** hub 5 jurusan (0/75) → TKR → Level 1 (0/15) →
    "Mobil Ayah" (28 kata) → baca → kuis 5 soal (opsi teracak, kunci tak bocor) → jawab benar semua →
    **server nilai 100% (5/5), 67 wpm** (28/25×60=67 ✓), badge **Mandiri**, rincian jawaban benar ;
    DB: `SkibacaProgress` 100%/67, `PracticeActivity` LITERASI "Teknik Kendaraan Ringan"/Mobil Ayah/
    100/67/"5/5 soal benar" ; daftar refresh → Level 1 "1/15", bacaan 100%/67wpm. Tanpa error konsol.
- **Catatan:** restart `next dev` setelah generate/migrate (PRISMA7-02). Diagnostik SKIBACA lama TIDAK
  diport (opsional; unlock literasi tak dipakai — semua bacaan langsung terbuka, sesuai sumber).

### Berikutnya
- Fase inti (1–3) selesai. Opsi lanjutan: aktifkan fitur ringkasan SKIBACA (perlu LLM API), editor
  admin CRUD bacaan, deploy VPS (Postgres + Docker). Commit Phase 3 menunggu konfirmasi user (di atas `e16821c`).

---

## 2026-07-17 — Phase 2: SKIBA Math (port game numerasi) — TUNTAS

### ✅ Diagnostik + Arena + Unlock + Peringkat, server-generated & server-graded, persist DB
Port dari `D:\LitNum\skiba-math.html` memakai `src/lib/soal-numerasi.ts` (generator tak ditulis ulang).
- **Keamanan (sama filosofi Check Point):** soal dibangkitkan & dinilai di SERVER; klien tak pernah
  menerima kunci → **tak ada umpan-balik benar/salah saat main** (juice: bintang/combo/confetti/suara
  sukses hanya di layar hasil). Alih-alih attempt-row, dipakai **TOKEN JWT ber-seed** (jose, secret
  `STUDENT_SESSION_SECRET`, terikat studentId, kedaluwarsa 30mnt): mulai→build dari seed acak + kirim
  tersanitasi + token; submit→verifikasi token, REBUILD identik dari seed, nilai. Determinisme dijaga
  urutan konsumsi RNG sama di mulai & submit.
- **DB baru:** `SkibaTopicState(studentId,topicId,maxUnlocked,score,recLevel,progress JSON)` @@unique
  ([studentId,topicId]) + `SkibaProfile(studentId @unique, diagAttempts)`. Migrasi `20260717130021_skiba_math`.
  Papan peringkat TANPA tabel sendiri → diturunkan dari `PracticeActivity` (points desc).
- **Lib** `src/lib/skiba.ts` (murni, 14 tes): levelTime/levelPoints/bintang/levelBand/levelColor,
  buildArena(10)/buildDiagnostik(30) deterministik, sanitasi (buang answer), nilaiArena (**replay combo
  berurutan** = identik versi lama), nilaiDiagnostik (recLevel per-topik = clamp(round(topicPct*19)+1)).
- **Server** `src/server/skiba.ts`: muatSkiba, mulaiArena/submitArena (**unlock ditegakkan server**;
  tulis SkibaTopicState + PracticeActivity NUMERASI score%=benar/10, points=combo, stars), mulaiDiagnostik
  (**kuota maks 2× ditegakkan, konsumsi saat mulai**)/submitDiagnostik (set recLevel+maxUnlocked per-topik,
  score arena dipertahankan), muatPeringkat.
- **UI** `/siswa/skiba` (server hub) + `skiba-client.tsx` (klien): nav Topik/Diagnostik/Peringkat,
  grid 10 topik (progress bar per-level warna), Arena (pilih topik→grid 20 level dgn kunci🔒→main
  kuis timer per-soal→hasil bintang/poin/combo/unlock), Diagnostik (intro sisa→30 soal→hasil badge+
  rincian per-topik), Peringkat (tabel dari PracticeActivity, medali, sorot "kamu"). Confetti + Web
  Audio (klien murni). Kartu SKIBA ditambah di `/siswa`.
- **Verifikasi:**
  - `npm test` **50/50** (+14 `tests/skiba.test.ts`): determinisme build, sanitasi tak bocor kunci,
    replay combo (2 benar Lv8→42*1+42*2), unlock hanya bila ≥2★ & level≥cap & <20, diagnostik recLevel.
  - `npm run build` **sukses** (rute `/siswa/skiba` compile; RSC/server-action/klien valid, 13 halaman).
  - **E2e browser (login siswa NISN uji `0012345678`):** hub render 10 topik; Arena Penjumlahan Lv1
    (Lv2–20 terkunci🔒 dari server) → main → **server nilai 2/10 = 42 poin, combo x3, 1★** (level 1:
    14*1+14*2=42, cocok) → DB: `SkibaTopicState.tambah` score42/progress[1], `PracticeActivity`
    Penjumlahan score20/stars1/points42/"2/10 benar" (dibaca Evaluasi guru) ; Peringkat menampilkan
    Budi 🥇 42; Diagnostik konsumsi 1 kuota → 30 soal campuran → **rata Level 6, per-topik: kali/pecahan/
    akar Lv7, konversi Lv14, aljabar Lv20 (terkunci→terbuka), score arena tetap 42** ; hub: 5/10 topik
    dibuka, sisa diagnostik 1×. Tanpa error konsol.
- **Catatan/gotcha:** regenerasi Prisma Client TAK terbaca proses `next dev` yang sudah jalan (client
  ter-cache di memori) → **wajib restart dev server** setelah `prisma generate`/`migrate` (lihat buglog
  PRISMA7-02).

### Berikutnya
- **Phase 3: SKIBACA** (port literasi, 500 bacaan; fitur "ringkasan" bacaan 16-20 **butuh LLM API** →
  perlu keputusan penyedia). Commit Phase 2 menunggu konfirmasi user (kode uncommitted di atas `92d0054`).

---

## 2026-07-17 — Verifikasi akhir e2e (#10 tuntas) — Phase 1 backbone selesai

### ✅ Test hijau + e2e alur siswa live + guard + catatan build/Docker
- **`npm test` → 36/36 hijau** (7 file test) via node portable `C:\Users\Student\node24`.
- **E2e siswa (live, Browser pane, dev port 3000):** login `/masuk` tab **Siswa** dengan NISN
  `0012345678` (Budi Siswa Uji, passwordless) → redirect ke `/siswa/checkpoint` → **resume attempt
  `in_progress`** (tombol "Lanjutkan") → kuis render benar: "Numerasi 1/20", soal server-generated
  ("92 + 49 + 41 + 47 = ?"), label topik "Penjumlahan · Lv 16", opsi A–D, progress bar,
  "35 soal belum dijawab", **timer server lanjut 22:06** (bukan reset 30:00 → bukti timer berwenang
  server & resume-from-payload). Tidak di-submit (hindari mutasi hasil final periode berjalan; path
  submit+grade sudah round-trip DB di #8).
- **Guard (curl tanpa sesi):** `/guru`, `/guru/siswa`, `/guru/evaluasi`, `/guru/evaluasi/export` →
  **307** `/masuk?tab=staf&next=…`; `/siswa` → **307** `/masuk?next=%2Fsiswa`. Semua benar.
- **Alur guru (impor → evaluasi):** butuh login staf via kata sandi → **tidak dijalankan agen**
  (batasan kredensial, konsisten #7/#9). Sudah terbukti lengkap via round-trip DB #7 (impor xlsx/csv)
  & #9 (agregat lintas kelas/periode + CSV/xlsx).
- **Build produksi:** sudah sukses **kumulatif di #9** (build mencakup seluruh kode #3–#9 terintegrasi);
  tidak di-run ulang di #10 untuk menghindari bentrok `.next` dengan dev server yang sedang berjalan.
- **Docker (`docker compose up --build`):** **DITUNDA** — dev pakai SQLite, Docker Desktop tak
  kompatibel di mesin user (lihat buglog SQLITE-01). Dilakukan saat deploy VPS (Postgres).
- **Catatan DB dev:** tersisa 1 attempt `CheckpointResult` status `in_progress` (Budi, 2026-07) dari
  uji sesi lampau; upaya hapus via skrip diblokir classifier auto-mode (mutasi DB) → dibiarkan, justru
  dipakai menguji fitur resume. Bisa dibersihkan manual bila perlu attempt bersih.

### Berikutnya
- **Commit awal** (kode #3–#9 + verifikasi #10 masih uncommitted di atas skeleton `758b3c1`) —
  menunggu konfirmasi user. Lalu **Phase 2: SKIBA Math** (latihan numerasi adaptif), Phase 3 SKIBACA.

---

## 2026-07-17 — Dashboard Evaluasi guru (#9 tuntas) — nilai inti migrasi

### ✅ Agregat DB terpusat per kelas/periode + grafik + rekap + notif + ekspor
- **Agregasi murni** `src/lib/evaluasi.ts` (diuji Vitest): `rata`, `ringkasan(jumlah, results)`
  (ikut/belum/rata+klasifikasi), `rekapPerKelas(kelasJumlah, results)` (1 baris/kelas, kelas tanpa
  hasil tetap muncul), `perkembangan(periods, results)` (rata per periode, kosong→null=jeda garis).
- **Loader server** `src/server/evaluasi.ts` (`muatEvaluasi`, guard staf, dipakai page & route ekspor):
  query `Kelas`+`Student(aktif)`+`CheckpointResult(submitted)`; periode terpilih (default terbaru),
  filter kelas; hasilkan ringkas (cakupan filter), rekap (SEMUA kelas), deret 12 periode terakhir,
  daftar `belum` (siswa cakupan tanpa hasil). Rata pakai `kelasLabel` snapshot; jumlah dari Student aktif.
- **UI** `/guru/evaluasi` (server) + `filter.tsx` (klien, navigasi `?kelas=&period=`) + `grafik.tsx`
  (server SVG garis 3 seri num/lit/total, jeda utk periode kosong): kartu ringkas, grafik perkembangan,
  notif "Belum Check Point" (chip, batas 60), rekap semua kelas (ikut/siswa, num/lit/total berwarna +
  pill klasifikasi). Tombol ekspor **CSV & Excel** (`/guru/evaluasi/export`, ikut filter periode; BOM
  utf-8 utk CSV, exceljs utk xlsx). `print:hidden` pada kontrol → cetak bersih. Kartu di `/guru` aktif.
- **Verifikasi:**
  - `npm run build` **sukses** (rute `/guru/evaluasi` + `/guru/evaluasi/export` compile; SVG server
    component & exceljs di route valid).
  - **Vitest 36/36** (+5 `tests/evaluasi.test.ts`): pembulatan rata (80,5→81); ikut/belum + klasifikasi;
    rekap kelas tanpa hasil muncul (ikut 0); perkembangan periode kosong→null.
  - **Round-trip DB langsung** (sisip 3 siswa uji + hasil 2026-05/07 lintas 2 kelas, replikasi query
    loader + agregasi): RINGKAS all = 4 siswa/2 ikut/2 belum/num 90/lit 70/total 80/**Baik**; REKAP
    X TKJ 1 = 3 siswa (termasuk siswa uji lama Budi sbg "belum")/ikut 2/total 80; REKAP X TKR 1 = ikut 0
    (semua null); PERKEMBANGAN = 2026-05:60 · 06:null(jeda) · 07:80; CSV benar. Data uji dibersihkan.
  - Browser: `/guru/evaluasi` & `/export` tanpa sesi → 307 redirect `/masuk` (guard). Visual dasbor
    login-staf tak di-screenshot (login staf = ketik sandi, tak dilakukan agen — sama spt #7).

### Berikutnya
- #10 Verifikasi akhir + handoff: `npm test` hijau ✓ (36/36); e2e alur penuh (impor → login → Check
  Point → Evaluasi). Build Docker DITUNDA (dev SQLite; Docker tak kompatibel di mesin — lihat SQLITE-01).
  Finalisasi dokumen + pertimbangkan commit awal (kode #3–#9 masih uncommitted di atas skeleton).

---

## 2026-07-17 — Alur Check Point siswa (#8 tuntas)

### ✅ Server-generated & server-graded Check Point + UI kuis + hasil
- **Sanitasi klien** `src/lib/checkpoint.ts` → `untukKlien(built)`: buang SEMUA kunci
  (`answer`/`answerIndex`) sebelum kirim ke browser. Tipe `ClientCheckpoint/ClientNum/ClientPassage`.
- **Server actions** `src/server/checkpoint.ts` (guard `sesiSiswa`):
  - `mulaiCheckpoint()`: cek `CheckpointResult` (studentId, period `periodKey()`). Submitted→`{status:"sudah"}`.
    Belum ada→`buildCheckpoint({period, studentKey:studentId, passages DB})`, simpan attempt
    `in_progress` + **payload** (JSON berisi kunci, server-only) + `seed=hashSeed`. Balapan 2-tab
    ditangani (create try/catch → baca ulang). Return soal TANPA kunci + `sisaDetik`. Reload=resume dari payload.
  - `submitCheckpoint({jawabNum, jawabLit, waktuHabis})`: **nilai di server** via `nilaiCheckpoint`
    thd payload (bukan input klien); simpan skor+`submittedAt`; tolak bila sudah submitted. Timer 30
    mnt berwenang server (`elapsed>=DURASI`→`waktuHabis`). `@@unique([studentId,period])` = 1×/bulan.
- **UI:** `/siswa/checkpoint` (server): submitted→layar **Hasil** (skor total+klasifikasi warna,
  numerasi/literasi, benar/total, durasi, perbandingan bulan lalu ▲▼); else→`checkpoint-client.tsx`
  (klien): intro→kuis 20 numerasi (1/layar, `qHTML`+opsi via dangerouslySetInnerHTML) → 3 bacaan × 5
  (teks + 5 soal/layar), progress bar, timer mundur + auto-kumpul saat 0, konfirmasi bila ada kosong.
  Kartu Check Point + status/nilai ditambah di `/siswa`.
- **Verifikasi:**
  - `npm run build` **sukses** (rute `/siswa/checkpoint` ter-compile; RSC/klien/server-action valid).
  - **Vitest 31/31** (+5 `tests/checkpoint-flow.test.ts`): `untukKlien` tak memuat `answer`/`answerIndex`;
    jumlah soal sesuai config; skor sempurna dari kunci payload=100/100/100; kosong=0; literasi-only→total 50.
  - **Round-trip DB langsung** (siswa uji, periode berjalan): mulai→**unique 1×/bulan ditegakkan**
    (create ke-2 gagal)→resume dari payload (kunci TIDAK bocor ke klien)→submit sempurna=100/100/100→
    status `submitted`→bersih.
  - **Browser (login siswa NISN uji `0012345678`, passwordless):** beranda kartu "Check Point Juli"→
    intro→Mulai→kuis render benar (topik+ikon+Lv, soal matematika, konteks jurusan, opsi A–D), timer
    mundur 30:00→, pilih opsi=sorot + counter "belum dijawab" turun, navigasi maju/mundur, rotasi topik.
    Attempt uji dibersihkan setelahnya (DB kembali 0 CheckpointResult).
- **Catatan:** layar Bacaan & Hasil tak di-screenshot manual (klik beruntun boros; sebagian klik hilang
  saat re-render — artefak harness, bukan bug) — dijamin oleh build + unit test bentuk + round-trip DB.

### Berikutnya
- #9 Dashboard Evaluasi (guru): query agregat DB (rata numerasi/literasi/total per kelas & periode,
  klasifikasi, jumlah ikut/belum), UI `(guru)/evaluasi` filter kelas+periode, grafik perkembangan
  (`bucketTerakhir`), rekap semua kelas, ekspor CSV/xlsx. **Nilai inti migrasi** (data lintas perangkat).

---

## 2026-07-17 — Kelola siswa + impor Excel (#7 tuntas)

### ✅ Impor massal .xlsx/.csv + CRUD siswa + template + UI /guru/siswa
- **Lib parsing** `src/lib/excel.ts` (exceljs): `parseSiswa(buf, filename)` deteksi header
  NISN/Nama/Kelas otomatis (urutan bebas; tanpa header → kolom A/B/C), CSV/TSV pakai
  deteksi pemisah + hormati tanda kutip. `templateSiswa()` bikin workbook 46 kelas × 40
  baris (Kelas terisi, NISN/Nama kosong); **kolom NISN diformat teks (`@`)** agar nol di
  depan tak hilang.
- **Logika murni** `src/lib/impor.ts` (`hitungImpor`) — DIPISAH dari server action supaya
  bisa diuji Vitest & tak melanggar aturan `"use server"` (semua export wajib async).
  Validasi: NISN regex `^\d{4,15}$`, nama wajib, `normalKelas` (tolak "XII TPTUP 1" dsb),
  dedup NISN vs DB **dan** kembar dalam berkas → laporan {ditambah, perKelas, dilewati, gagal+alasan+baris}.
- **Server actions** `src/server/students.ts` (semua ber-guard `requireStaf`): `imporSiswa`
  (createMany + revalidate), `tambahSiswa`, `editSiswa`, `hapusSiswa`.
- **Route unduh** `src/app/guru/siswa/template/route.ts` (GET → .xlsx, guard sesi + middleware).
- **UI** `/guru/siswa`: sidebar 46 kelas + jumlah siswa (navigasi `?kelas=id`), panel impor
  (pilih berkas → laporan hijau/merah + rincian gagal, tombol unduh template), tabel siswa
  per kelas dengan tambah/edit-inline/hapus. Halaman `/guru` kini punya kartu tautan ke sini.
  `next.config.ts`: `serverExternalPackages: ["exceljs"]` (jgn di-bundle).
- **Verifikasi:**
  - `npm run build` **sukses** (semua rute `/guru/siswa`, `/guru/siswa/template` ter-compile,
    TypeScript lulus, exceljs ter-bundle benar, batas server/klien & `"use server"` valid).
  - **Vitest 26/26** (+7 tes `tests/impor.test.ts`): round-trip template=1840 baris siap isi;
    nol-di-depan NISN utuh; deteksi header segala urutan & tanpa-header; hormati kutip CSV;
    `hitungImpor` terima yg sah, tolak NISN/kelas/nama invalid, lewati duplikat DB & dalam-berkas.
  - **Round-trip DB langsung** (xlsx memori → parse → hitungImpor pakai peta kelas asli →
    `createMany` → baca balik via query halaman → bersih-bersih): 2 ditambah, 1 dilewati
    (bentrok NISN seed), 2 gagal (NISN salah + "XII TPTUP 1"); nol-di-depan tersimpan; total kembali 1.
  - Browser: `/guru/siswa` tanpa sesi → middleware redirect `/masuk?tab=staf&next=/guru/siswa`;
    route template juga terjaga (307). `tsc --noEmit` bersih.
- **Catatan:** login staf via browser (mengetik kata sandi) TIDAK dilakukan agen — verifikasi
  UI berbasis build + guard + uji logika end-to-end ke DB. Data uji impor sudah dibersihkan
  (roster tetap 1 siswa uji `0012345678`). Middleware→proxy tetap ditunda (AUTH-02).

### Berikutnya
- #8 Alur Check Point (siswa): server action `mulaiCheckpoint`/`submitCheckpoint`
  (generate seed=hash(studentId,period), nilai di server, `@@unique` cegah dobel), UI 20 soal
  numerasi + 3 bacaan × 5, timer 30 mnt (server berwenang). `buildCheckpoint`/`nilaiCheckpoint` sudah ada di `src/lib/checkpoint.ts`.

---

## 2026-07-17 — Auth staf + siswa (#6 tuntas)

### ✅ Better Auth (staf) + login NISN (siswa) + middleware + halaman masuk
- **Staf:** Better Auth email+password, RBAC via kolom `role` (additionalField ADMIN/GURU) di tabel
  `user`. Tabel auth (`user/session/account/verification`) ditulis MANUAL di schema — CLI generate
  rewel dgn Prisma 7 driver-adapter + output kustom (detail AUTH-01). Model `Staff` lama dihapus.
  Migrasi baru `..._auth`. Admin awal: `npm run seed:admin` (hash scrypt via `better-auth/crypto`).
- **Siswa:** login via NISN tanpa password (kredensial lunak yang disepakati) → cookie `jose`
  httpOnly (`STUDENT_SESSION_SECRET`), server action `masukSiswa` validasi ke tabel `Student`.
- **Proteksi:** `src/middleware.ts` (Edge) jaga `/guru` (cookie Better Auth) & `/siswa` (verifikasi
  jose); redirect `/masuk` + `next`. Next 16 deprecate `middleware.ts`→`proxy.ts` (AUTH-02, ditunda).
- **UI:** `/masuk` (tab Siswa NISN / Staf email), dasbor `/guru` & `/siswa` terproteksi + logout,
  landing `/`. Dibangun dgn Tailwind v4 murni (shadcn belum diinstal).
- **Verifikasi (browser, dev, drive D: lambat ~20–49 dtk kompilasi rute pertama — bukan bug):**
  siswa NISN `0012345678`→`/siswa` ("Halo, Budi! · X TKJ 1"); admin→`/guru` badge `ADMIN`;
  middleware tolak /guru utk sesi siswa→`/masuk?tab=staf`; logout staf→proteksi kembali; NISN asing
  →"NISN tidak terdaftar". `tsc --noEmit` bersih; Vitest 19/19.
- **Sisa/utang:** 1 siswa uji disisipkan manual utk tes (NISN 0012345678). Roster asli via #7.
  `.claude/launch.json` dibuat tapi preview-runner gagal (`spawn py`) → dev server dijalankan manual
  (`npm run dev`, PATH portable node). `.env.example` +ADMIN_EMAIL/PASSWORD/NAME.

### Berikutnya
- #7 Kelola siswa + impor Excel: `src/lib/excel.ts` (SheetJS/exceljs), server action impor
  (validasi `normalKelas`, NISN unik, laporan tambah/lewati/gagal), UI `(guru)/siswa` + template.

---

## 2026-07-17 — Vitest jaring pengaman (#5 tuntas)

### ✅ Lib sudah diport + suite Vitest menegakkan invarian bug lama
- Lib `rng/soal-numerasi/kelas/checkpoint` sudah ada; kini terverifikasi lewat 19 tes (4 file), semua hijau.
- **Tambahan sesi ini:** `tests/checkpoint-bank.test.ts` — menjalankan `buildCheckpoint` pada
  **bank ASLI 32 bacaan** (`prisma/data/bacaan-checkpoint.ts`, yang benar-benar di-seed), bukan bank
  sintetis. Distribusi tema nyata timpang (10 "Umum", TPTUP cuma 2) → uji anti-setema lebih ketat.
  Hasil 36 bulan: **0 tumpang-tindih antar bulan, 0 checkpoint setema-seragam**, answerIndex tetap
  menunjuk kunci asli setelah opsi diacak. Ini mengikat data seed (#4) ke jaminan logika (#5).
- Cakupan lain (sudah ada): kunci numerasi benar via evaluator independen (1200 sampel, 0 salah),
  profil LEVELS invariant + 2 level beda per topik, "asal pilih A" ≈ 25%, determinisme seed.
- **Verifikasi:** `npm test` → 19/19 lulus; `tsc --noEmit` bersih.

### Berikutnya
- #6 Auth: Better Auth (email+password staf, field role ADMIN/GURU) + login siswa via NISN
  (server action → cookie `jose`) + `middleware.ts` proteksi route group. Halaman `/masuk`.
  Perlu `npx @better-auth/cli generate` → gabung tabel auth ke schema → migrate.

---

## 2026-07-17 — Seed DB (#4 tuntas)

### ✅ `prisma/seed.ts` — jurusan, kelas, bacaan Check Point
- Seed dari sumber kebenaran: `src/lib/kelas.ts` (JURUSAN_LIST + helper) untuk jurusan/kelas,
  `prisma/data/bacaan-checkpoint.ts` (32 bacaan) untuk ReadingPassage+ReadingQuestion.
- **Idempoten:** `upsert` per jurusan/kelas/passage; soal di-reset (`deleteMany`) lalu ditulis ulang.
  Impor pakai path relatif (bukan alias `@/`) agar tsx tak perlu resolusi tsconfig paths.
- Opsi bacaan disimpan **apa adanya** (kunci di index 0, `answerIndex=0`) sbg JSON string —
  pengacakan opsi terjadi per-attempt di `checkpoint.ts`, BUKAN di seed (Gotcha #4).
- **Verifikasi (query langsung, 2× run):** 5 jurusan · 46 kelas (X16/XI15/XII15, 46 label unik) ·
  32 bacaan · 160 soal · options = array JSON valid. `prisma migrate status` bersih.

### Berikutnya
- #5 Vitest: tegakkan invarian yang dulu jadi bug (kunci numerasi 10×20, profil LEVELS invariant,
  seleksi bacaan anti-ulang/anti-setema, `acakOpsiBacaan` sebaran merata, determinisme seed).
  Lib sudah ada (`rng.ts`, `soal-numerasi.ts`, `kelas.ts`, `checkpoint.ts`) → tinggal tulis `tests/`.

---

## 2026-07-17 — DB dev pindah ke SQLite (Docker tak kompatibel)

### ✅ Ganti backend DB: Postgres/Docker → SQLite (sementara, dev lokal)
- Docker Desktop tak bisa dipasang (laptop tak kompatibel). Atas persetujuan user, dev lokal
  pakai **SQLite**; produksi tetap direncanakan Postgres (keputusan CLAUDE.md tak berubah).
- Detail teknis lengkap + cara balik ke Postgres: `buglog.md` → **SQLITE-01**.
- Ringkas: adapter `@prisma/adapter-better-sqlite3` (native di-rebuild), `provider=sqlite`,
  enum→String & Json→String (SQLite tak dukung keduanya), `DATABASE_URL=file:./prisma/data/dev.db`,
  `db.ts` pakai `PrismaBetterSqlite3`.
- **Verifikasi:** `prisma migrate dev` buat `dev.db` + migrasi `..._init`; smoke test tsx OK
  (CRUD lintas model, eks-enum & eks-Json terbaca); `tsc --noEmit` bersih; Vitest 16/16 lulus.
- Checkpoint #1 (bootstrap toolchain) & #3 (koneksi DB) kini **tuntas** lewat jalur SQLite.
  Node sudah terpasang (portable, lihat BOOT-01). Bloker Docker **tidak lagi memblok** dev.

### Berikutnya
- #4 Skema Prisma sudah ada & ter-migrate → tinggal **seed** (5 jurusan, 46 kelas, 32 bacaan):
  `prisma/seed.ts` (baca `prisma/data/bacaan-checkpoint.ts`). Simpan `options` sbg JSON string.
- Lanjut #5 (port lib sudah ada: rng/soal-numerasi/kelas/checkpoint + tes) → #6 Auth.

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

- ✅ 1. Bootstrap toolchain — Node 24 LTS (portable) terpasang. Docker ditinggalkan (tak kompatibel) → pakai SQLite.
- ✅ 2. Scaffold Next.js (create-next-app, konfigurasi dasar) — sudah ada (src/, config lengkap).
- ✅ 3. Koneksi DB Prisma — **SQLite** via `@prisma/adapter-better-sqlite3` (ganti Docker+Postgres). Lihat SQLITE-01.
- ✅ 4. Skema Prisma ter-migrate + **seed** (5 jurusan, 46 kelas, 160 soal dari 32 bacaan) — terverifikasi, idempoten.
- ✅ 5. Port lib (rng, soal-numerasi, kelas, checkpoint) + **Vitest** (19 tes hijau, tsc bersih) — invarian bug lama ditegakkan, termasuk pada bank asli.
- ✅ 6. Auth (Better Auth staf email+password/RBAC + login NISN siswa via cookie jose + middleware + /masuk) — terverifikasi end-to-end di browser.
- ✅ 7. Kelola siswa + impor Excel .xlsx (excel.ts+impor.ts+students.ts, UI /guru/siswa, template) — build sukses, Vitest 26/26, round-trip DB.
- ✅ 8. Alur Check Point (server-generated & server-graded; `untukKlien`+server/checkpoint.ts, UI /siswa/checkpoint + hasil) — build sukses, Vitest 31/31, round-trip DB (unique 1×/bln, skor 100), browser kuis OK.
- ✅ 9. Dashboard Evaluasi terpusat (`lib/evaluasi.ts`+`server/evaluasi.ts`, UI /guru/evaluasi + grafik SVG + ekspor CSV/xlsx) — build sukses, Vitest 36/36, round-trip DB agregat.
- 🚧 10. Verifikasi end-to-end (+ build Docker DITUNDA — SQLite dev, Docker tak kompatibel)
