import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { periodKey, BULAN_PANJANG } from "@/lib/kelas";

/** Ringkasan Sekolah untuk Beranda dasbor guru — angka nyata dari DB. */
export interface RingkasanSekolah {
  totalSiswa: number;
  kelasAktif: number; // kelas yang ditandai aktif dikelola (lihat Kelola Kelas)
  guruStaf: number; // total akun staf (ADMIN + GURU)
  cpPersen: number; // % siswa aktif yang mengerjakan Check Point periode ini
  cpBulan: string; // "Juli"
  bulanTahun: string; // "Juli 2026"
  kelasBelumTuntas: number; // kelas berisi yang belum 100% mengerjakan periode ini
}

/** Muat ringkasan sekolah. Hanya staf (butuh sesi). */
export async function muatRingkasanSekolah(): Promise<RingkasanSekolah> {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) throw new Error("Sesi staf tidak ditemukan.");

  const period = periodKey();

  const [siswa, guruStaf, kelasAktif, hasil] = await Promise.all([
    prisma.student.findMany({ where: { aktif: true }, select: { id: true, kelasId: true } }),
    prisma.user.count(),
    prisma.kelas.count({ where: { aktif: true } }),
    prisma.checkpointResult.findMany({
      where: { status: "submitted", period },
      select: { studentId: true },
      distinct: ["studentId"],
    }),
  ]);

  const totalSiswa = siswa.length;
  const sudah = new Set(hasil.map((h) => h.studentId));

  // Rekap per kelas: total siswa & berapa yang sudah mengerjakan.
  const totalPerKelas = new Map<string, number>();
  const sudahPerKelas = new Map<string, number>();
  for (const x of siswa) {
    totalPerKelas.set(x.kelasId, (totalPerKelas.get(x.kelasId) ?? 0) + 1);
    if (sudah.has(x.id)) sudahPerKelas.set(x.kelasId, (sudahPerKelas.get(x.kelasId) ?? 0) + 1);
  }

  const siswaSudah = siswa.filter((x) => sudah.has(x.id)).length;
  let kelasBelumTuntas = 0;
  for (const [k, tot] of totalPerKelas) {
    if ((sudahPerKelas.get(k) ?? 0) < tot) kelasBelumTuntas++;
  }

  const [th, bl] = period.split("-");
  const bulan = BULAN_PANJANG[Number(bl) - 1] ?? "";

  return {
    totalSiswa,
    kelasAktif,
    guruStaf,
    cpPersen: totalSiswa ? Math.round((siswaSudah / totalSiswa) * 100) : 0,
    cpBulan: bulan,
    bulanTahun: `${bulan} ${th}`,
    kelasBelumTuntas,
  };
}
