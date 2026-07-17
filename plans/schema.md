# Skema Database & Kontrak Data — AngkaSara

Sumber kebenaran skema. Diturunkan dari rekonesans `D:\LitNum` (localStorage lama) +
keputusan arsitektur. DB = **PostgreSQL**, ORM = **Prisma 7**.

## Prinsip

1. **NISN = kunci identitas siswa** (unik). Menggantikan pola lama "nama + string kelas"
   yang rapuh (tak unik, mudah tabrakan).
2. **`kelasLabel` didenormalisasi** ke tiap record aktivitas/checkpoint (snapshot saat
   kejadian), supaya rekap per-kelas tetap benar meski siswa naik kelas / pindah rombel.
   Meniru perilaku lama yang menyimpan `kelas` di tiap record `litnum_riwayat`/`litnum_ujian`.
3. **Soal numerasi dibangkitkan, bukan disimpan.** Hanya **bacaan** yang konten tersimpan.
4. **Integritas di server:** Check Point dibangkitkan & dinilai server; kunci 1x/bulan
   dipaksa lewat `@@unique([studentId, period])`.

## Peta migrasi dari localStorage lama

| localStorage lama (`D:\LitNum`) | Tabel baru |
|---|---|
| `litnum_identitas` `{nama, kelas}` | tidak dimigrasi (jadi sesi login, bukan tabel) |
| `litnum_siswa` `[{nama, kelas}]` | **Student** (diimpor via Excel, +NISN) |
| `litnum_riwayat` `[{domain,name,kelas,category,level,activity,score,wpm?,stars?,points?,detail,ts}]` | **PracticeActivity** |
| `litnum_ujian` `[{name,kelas,period,numerasi,literasi,total,benarNum,totalNum,benarLit,totalLit,durasiDetik,waktuHabis,ts}]` | **CheckpointResult** |
| `assets/soal-literasi.js` `BACAAN` (32 bacaan) | **ReadingPassage** + **ReadingQuestion** (di-seed) |
| `ls_skiba_*` (topic_state, leaderboard) | Phase 2 (tabel SKIBA Math, belum dirancang) |

## Prisma schema (draf final — tulis ke `prisma/schema.prisma`)

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum Tingkat { X  XI  XII }
enum Domain  { NUMERASI  LITERASI }
enum Role    { ADMIN  GURU }
enum PassageSource { CHECKPOINT  SKIBACA }

model Jurusan {
  id     String  @id @default(cuid())
  kode   String  @unique          // TKR, TSM, TKJ, Kuliner, TPTUP
  nama   String
  icon   String
  urutan Int      @default(0)      // urut tampil
  kelas  Kelas[]
}

model Kelas {
  id        String   @id @default(cuid())
  tingkat   Tingkat
  jurusan   Jurusan  @relation(fields: [jurusanId], references: [id])
  jurusanId String
  rombel    Int
  label     String   @unique       // "XI TKJ 2" — hasil namaKelas(tingkat,kode,rombel)
  students  Student[]
  @@unique([tingkat, jurusanId, rombel])
}

model Student {
  id        String   @id @default(cuid())
  nisn      String   @unique
  nama      String
  kelas     Kelas    @relation(fields: [kelasId], references: [id])
  kelasId   String
  aktif     Boolean  @default(true)
  createdAt DateTime @default(now())
  activities  PracticeActivity[]
  checkpoints CheckpointResult[]
  @@index([kelasId])
}

// Staf (guru/admin). Password & sesi dikelola tabel Better Auth (user/account/session).
// Kaitkan Staff.authUserId ke user Better Auth, atau taruh role di user Better Auth langsung.
model Staff {
  id         String @id @default(cuid())
  email      String @unique
  nama       String
  role       Role   @default(GURU)
  authUserId String? @unique
  createdAt  DateTime @default(now())
}

model PracticeActivity {            // = litnum_riwayat
  id         String   @id @default(cuid())
  student    Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  studentId  String
  kelasLabel String                 // snapshot
  domain     Domain
  category   String                 // topik numerasi / jurusan literasi
  level      String
  activity   String
  score      Int                    // 0..100
  wpm        Int?
  stars      Int?
  points     Int?
  detail     String?
  createdAt  DateTime @default(now())
  @@index([studentId, createdAt])
  @@index([kelasLabel, createdAt])
}

