"use server";
/**
 * Server actions ALUR CHECK POINT (siswa). Soal DIBANGKITKAN & DINILAI di server —
 * klien tak pernah menerima kunci jawaban, dan penilaian membandingkan ke `payload`
 * yang disimpan saat mulai (bukan ke apa pun dari klien). `@@unique([studentId, period])`
 * menegakkan "1× per bulan"; timer 30 menit berwenang di server.
 *
 * SUSULAN: bila `period` (YYYY-MM) lampau diberikan, siswa mengerjakan Check Point bulan
 * itu — HANYA bila barisnya sudah dibuka admin (status in_progress). Siswa tak pernah bisa
 * membuat baris periode lampau sendiri. Skor tersimpan di bulan tersebut (memperbarui riwayat).
 */
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { sesiSiswa } from "@/server/student-auth";
import { nilaiCheckpoint, untukKlien, CHECKPOINT_CONFIG, type BuiltCheckpoint, type ClientCheckpoint } from "@/lib/checkpoint";
import { periodKey, periodeLampau } from "@/lib/kelas";
import { dataBarisCheckpoint } from "@/server/checkpoint-core";

const DURASI_DETIK = CHECKPOINT_CONFIG.DURASI_MENIT * 60;

/** Tentukan periode sasaran: default bulan berjalan; periode lampau = susulan (harus sah). */
function pilihPeriode(periodInput?: string): { period: string; susulan: boolean } {
  const now = periodKey();
  if (!periodInput || periodInput === now) return { period: now, susulan: false };
  if (!periodeLampau(periodInput)) throw new Error("Periode Check Point tidak sah.");
  return { period: periodInput, susulan: true };
}

export interface MulaiHasil {
  status: "mengerjakan" | "sudah";
  soal?: ClientCheckpoint;
  durasiDetik?: number;
  sisaDetik?: number;
}

/**
 * Mulai (atau lanjutkan) Check Point. `period` opsional = susulan bulan lampau.
 * Idempoten: satu attempt per (siswa, bulan). Jam mundur dimulai saat siswa benar-benar
 * memulai (startedAt masih sentinel "belum mulai" → disetel ke sekarang), bukan saat baris
 * dibuat/dibuka admin — supaya susulan tak keburu habis waktunya.
 */
export async function mulaiCheckpoint(periodInput?: string): Promise<MulaiHasil> {
  const sesi = await sesiSiswa();
  if (!sesi) throw new Error("Sesi siswa tidak ditemukan. Silakan masuk kembali.");
  const { period, susulan } = pilihPeriode(periodInput);
  const where = { studentId_period: { studentId: sesi.studentId, period } };

  let row = await prisma.checkpointResult.findUnique({ where });
  if (row?.status === "submitted") return { status: "sudah" };

  if (!row) {
    // Susulan tak boleh membuat baris — hanya kerjakan yang sudah dibuka admin.
    if (susulan) return { status: "sudah" };
    try {
      row = await prisma.checkpointResult.create({
        data: await dataBarisCheckpoint({ studentId: sesi.studentId, kelasLabel: sesi.kelasLabel, period }),
      });
    } catch {
      // balapan (dua tab mulai bersamaan): pakai baris yang sudah tersimpan.
      row = await prisma.checkpointResult.findUnique({ where });
    }
  }

  if (!row?.payload) throw new Error("Gagal menyiapkan Check Point. Coba lagi.");
  if (row.status === "submitted") return { status: "sudah" };

  // Jam mundur baru mulai saat siswa membuka pertama kali (startedAt masih di masa depan).
  let started = row.startedAt;
  if (started.getTime() > Date.now()) {
    started = new Date();
    await prisma.checkpointResult.update({ where, data: { startedAt: started } });
  }

  const built = JSON.parse(row.payload) as BuiltCheckpoint;
  const elapsed = Math.floor((Date.now() - started.getTime()) / 1000);
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
  period?: string;
}): Promise<SubmitHasil> {
  const sesi = await sesiSiswa();
  if (!sesi) throw new Error("Sesi siswa tidak ditemukan.");
  const { period } = pilihPeriode(input.period);
  const where = { studentId_period: { studentId: sesi.studentId, period } };

  const row = await prisma.checkpointResult.findUnique({ where });
  if (!row) return { ok: false, error: "Belum memulai Check Point." };
  if (row.status === "submitted") return { ok: false, error: "Check Point ini sudah dikumpulkan." };
  if (!row.payload) return { ok: false, error: "Data soal hilang. Mulai ulang." };

  const built = JSON.parse(row.payload) as BuiltCheckpoint;
  const skor = nilaiCheckpoint(built, input.jawabNum ?? [], input.jawabLit ?? []);
  // Bila startedAt masih sentinel (belum sempat mulai) → anggap elapsed penuh.
  const mulai = row.startedAt.getTime() > Date.now() ? Date.now() - DURASI_DETIK * 1000 : row.startedAt.getTime();
  const elapsed = Math.floor((Date.now() - mulai) / 1000);

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
