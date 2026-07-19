"use server";
/**
 * Loader PAPAN PERINGKAT GABUNGAN (SKIBA Math + SKIBACA).
 *
 * Dua sudut pandang:
 *   - **Seluruh siswa** (satu sekolah) & **per kelas** — halaman guru/admin `/guru/peringkat`.
 *   - Versi motivasi untuk siswa `/siswa/peringkat` (top sekolah + top kelasnya + posisi dirinya).
 *
 * Data KUMULATIF dari snapshot capaian: `SkibaTopicState.progress` (level selesai),
 * `SkibacaProgress` (bacaan kuis + persen), dan rata skor `PracticeActivity` sebagai "mutu".
 * Semua agregasi berat memakai `groupBy` supaya tidak menarik ribuan baris ke memori
 * (laptop dev ±4 GB, lihat buglog MEM-01). Rumus ada di `src/lib/peringkat.ts` (murni & diuji).
 */
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { urutkanKelas } from "@/lib/kelas";
import { sesiSiswa } from "@/server/student-auth";
import {
  susunPeringkat,
  susunPeringkatKelas,
  potongTeratas,
  type BarisPeringkat,
  type BarisKelasPeringkat,
  type DataPeringkat,
} from "@/lib/peringkat";

async function requireStaf(): Promise<void> {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) throw new Error("Sesi staf tidak ditemukan.");
}

function panjangProgress(json: string): number {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((n) => typeof n === "number").length : 0;
  } catch {
    return 0;
  }
}

/**
 * Kumpulkan data mentah SELURUH siswa. Sengaja satu kali ambil semua (bukan per kelas):
 * peringkat sekolah, per kelas, dan antar kelas semuanya diturunkan dari kumpulan yang sama
 * agar nilai konsisten, dan penyaringan per kelas cukup dilakukan di memori.
 */
async function kumpulkanData(): Promise<DataPeringkat[]> {
  const rows = await prisma.student.findMany({
    where: { aktif: true },
    select: { id: true, nama: true, nisn: true, kelas: { select: { label: true } } },
  });
  const students = rows.map((r) => ({ id: r.id, nama: r.nama, nisn: r.nisn, kelasLabel: r.kelas.label }));
  if (students.length === 0) return [];
  const ids = students.map((s) => s.id);

  const [skibaRows, bacaRows, aktRows] = await Promise.all([
    prisma.skibaTopicState.findMany({
      where: { studentId: { in: ids } },
      select: { studentId: true, progress: true },
    }),
    prisma.skibacaProgress.groupBy({
      by: ["studentId"],
      where: { studentId: { in: ids } },
      _count: { _all: true },
      _avg: { percent: true },
    }),
    prisma.practiceActivity.groupBy({
      by: ["studentId", "domain"],
      where: { studentId: { in: ids } },
      _count: { _all: true },
      _avg: { score: true },
    }),
  ]);

  const level = new Map<string, number>();
  for (const r of skibaRows) level.set(r.studentId, (level.get(r.studentId) ?? 0) + panjangProgress(r.progress));

  // _avg Prisma bertipe float → dibulatkan supaya nilai & tampilan konsisten dgn modul lain.
  const bulat = (x: number | null) => (x == null ? null : Math.round(x));

  const baca = new Map<string, { n: number; avg: number | null }>();
  for (const r of bacaRows) baca.set(r.studentId, { n: r._count._all, avg: bulat(r._avg.percent) });

  const akt = new Map<string, number>();
  const mutuNum = new Map<string, number | null>();
  for (const r of aktRows) {
    akt.set(r.studentId, (akt.get(r.studentId) ?? 0) + r._count._all);
    if (r.domain === "NUMERASI") mutuNum.set(r.studentId, bulat(r._avg.score));
  }

  return students.map((s) => {
    const b = baca.get(s.id);
    return {
      siswaId: s.id,
      nama: s.nama,
      nisn: s.nisn,
      kelasLabel: s.kelasLabel,
      skibaLevel: level.get(s.id) ?? 0,
      skibaMutu: mutuNum.get(s.id) ?? null,
      skibacaBacaan: b?.n ?? 0,
      skibacaMutu: b?.avg ?? null,
      aktivitas: akt.get(s.id) ?? 0,
    };
  });
}

export interface PeringkatSekolah {
  siswa: BarisPeringkat[]; // seluruh siswa, terurut
  kelas: BarisKelasPeringkat[]; // agregat antar kelas
  kelasOpsi: string[];
}

/** Peringkat seluruh sekolah + agregat antar kelas (guru/admin). */
export async function muatPeringkatSekolah(): Promise<PeringkatSekolah> {
  await requireStaf();
  const siswa = susunPeringkat(await kumpulkanData());
  return {
    siswa,
    kelas: susunPeringkatKelas(siswa),
    kelasOpsi: [...new Set(siswa.map((s) => s.kelasLabel))].sort(urutkanKelas),
  };
}

export interface PeringkatSiswaView {
  teratasSekolah: BarisPeringkat[];
  sayaSekolah: BarisPeringkat | null;
  teratasKelas: BarisPeringkat[];
  sayaKelas: BarisPeringkat | null;
  kelasLabel: string;
  totalSiswa: number;
  totalKelas: number;
}

/** Tampilan siswa: 20 teratas sekolah & kelas sendiri + posisi dirinya (disorot). */
export async function muatPeringkatSiswa(): Promise<PeringkatSiswaView> {
  const sesi = await sesiSiswa();
  if (!sesi) throw new Error("Sesi siswa tidak ditemukan.");

  const semua = susunPeringkat(await kumpulkanData());
  const saya = semua.find((r) => r.siswaId === sesi.studentId) ?? null;
  const kelasLabel = saya?.kelasLabel ?? "";
  const sekelas = semua.filter((r) => r.kelasLabel === kelasLabel);
  // Nomor peringkat dihitung ulang dalam lingkup kelas (bukan sisa nomor sekolah).
  const dalamKelas = susunPeringkat(sekelas);

  const sekolah = potongTeratas(semua, 20, sesi.studentId);
  const kelas = potongTeratas(dalamKelas, 20, sesi.studentId);
  return {
    teratasSekolah: sekolah.teratas,
    sayaSekolah: sekolah.saya,
    teratasKelas: kelas.teratas,
    sayaKelas: kelas.saya,
    kelasLabel,
    totalSiswa: semua.length,
    totalKelas: dalamKelas.length,
  };
}