model CheckpointResult {            // = litnum_ujian (1 per siswa per periode)
  id          String   @id @default(cuid())
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  studentId   String
  kelasLabel  String                // snapshot
  period      String                // "YYYY-MM"
  seed        Int                   // seed deterministik pembangun attempt
  numerasi    Int                   // 0..100
  literasi    Int
  total       Int                   // round((numerasi+literasi)/2)
  benarNum    Int
  totalNum    Int                   // 20
  benarLit    Int
  totalLit    Int                   // 15 (3 bacaan x 5)
  durasiDetik Int
  waktuHabis  Boolean  @default(false)
  payload     Json?                 // soal yang dibangkitkan + jawaban siswa (utk review/audit)
  status      String   @default("submitted")   // in_progress | submitted
  startedAt   DateTime @default(now())
  submittedAt DateTime?
  @@unique([studentId, period])     // kunci 1x/bulan
  @@index([kelasLabel, period])
}

model ReadingPassage {              // bank bacaan Check Point (32) — dari soal-literasi.js
  id        String   @id @default(cuid())
  kode      String   @unique        // "tkr-rem"
  tema      String                  // "Teknik Kendaraan Ringan (TKR)"
  title     String
  text      String
  source    PassageSource @default(CHECKPOINT)
  aktif     Boolean  @default(true)
  questions ReadingQuestion[]
}

model ReadingQuestion {
  id          String @id @default(cuid())
  passage     ReadingPassage @relation(fields: [passageId], references: [id], onDelete: Cascade)
  passageId   String
  urutan      Int
  q           String
  options     Json                  // string[4] — urutan kanonik dari bank
  answerIndex Int                   // index kunci di `options` (bank mentah = 0)
  @@index([passageId])
}
```

Better Auth menambah tabelnya sendiri (`user`, `account`, `session`, `verification`) —
dihasilkan lewat `npx @better-auth/cli generate` lalu digabung ke migrasi Prisma.

## Kontrak scoring (WAJIB dijaga saat port — jangan diubah diam-diam)

- **Numerasi**: perbandingan `String(jawabanSiswa) === String(q.answer)`. `answer` numerik
  diformat `fmtNum` (koma desimal Indonesia, mis. `"2,41"`), pecahan sebagai `"n/d"`.
  → **value opsi harus tetap string kanonik `fmtNum`/`"n/d"`**, jangan number mentah.
- **Literasi**: perbandingan index `jawaban === answerIndex` setelah opsi diacak per attempt.
- `numerasi = round(benarNum/totalNum*100)`, `literasi = round(benarLit/totalLit*100)`,
  `total = round((numerasi+literasi)/2)` (rata sederhana, tak berbobot).
- **Klasifikasi** (dipakai konsisten di Check Point & Evaluasi):
  `≥90 Mahir (🌳)` · `≥75 Baik (🌿)` · `≥60 Cukup (🌱)` · `else Perlu Bimbingan (🔴)`.

## Config kelas (di-seed dari `src/lib/kelas.ts`, port `assets/kelas.js`)

Rombel per jurusan per tingkat (total **46 kelas**: X=16, XI=15, XII=15):

| kode | nama | icon | X | XI | XII |
|---|---|---|---|---|---|
| TKR | Teknik Kendaraan Ringan | 🚗 | 5 | 5 | 5 |
| TSM | Teknik Sepeda Motor | 🏍️ | 3 | 3 | 3 |
| TKJ | Teknik Komputer & Jaringan | 💻 | 5 | 5 | 5 |
| Kuliner | Kuliner | 🍳 | 2 | 2 | 2 |
| TPTUP | Teknik Pemanasan, Tata Udara & Pendinginan | ❄️ | 1 | 0 | 0 |

`label` = `namaKelas(tingkat, kode, rombel)` → `"XI TKJ 2"` (rombel 0 = jurusan tak ada di tingkat itu).

## Peningkatan lanjutan (bukan Phase 1)
- **Enrollment** `(studentId, kelasId, tahunAjaran)` untuk riwayat kelas per tahun (kenaikan kelas).
  Phase 1 cukup `Student.kelasId` (kelas berjalan) + re-impor tiap tahun ajaran.
- **SchoolYear / semester** untuk penjadwalan Check Point.
