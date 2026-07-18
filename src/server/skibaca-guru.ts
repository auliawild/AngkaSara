"use server";
/**
 * Penilaian ringkasan SKIBACA oleh GURU (bacaan 16..20). Siswa menulis parafrase; tak ada
 * skor otomatis. Guru membaca teks asli + POIN KUNCI (kunci soal, hanya untuk guru) + ringkasan
 * siswa, lalu memberi skor (0..100) & catatan. Semua aksi butuh sesi staf (Better Auth).
 */
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireStaf(): Promise<void> {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) throw new Error("Sesi staf tidak ditemukan.");
}

export interface RingkasanUntukGuru {
  id: string;
  nama: string;
  kelasLabel: string;
  jurusanKode: string;
  level: number;
  urutan: number;
  judul: string;
  teksAsli: string;
  poinKunci: string[]; // kunci soal 16..20 sebagai acuan penilaian (tak pernah ke siswa)
  ringkasanSiswa: string;
  wordCount: number;
  score: number | null;
  feedback: string | null;
  dinilai: boolean;
  dikirim: string; // tanggal kirim (id-ID)
}

/** Daftar ringkasan terkirim. `filter`: "belum" (default) hanya yang belum dinilai; "semua" semua. */
export async function muatRingkasanUntukGuru(filter: "belum" | "semua" = "belum"): Promise<RingkasanUntukGuru[]> {
  await requireStaf();
  const rows = await prisma.skibacaSummary.findMany({
    where: filter === "belum" ? { gradedAt: null } : {},
    orderBy: [{ gradedAt: "asc" }, { createdAt: "asc" }], // belum dinilai (null) dulu
    include: {
      student: { select: { nama: true, kelas: { select: { label: true } } } },
      passage: {
        select: {
          jurusanKode: true,
          level: true,
          urutan: true,
          title: true,
          text: true,
          questions: { orderBy: { urutan: "asc" }, select: { options: true, answerIndex: true } },
        },
      },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    nama: r.student.nama,
    kelasLabel: r.student.kelas.label,
    jurusanKode: r.passage.jurusanKode,
    level: r.passage.level,
    urutan: r.passage.urutan,
    judul: r.passage.title,
    teksAsli: r.passage.text,
    poinKunci: r.passage.questions.map((q) => {
      try {
        return (JSON.parse(q.options) as string[])[q.answerIndex] ?? "";
      } catch {
        return "";
      }
    }),
    ringkasanSiswa: r.text,
    wordCount: r.wordCount,
    score: r.score,
    feedback: r.feedback,
    dinilai: r.gradedAt != null,
    dikirim: r.createdAt.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
  }));
}

export interface NilaiRingkasanHasil {
  ok: boolean;
  error?: string;
}

/** Simpan penilaian guru untuk satu ringkasan. Skor 0..100, feedback opsional. */
export async function nilaiRingkasan(input: {
  summaryId: string;
  score: number;
  feedback?: string;
}): Promise<NilaiRingkasanHasil> {
  await requireStaf();
  const skor = Math.round(Number(input.score));
  if (!Number.isFinite(skor) || skor < 0 || skor > 100) {
    return { ok: false, error: "Skor harus 0–100." };
  }
  const ada = await prisma.skibacaSummary.findUnique({ where: { id: input.summaryId }, select: { id: true } });
  if (!ada) return { ok: false, error: "Ringkasan tidak ditemukan." };

  await prisma.skibacaSummary.update({
    where: { id: input.summaryId },
    data: {
      score: skor,
      feedback: (input.feedback ?? "").trim() || null,
      gradedAt: new Date(),
    },
  });

  revalidatePath("/guru/skibaca");
  return { ok: true };
}
