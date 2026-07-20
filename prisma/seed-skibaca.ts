/**
 * Seed SKIBACA — 500 bacaan (5 jurusan × 5 level × 20) dari prisma/data/skibaca.json:
 * urutan 1..15 = tipe "kuis" (5 MCQ, server-graded), urutan 16..20 = tipe "ringkasan"
 * (siswa menulis parafrase, guru menilai manual). Soal 16..20 tetap di-seed sebagai POIN KUNCI
 * untuk membantu guru menilai (tak ditampilkan ke siswa).
 * Jalankan: `npm run seed:skibaca` (tsx). Idempoten TANPA menghapus progres siswa:
 * passage di-UPSERT by @@unique([jurusanKode,level,urutan]) → id stabil (FK progres aman);
 * soal diganti (deleteMany+create) tiap run.
 *
 * Opsi diacak DETERMINISTIK di sini (seed = jurusan|level|urutan|qi) lalu answerIndex disimpan,
 * sehingga jawaban benar tak selalu di posisi A namun tetap reproducible.
 * Sumber JSON: opsi[0] hasil ekstraksi = { q, benar, salah[3] }.
 */
import { readFileSync } from "node:fs";
import { prisma } from "./seed-client";

interface RawSoal {
  q: string;
  benar: string;
  salah: string[];
}
interface RawBacaan {
  jurusan: string;
  jurusanLabel: string;
  jurusanFull: string;
  icon: string;
  level: number;
  urutan: number;
  title: string;
  text: string;
  questions: RawSoal[];
}

/* PRNG kecil deterministik (mulberry32 + FNV-1a) — cukup untuk mengacak 4 opsi. */
function hashSeed(...parts: Array<string | number>): number {
  const str = parts.join("|");
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffleSeeded<T>(arr: readonly T[], seed: number): T[] {
  const rng = mulberry32(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  const path = new URL("./data/skibaca.json", import.meta.url);
  const data = JSON.parse(readFileSync(path, "utf8")) as RawBacaan[];
  console.log(`Memuat ${data.length} bacaan SKIBACA…`);

  let nSoal = 0;
  for (const b of data) {
    const kode = b.jurusanLabel; // TKR | TSM | TKJ | Kuliner | TPTUP
    const wordCount = b.text.trim().split(/\s+/).length;

    const tipe = b.urutan > 15 ? "ringkasan" : "kuis";
    const passage = await prisma.skibacaPassage.upsert({
      where: { jurusanKode_level_urutan: { jurusanKode: kode, level: b.level, urutan: b.urutan } },
      update: { jurusanFull: b.jurusanFull, icon: b.icon, tipe, title: b.title, text: b.text, wordCount },
      create: {
        jurusanKode: kode,
        jurusanFull: b.jurusanFull,
        icon: b.icon,
        level: b.level,
        urutan: b.urutan,
        tipe,
        title: b.title,
        text: b.text,
        wordCount,
      },
    });

    await prisma.skibacaQuestion.deleteMany({ where: { passageId: passage.id } });
    for (let qi = 0; qi < b.questions.length; qi++) {
      const soal = b.questions[qi];
      const opsiKanonik = [soal.benar, ...soal.salah];
      const opsi = shuffleSeeded(opsiKanonik, hashSeed(kode, b.level, b.urutan, qi));
      const answerIndex = opsi.indexOf(soal.benar);
      await prisma.skibacaQuestion.create({
        data: {
          passageId: passage.id,
          urutan: qi + 1,
          q: soal.q,
          options: JSON.stringify(opsi),
          answerIndex,
        },
      });
      nSoal++;
    }
  }

  const totalP = await prisma.skibacaPassage.count();
  const totalQ = await prisma.skibacaQuestion.count();
  console.log(`Selesai. Passage: ${totalP}, Soal: ${totalQ} (baru diproses: ${nSoal}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
