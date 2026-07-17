"use server";
/**
 * Server actions ALUR CHECK POINT (siswa). Soal DIBANGKITKAN & DINILAI di server —
 * klien tak pernah menerima kunci jawaban, dan penilaian membandingkan ke `payload`
 * yang disimpan saat mulai (bukan ke apa pun dari klien). `@@unique([studentId, period])`
 * menegakkan "1× per bulan"; timer 30 menit berwenang di server.
 */
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { sesiSiswa } from "@/server/student-auth";
import {
  buildCheckpoint,
  nilaiCheckpoint,
  untukKlien,
  CHECKPOINT_CONFIG,
  type BuiltCheckpoint,
  type RawPassage,
  type ClientCheckpoint,
} from "@/lib/checkpoint";
import { periodKey } from "@/lib/kelas";
import { hashSeed } from "@/lib/rng";

const DURASI_DETIK = CHECKPOINT_CONFIG.DURASI_MENIT * 60;

async function loadPassages(): Promise<RawPassage[]> {
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

export interface MulaiHasil {
  status: "mengerjakan" | "sudah";
  soal?: ClientCheckpoint;
  durasiDetik?: number;
  sisaDetik?: number;
}

/** Mulai (atau lanjutkan) Check Point periode berjalan. Idempoten: satu attempt/bulan. */
export async function mulaiCheckpoint(): Promise<MulaiHasil> {
  const sesi = await sesiSiswa();
  if (!sesi) throw new Error("Sesi siswa tidak ditemukan. Silakan masuk kembali.");
  const period = periodKey();
  const where = { studentId_period: { studentId: sesi.studentId, period } };

  let row = await prisma.checkpointResult.findUnique({ where });
  if (row?.status === "submitted") return { status: "sudah" };

  if (!row) {
    const passages = await loadPassages();
    const fresh = buildCheckpoint({ period, studentKey: sesi.studentId, passages });
    const totalLit = fresh.bacaan.reduce((s, p) => s + p.questions.length, 0);
    try {
      row = await prisma.checkpointResult.create({
        data: {
          studentId: sesi.studentId,
          kelasLabel: sesi.kelasLabel,
          period,
          seed: hashSeed(sesi.studentId, period),
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
        },
      });
    } catch {
      // balapan (dua tab mulai bersamaan): pakai baris yang sudah tersimpan.
      row = await prisma.checkpointResult.findUnique({ where });
    }
  }

  if (!row?.payload) throw new Error("Gagal menyiapkan Check Point. Coba lagi.");
  if (row.status === "submitted") return { status: "sudah" };

  const built = JSON.parse(row.payload) as BuiltCheckpoint;
  const elapsed = Math.floor((Date.now() - row.startedAt.getTime()) / 1000);
  return {
    status: "mengerjakan",
    soal: untukKlien(built),
    durasiDetik: DURASI_DETIK,
    sisaDetik: Math.max(0, DURASI_DETIK - elapsed),
  };
}

export interface SubmitHasil {
  ok: boolean;
  error?: string;
}

/** Kumpulkan & NILAI di server. jawabNum = value opsi terpilih; jawabLit = index opsi. */
export async function submitCheckpoint(input: {
  jawabNum: (string | null)[];
  jawabLit: (number | null)[][];
  waktuHabis?: boolean;
}): Promise<SubmitHasil> {
  const sesi = await sesiSiswa();
  if (!sesi) throw new Error("Sesi siswa tidak ditemukan.");
  const period = periodKey();
  const where = { studentId_period: { studentId: sesi.studentId, period } };

  const row = await prisma.checkpointResult.findUnique({ where });
  if (!row) return { ok: false, error: "Belum memulai Check Point." };
  if (row.status === "submitted") return { ok: false, error: "Check Point bulan ini sudah dikumpulkan." };
  if (!row.payload) return { ok: false, error: "Data soal hilang. Mulai ulang." };

  const built = JSON.parse(row.payload) as BuiltCheckpoint;
  const skor = nilaiCheckpoint(built, input.jawabNum ?? [], input.jawabLit ?? []);
  const elapsed = Math.floor((Date.now() - row.startedAt.getTime()) / 1000);

  await prisma.checkpointResult.update({
    where,
    data: {
      numerasi: skor.numerasi,
      literasi: skor.literasi,
      total: skor.total,
      benarNum: skor.benarNum,
      totalNum: skor.totalNum,
      benarLit: skor.benarLit,
      totalLit: skor.totalLit,
      durasiDetik: Math.min(elapsed, DURASI_DETIK),
      waktuHabis: Boolean(input.waktuHabis) || elapsed >= DURASI_DETIK,
      status: "submitted",
      submittedAt: new Date(),
    },
  });
  revalidatePath("/siswa/checkpoint");
  revalidatePath("/siswa");
  return { ok: true };
}
