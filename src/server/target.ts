"use server";
/**
 * Loader Target Bulanan SKIBA Math & SKIBACA.
 *
 * - `muatTargetSiswa`: rekap 4 bulan (Agu–Nov) untuk siswa yang sedang login.
 * - `muatTargetKelas`: rekap kelas untuk staf (guru + admin), dibatasi LINGKUP kelas
 *   seperti Laporan/Evaluasi/Pantauan. Menampilkan capaian kumulatif tiap siswa terhadap
 *   target bulan yang sedang berjalan + penanda sudah/belum tercapai.
 *
 * Aturan murni di `lib/target.ts`. Tidak menyentuh peringkat/skor.
 */
import { prisma } from "@/lib/db";
import { sesiSiswa } from "@/server/student-auth";
import { urutkanKelas } from "@/lib/kelas";
import { lingkupKelas, whereLabel, dibatasiKe } from "@/server/lingkup";
import {
  hitungTarget,
  barisKini,
  awalProgram,
  type AktivitasTarget,
  type RekapTarget,
  type BarisTarget,
} from "@/lib/target";

/** Kolom PracticeActivity minimum untuk perhitungan target. */
const SELECT_AKTIVITAS = {
  domain: true,
  category: true,
  level: true,
  activity: true,
  stars: true,
  createdAt: true,
} as const;

/* ===================== SISWA ===================== */
export interface TargetSiswaData {
  nama: string;
  kelasLabel: string;
  rekap: RekapTarget;
}

/** Rekap target untuk siswa yang sedang login. */
export async function muatTargetSiswa(): Promise<TargetSiswaData> {
  const sesi = await sesiSiswa();
  if (!sesi) throw new Error("Sesi siswa tidak ditemukan. Silakan masuk kembali.");

  const rows = await prisma.practiceActivity.findMany({
    where: { studentId: sesi.studentId, createdAt: { gte: awalProgram() } },
    select: SELECT_AKTIVITAS,
  });

  const rekap = hitungTarget(rows as AktivitasTarget[], new Date());
  return { nama: sesi.nama, kelasLabel: sesi.kelasLabel, rekap };
}

/* ===================== KELAS (staf) ===================== */
export interface BarisTargetSiswa {
  siswaId: string;
  nama: string;
  nisn: string;
  kelasLabel: string;
  skiba: number;
  skibaca: number;
  skibaTercapai: boolean;
  skibacaTercapai: boolean;
}

export interface TargetKelasData {
  kelasOpsi: string[];
  kelasTerpilih: string | null;
  dibatasiKe: string[] | null;
  bulanLabel: string; // bulan target yang sedang berjalan
  targetSkiba: number; // kumulatif bulan berjalan
  targetSkibaca: number;
  tuntasSkiba: number; // jumlah siswa yang sudah capai target SKIBA
  tuntasSkibaca: number;
  total: number;
  siswa: BarisTargetSiswa[];
}

/** Rekap target kelas untuk staf (dibatasi lingkup). Opsional saring 1 kelas. */
export async function muatTargetKelas(params: { kelas?: string } = {}): Promise<TargetKelasData> {
  const lingkup = await lingkupKelas(); // sekaligus penjaga sesi staf
  const labelIn = whereLabel(lingkup);

  const kelasRows = await prisma.kelas.findMany({
    where: { aktif: true, ...(labelIn ? { label: labelIn } : {}) },
    select: { label: true },
  });
  const kelasOpsi = kelasRows.map((k) => k.label).sort(urutkanKelas);
  const kelasTerpilih = params.kelas && kelasOpsi.includes(params.kelas) ? params.kelas : null;

  const siswaRows = await prisma.student.findMany({
    where: {
      aktif: true,
      kelas: { label: kelasTerpilih ? kelasTerpilih : labelIn ? labelIn : undefined },
    },
    select: { id: true, nama: true, nisn: true, kelas: { select: { label: true } } },
  });

  const ids = siswaRows.map((s) => s.id);
  const aktivitas = ids.length
    ? await prisma.practiceActivity.findMany({
        where: { studentId: { in: ids }, createdAt: { gte: awalProgram() } },
        select: { studentId: true, ...SELECT_AKTIVITAS },
      })
    : [];

  // Kelompokkan aktivitas per siswa.
  const perSiswa = new Map<string, AktivitasTarget[]>();
  for (const a of aktivitas) {
    let arr = perSiswa.get(a.studentId);
    if (!arr) {
      arr = [];
      perSiswa.set(a.studentId, arr);
    }
    arr.push(a as AktivitasTarget);
  }

  const now = new Date();
  let bulanLabel = "";
  let targetSkiba = 0;
  let targetSkibaca = 0;

  const siswa: BarisTargetSiswa[] = siswaRows.map((s) => {
    const rekap = hitungTarget(perSiswa.get(s.id) ?? [], now);
    const b: BarisTarget = barisKini(rekap);
    bulanLabel = b.label;
    targetSkiba = b.targetSkiba;
    targetSkibaca = b.targetSkibaca;
    return {
      siswaId: s.id,
      nama: s.nama,
      nisn: s.nisn,
      kelasLabel: s.kelas.label,
      skiba: b.skiba,
      skibaca: b.skibaca,
      skibaTercapai: b.skibaTercapai,
      skibacaTercapai: b.skibacaTercapai,
    };
  });

  // Bila tak ada siswa, tetap tampilkan label/target bulan berjalan.
  if (siswa.length === 0) {
    const b = barisKini(hitungTarget([], now));
    bulanLabel = b.label;
    targetSkiba = b.targetSkiba;
    targetSkibaca = b.targetSkibaca;
  }

  // Urut: paling tertinggal dulu (belum SKIBA → belum SKIBACA → capaian rendah → nama).
  siswa.sort(
    (a, b) =>
      Number(a.skibaTercapai) - Number(b.skibaTercapai) ||
      Number(a.skibacaTercapai) - Number(b.skibacaTercapai) ||
      a.skiba + a.skibaca - (b.skiba + b.skibaca) ||
      a.nama.localeCompare(b.nama, "id"),
  );

  return {
    kelasOpsi,
    kelasTerpilih,
    dibatasiKe: dibatasiKe(lingkup),
    bulanLabel,
    targetSkiba,
    targetSkibaca,
    tuntasSkiba: siswa.filter((s) => s.skibaTercapai).length,
    tuntasSkibaca: siswa.filter((s) => s.skibacaTercapai).length,
    total: siswa.length,
    siswa,
  };
}
