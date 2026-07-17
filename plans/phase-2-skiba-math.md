# Phase 2 — Port SKIBA Math (numerasi game)

✅ **TUNTAS 2026-07-17** (detail di progress.md). Ringkas hasil: DB `SkibaTopicState`+`SkibaProfile`
(migrasi `20260717130021_skiba_math`); lib murni `src/lib/skiba.ts` (14 tes); server actions
`src/server/skiba.ts` (server-generated & server-graded via TOKEN JWT ber-seed, unlock & kuota
diagnostik ditegakkan server); UI `/siswa/skiba` (hub+arena+diagnostik+peringkat) + kartu di `/siswa`.
Papan peringkat diturunkan dari `PracticeActivity` (bukan tabel sendiri). Verifikasi: test 50/50,
build sukses, e2e siswa penuh (arena→grade→persist→leaderboard; diagnostik→recLevel per-topik→unlock;
lintas perangkat karena state di DB). Confetti+Web Audio klien.

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
