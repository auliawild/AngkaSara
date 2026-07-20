/**
 * Seed AngkaSara — 5 Jurusan, 46 Kelas, 32 bacaan Check Point (x5 soal).
 * Jalankan: `npm run seed` (tsx). Idempoten: aman diulang (upsert + reset soal).
 *
 * Sumber kebenaran config kelas: src/lib/kelas.ts (JURUSAN_LIST, 46 kelas).
 * Bank bacaan: prisma/data/bacaan-checkpoint.ts (kunci SELALU di options[0];
 * pengacakan opsi terjadi per-attempt di checkpoint.ts, BUKAN di sini).
 *
 * Impor pakai path relatif (bukan alias @/) supaya tsx tak perlu resolusi paths.
 */
import { JURUSAN_LIST, TINGKAT, rombelUntuk, namaKelas } from "../src/lib/kelas";
import { BACAAN_CHECKPOINT } from "./data/bacaan-checkpoint";
import { prisma } from "./seed-client";

async function main() {
  // 1) Jurusan (5) — urutan ikut posisi di JURUSAN_LIST.
  for (let i = 0; i < JURUSAN_LIST.length; i++) {
    const j = JURUSAN_LIST[i];
    await prisma.jurusan.upsert({
      where: { kode: j.kode },
      update: { nama: j.nama, icon: j.icon, urutan: i },
      create: { kode: j.kode, nama: j.nama, icon: j.icon, urutan: i },
    });
  }

  // 2) Kelas (46) — X 16 + XI 15 + XII 15, dari helper kelas.ts.
  const jurusanRows = await prisma.jurusan.findMany();
  const idByKode = new Map(jurusanRows.map((j) => [j.kode, j.id]));
  let kelasCount = 0;
  for (const t of TINGKAT) {
    for (const j of JURUSAN_LIST) {
      for (const r of rombelUntuk(j.kode, t)) {
        const label = namaKelas(t, j.kode, r);
        await prisma.kelas.upsert({
          where: { label },
          update: { tingkat: t, jurusanId: idByKode.get(j.kode) as string, rombel: Number(r) },
          create: { tingkat: t, jurusanId: idByKode.get(j.kode) as string, rombel: Number(r), label },
        });
        kelasCount++;
      }
    }
  }

  // 3) Bacaan (32) + soal (5 each). Simpan options apa adanya (kunci di index 0);
  //    answerIndex = q.answer. Reset soal tiap passage supaya idempoten.
  let passageCount = 0;
  let questionCount = 0;
  for (const b of BACAAN_CHECKPOINT) {
    const passage = await prisma.readingPassage.upsert({
      where: { kode: b.id },
      update: { tema: b.jurusan, title: b.title, text: b.text, source: "CHECKPOINT", aktif: true },
      create: { kode: b.id, tema: b.jurusan, title: b.title, text: b.text, source: "CHECKPOINT" },
    });
    await prisma.readingQuestion.deleteMany({ where: { passageId: passage.id } });
    for (let i = 0; i < b.questions.length; i++) {
      const q = b.questions[i];
      await prisma.readingQuestion.create({
        data: {
          passageId: passage.id,
          urutan: i + 1,
          q: q.q,
          options: JSON.stringify(q.options),
          answerIndex: q.answer,
        },
      });
      questionCount++;
    }
    passageCount++;
  }

  console.log(
    `Seed selesai: ${JURUSAN_LIST.length} jurusan, ${kelasCount} kelas, ` +
      `${passageCount} bacaan, ${questionCount} soal.`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
