"use server";
/**
 * Server actions BUKA KESEMPATAN (khusus ADMIN). Untuk siswa yang kehilangan kesempatan
 * karena kendala (mis. sinyal putus), admin dapat membuka kembali:
 *   - Tes Diagnostik SKIBA Math (batas 2× via SkibaProfile.diagAttempts) → reset ke 0.
 *   - Check Point (batas 1×/bulan via @@unique[studentId, period]) → hapus baris periode
 *     berjalan sehingga siswa bisa memulai dari awal (seed bulanan sama; skor lama hilang).
 * Tidak ada perubahan skema. Check Point hanya menulis ke CheckpointResult (bukan
 * PracticeActivity), jadi menghapus barisnya = reset bersih.
 */
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { periodKey, BULAN_PANJANG } from "@/lib/kelas";

/** Pastikan sesi ADMIN. */
async function requireAdmin(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Sesi staf tidak ditemukan. Silakan masuk kembali.");
  const role = (session.user as { role?: string }).role ?? "GURU";
  if (role !== "ADMIN") throw new Error("Hanya Admin yang boleh membuka kesempatan.");
}

export interface KesempatanResult {
  ok: boolean;
  error?: string;
  pesan?: string;
}

/** Label ramah "Juli 2026" dari periodKey "2026-07". */
function labelPeriode(period: string): string {
  const [th, bl] = period.split("-").map(Number);
  return `${BULAN_PANJANG[(bl ?? 1) - 1] ?? ""} ${th ?? ""}`.trim();
}

/**
 * Buka kembali Tes Diagnostik SKIBA Math: reset kuota (diagAttempts → 0) sehingga siswa
 * mendapat kembali jatah penuh. Skor & waktu diagnostik terakhir (baseline raport) TIDAK
 * disentuh; akan tertimpa saat siswa mengerjakan ulang.
 */
export async function bukaDiagnostikSkiba(studentId: string): Promise<KesempatanResult> {
  await requireAdmin();
  const siswa = await prisma.student.findUnique({ where: { id: studentId }, select: { nama: true } });
  if (!siswa) return { ok: false, error: "Siswa tidak ditemukan." };

  const profile = await prisma.skibaProfile.findUnique({
    where: { studentId },
    select: { diagAttempts: true },
  });
  if (!profile || profile.diagAttempts === 0)
    return { ok: true, pesan: `${siswa.nama} belum memakai kesempatan diagnostik — tak perlu dibuka.` };

  await prisma.skibaProfile.update({ where: { studentId }, data: { diagAttempts: 0 } });
  revalidatePath("/guru/siswa");
  revalidatePath("/siswa/skiba");
  return { ok: true, pesan: `Kesempatan Tes Diagnostik SKIBA untuk ${siswa.nama} dibuka kembali.` };
}

/**
 * Buka kembali Check Point periode berjalan: hapus baris CheckpointResult bulan ini agar
 * siswa bisa memulai dari awal. Skor bulan ini yang tersimpan akan hilang.
 */
export async function bukaCheckpoint(studentId: string): Promise<KesempatanResult> {
  await requireAdmin();
  const siswa = await prisma.student.findUnique({ where: { id: studentId }, select: { nama: true } });
  if (!siswa) return { ok: false, error: "Siswa tidak ditemukan." };

  const period = periodKey();
  const hasil = await prisma.checkpointResult.deleteMany({ where: { studentId, period } });
  if (hasil.count === 0)
    return { ok: true, pesan: `${siswa.nama} belum ada Check Point ${labelPeriode(period)} — tak perlu dibuka.` };

  revalidatePath("/guru/siswa");
  revalidatePath("/siswa/checkpoint");
  revalidatePath("/siswa");
  return {
    ok: true,
    pesan: `Check Point ${labelPeriode(period)} untuk ${siswa.nama} dibuka kembali (skor lama dihapus).`,
  };
}
