# Phase 2 — Port SKIBA Math (numerasi game)

Belum dikerjakan. Prasyarat: Phase 1 selesai (lib `soal-numerasi.ts` sudah ada & teruji).
Sumber port: `D:\LitNum\skiba-math.html`.

## Fitur yang diport
- **Arena game**: 10 topik, level 1-20, 10 soal/arena, skor + bintang.
- **Tes diagnostik**: menentukan level rekomendasi awal per topik.
- **Unlock topik/level** (`skiba_topic_state`: `{maxUnlocked, progress, score, recLevel, diagAttempts}`) → **persist ke DB per siswa** (lintas perangkat, bukan localStorage lagi).
- **Papan peringkat** (`skiba_leaderboard`) → tabel DB, query terurut.
- Confetti, sound (Web Audio) — komponen klien.

## Kerja utama
- Pakai `src/lib/soal-numerasi.ts` (sudah ada) — jangan tulis ulang generator.
- Tabel baru (rancang saat Phase 2): `SkibaTopicState(studentId, topicId, maxUnlocked, score, recLevel, diagAttempts)`, `Leaderboard`/query dari PracticeActivity.
- Aktifkan pelaporan hasil → **PracticeActivity** (domain NUMERASI) via server action (pengganti `reportLitNum`).
- Skor arena = `round(benar/10*100)`.

## Catatan
- `window.storage` shim lama (`ls_*`) tak dipakai lagi — ganti server persistence.
- Verifikasi: unlock/leaderboard bertahan lintas perangkat (login siswa berbeda device → state sama).
