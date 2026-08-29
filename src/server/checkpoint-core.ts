/**
 * Inti Check Point yang dipakai bersama oleh alur siswa (`server/checkpoint.ts`) dan
 * pembukaan kesempatan admin (`server/kesempatan.ts`). BUKAN "use server": fungsi di sini
 * hanya boleh dipanggil dari kode server lain, TIDAK diekspos sebagai server action
 * (mencegah klien membangkitkan/menyetel Check Point sembarang periode).
 */
import { prisma } from "@/lib/db";
import { buildCheckpoint, type RawPassage } from "@/lib/checkpoint";
import { hashSeed } from "@/lib/rng";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Sentinel "belum dimulai siswa": startedAt di masa depan berarti jam mundur belum jalan.
 * Disetel ke sekarang oleh `mulaiCheckpoint` saat siswa benar-benar membuka. Penting untuk
 * susulan yang dibuka admin lebih dulu — waktunya tak boleh terpotong sebelum siswa mulai.
 */
export const SENTINEL_BELUM_MULAI = new Date("3000-01-01T00:00:00.000Z");

/** Muat bacaan Check Point (source=CHECKPOINT) beserta soalnya. */
export async function loadPassages(): Promise<RawPassage[]> {
  const rows = await prisma.readingPassage.findMany({
    where: { aktif: true, source: "CHECKPOINT" },
    orderBy: { kode: "asc" },
    include: { questions: { orderBy: { urutan: "asc" } } },
  });
  return rows.map((p) => ({
    kode: p.kode,
    tema: p.tema,
    title: p.title,
    text: p.text,
    questions: p.questions.map((q) => ({
      q: q.q,
      options: JSON.parse(q.options) as string[],
      answerIndex: q.answerIndex,
    })),
  }));
}

/**
 * Rakit objek data CheckpointResult berstatus "in_progress" untuk (siswa, periode).
 * Soal & seed deterministik dari (studentId, period) → Check Point susulan bulan tertentu
 * berisi paket soal yang sama dengan bulan itu. Dipakai untuk membuat baris baru (siswa
 * memulai) maupun mereset baris (admin membuka susulan/kesempatan).
 */
export async function dataBarisCheckpoint(input: {
  studentId: string;
  kelasLabel: string;
  period: string;
}): Promise<Prisma.CheckpointResultUncheckedCreateInput> {
  const passages = await loadPassages();
  const fresh = buildCheckpoint({ period: input.period, studentKey: input.studentId, passages });
  const totalLit = fresh.bacaan.reduce((s, p) => s + p.questions.length, 0);
  return {
    studentId: input.studentId,
    kelasLabel: input.kelasLabel,
    period: input.period,
    seed: hashSeed(input.studentId, input.period),
    numerasi: 0,
    literasi: 0,
    total: 0,
    benarNum: 0,
    totalNum: fresh.soalNum.length,
    benarLit: 0,
    totalLit,
    durasiDetik: 0,
    waktuHabis: false,
    payload: JSON.stringify(fresh),
    status: "in_progress",
    startedAt: SENTINEL_BELUM_MULAI,
    submittedAt: null,
  };
}
