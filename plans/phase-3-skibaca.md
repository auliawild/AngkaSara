# Phase 3 — Port SKIBACA (literasi)

Belum dikerjakan. Prasyarat: Phase 1 & 2. Sumber port: `D:\LitNum\skibaca.html`
+ `D:\LitNum\assets\bacaan-tptup.js`.

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
