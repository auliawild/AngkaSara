"use server";
/**
 * Server actions KELOLA KELAS (khusus ADMIN): pilih kelas mana yang "aktif dikelola".
 * Kelas nonaktif disembunyikan dari dropdown filter (Evaluasi/Laporan), validasi impor
 * siswa, dan hitungan "Kelas Aktif" di dasbor. Data kelas tetap di DB (tak dihapus) —
 * hanya ditandai `aktif`. Daftar kelas berasal dari seed config [[kelas]] (46 kelas).
 */
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { urutkanKelas, ikonJurusan } from "@/lib/kelas";

async function requireAdmin(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Sesi staf tidak ditemukan. Silakan masuk kembali.");
  const role = (session.user as { role?: string }).role ?? "GURU";
  if (role !== "ADMIN") throw new Error("Hanya Admin yang boleh mengelola kelas.");
}

export interface KelasItem {
  id: string;
  label: string;
  tingkat: string;
  icon: string;
  jumlahSiswa: number;
  aktif: boolean;
}

export interface KelolaKelasData {
  items: KelasItem[]; // urut naik (X → XII, lalu abjad)
  totalKelas: number;
  totalAktif: number;
  totalSiswaNonaktif: number; // jumlah siswa yang berada di kelas nonaktif (untuk peringatan)
}

/** Muat semua kelas + status aktif & jumlah siswa. Hanya ADMIN. */
export async function muatKelolaKelas(): Promise<KelolaKelasData> {
  await requireAdmin();

  const rows = await prisma.kelas.findMany({
    select: {
      id: true,
      label: true,
      tingkat: true,
      aktif: true,
      _count: { select: { students: true } },
    },
  });

  const items: KelasItem[] = rows
    .map((k) => ({
      id: k.id,
      label: k.label,
      tingkat: k.tingkat,
      icon: ikonJurusan(k.label),
      jumlahSiswa: k._count.students,
      aktif: k.aktif,
    }))
    .sort((a, b) => urutkanKelas(a.label, b.label));

  return {
    items,
    totalKelas: items.length,
    totalAktif: items.filter((k) => k.aktif).length,
    totalSiswaNonaktif: items.filter((k) => !k.aktif).reduce((s, k) => s + k.jumlahSiswa, 0),
  };
}

export interface AksiResult {
  ok: boolean;
  error?: string;
}

/** Aktif/nonaktifkan satu kelas. Hanya ADMIN. */
export async function setKelasAktif(kelasId: string, aktif: boolean): Promise<AksiResult> {
  await requireAdmin();
  const k = await prisma.kelas.findUnique({ where: { id: kelasId }, select: { id: true } });
  if (!k) return { ok: false, error: "Kelas tidak ditemukan." };

  await prisma.kelas.update({ where: { id: kelasId }, data: { aktif } });

  // Semua tempat yang menampilkan/menyaring kelas.
  for (const p of ["/guru/kelas", "/guru", "/guru/evaluasi", "/guru/laporan", "/guru/siswa"]) {
    revalidatePath(p);
  }
  return { ok: true };
}

/** Aktif/nonaktifkan semua kelas pada satu tingkat sekaligus (tombol pintas). Hanya ADMIN. */
export async function setTingkatAktif(tingkat: string, aktif: boolean): Promise<AksiResult> {
  await requireAdmin();
  await prisma.kelas.updateMany({ where: { tingkat }, data: { aktif } });
  for (const p of ["/guru/kelas", "/guru", "/guru/evaluasi", "/guru/laporan", "/guru/siswa"]) {
    revalidatePath(p);
  }
  return { ok: true };
}
