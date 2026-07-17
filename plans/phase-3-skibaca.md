# Phase 3 — Port SKIBACA (literasi)

✅ **TUNTAS 2026-07-18** (detail di progress.md). Ringkas: 375 bacaan kuis (5 jurusan × 5 level × 15,
ringkasan disembunyikan atas keputusan user) diekstrak → `prisma/data/skibaca.json`, di-seed
(`npm run seed:skibaca`) ke tabel baru `SkibacaPassage/Question/Progress` (migrasi `20260717170155_skibaca`).
Lib `src/lib/skibaca.ts` (5 tes), server `src/server/skibaca.ts` (server-graded, WPM, progres terbaik,
PracticeActivity LITERASI), UI `/siswa/skibaca` (hub jurusan→level→bacaan→baca+timer→kuis→hasil badge/WPM).
Verifikasi: test 55/55, build sukses, e2e siswa (baca→kuis 100%/67wpm→persist→muncul di progres & Evaluasi).
Fitur **ringkasan (16–20) BELUM diaktifkan** — perlu LLM API (opsi a/b/c di bawah masih relevan).

Sumber port: `D:\LitNum\skibaca.html` + `D:\LitNum\assets\bacaan-tptup.js`.

## Volume konten (besar — kerjakan bertahap per jurusan)
- **5 jurusan** (TKR, TSM, TKJ, Kuliner, TPTUP), masing-masing **5 level × 20 bacaan = 100** →
  **500 bacaan** total (400 inline di skibaca.html + 100 TPTUP di `bacaan-tptup.js`).
- Format sumber: `mk(title, text, questions)`; bacaan index 0-14 tipe `quiz`, 15-19 tipe `ringkasan`.
- Simpan ke `ReadingPassage`/`ReadingQuestion` (source=SKIBACA) + tabel level/jurusan skibaca.

## Fitur yang diport
- Pilih jurusan → level → bacaan; baca → kuis pemahaman; hitung **WPM** (kata/detik×60).
- Progress per level per bacaan (dulu `state.progress` in-memory) → **persist ke DB**.
- Pelaporan hasil → **PracticeActivity** (domain LITERASI) via server action.

## ⚠️ Keputusan tertunda — fitur "ringkasan" (bacaan 16-20)
- Dulu dinilai AI lewat `fetch("https://api.anthropic.com/v1/messages")` **tanpa API key** →
  tak pernah jalan. Perlu keputusan user:
  - (a) sediakan LLM API key (server-side, aman) untuk menilai ringkasan, atau
  - (b) ganti penilaian otomatis berbasis kata-kunci (offline), atau
  - (c) sembunyikan tipe "ringkasan" (hanya 15 bacaan quiz/level yang aktif).

## Catatan
- Volume 500 bacaan → seed bertahap; pertimbangkan editor admin (CRUD bacaan) memakai tabel yang sama dgn Check Point.
- Klasifikasi badge internal skibaca (Mandiri/Instruksional) beda dari klasifikasi rapor — jaga terpisah (display-only).
