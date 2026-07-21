import { prisma } from "@/lib/db";
import { lingkupKelas, whereLabel, dibatasiKe } from "@/server/lingkup";
import { periodKey, urutkanKelas, BULAN_PANJANG } from "@/lib/kelas";
import {
  ringkasan,
  rekapPerKelas,
  perkembangan,
  type ResultRow,
  type Ringkas,
  type RekapKelas,
  type TitikPerkembangan,
} from "@/lib/evaluasi";

const SELECT_RES = {
  studentId: true,
  kelasLabel: true,
  period: true,
  numerasi: true,
  literasi: true,
  total: true,
} as const;

export interface EvaluasiData {
  kelasOpsi: string[];
  periodeOpsi: string[];
  kelas: string; // "all" | label
  period: string; // "YYYY-MM"
  namaBulan: string;
  ringkas: Ringkas;
  rekap: RekapKelas[];
  perkembangan: TitikPerkembangan[];
  chartPeriods: string[];
  belum: { nama: string; kelasLabel: string }[];
  adaData: boolean;
  /** Kelas yang menjadi lingkup staf ini; null = semua kelas (tak dibatasi). */
  dibatasiKe: string[] | null;
}

/**
 * Muat semua data dashboard Evaluasi untuk (kelas, periode) terpilih. Hanya staf.
 * Staf yang ditugasi kelas tertentu hanya melihat kelas itu — di seluruh angka, bukan
 * sekadar dropdown: opsi kelas, daftar siswa, hasil Check Point, dan grafik perkembangan.
 */
export async function muatEvaluasi(params: { kelas?: string; period?: string }): Promise<EvaluasiData> {
  const lingkup = await lingkupKelas();
  const labelIn = whereLabel(lingkup);

  const kelasRows = await prisma.kelas.findMany({
    where: { aktif: true, ...(labelIn ? { label: labelIn } : {}) },
    select: { label: true },
  });
  const kelasOpsi = kelasRows.map((k) => k.label).sort(urutkanKelas);

  const students = await prisma.student.findMany({
    where: { aktif: true, ...(labelIn ? { kelas: { label: labelIn } } : {}) },
    select: { id: true, nama: true, kelas: { select: { label: true } } },
  });
  const jumlahPerKelas = new Map<string, number>();
  for (const s of students) jumlahPerKelas.set(s.kelas.label, (jumlahPerKelas.get(s.kelas.label) || 0) + 1);

  const periodeRows = await prisma.checkpointResult.findMany({
    where: { status: "submitted", ...(labelIn ? { kelasLabel: labelIn } : {}) },
    distinct: ["period"],
    select: { period: true },
    orderBy: { period: "desc" },
  });
  const periodeOpsi = periodeRows.map((p) => p.period);
  const period = params.period && periodeOpsi.includes(params.period) ? params.period : periodeOpsi[0] ?? periodKey();
  const kelas = params.kelas && kelasOpsi.includes(params.kelas) ? params.kelas : "all";

  // Hasil periode terpilih (semua kelas) → rekap.
  const resP: ResultRow[] = await prisma.checkpointResult.findMany({
    where: { status: "submitted", period, ...(labelIn ? { kelasLabel: labelIn } : {}) },
    select: SELECT_RES,
  });
  const kelasJumlah = kelasOpsi.map((label) => ({ label, jumlah: jumlahPerKelas.get(label) || 0 }));
  const rekap = rekapPerKelas(kelasJumlah, resP);

  // Cakupan filter kelas → ringkas + daftar belum.
  const resScope = kelas === "all" ? resP : resP.filter((r) => r.kelasLabel === kelas);
  const studentsScope = kelas === "all" ? students : students.filter((s) => s.kelas.label === kelas);
  const ringkas = ringkasan(studentsScope.length, resScope);

  const sudahIds = new Set(resScope.map((r) => r.studentId));
  const belum = studentsScope
    .filter((s) => !sudahIds.has(s.id))
    .map((s) => ({ nama: s.nama, kelasLabel: s.kelas.label }))
    .sort((a, b) => {
      const k = urutkanKelas(a.kelasLabel, b.kelasLabel);
      return k !== 0 ? k : a.nama < b.nama ? -1 : 1;
    });

  // Perkembangan: hingga 12 periode terakhir yang tersedia (menaik), ikut filter kelas.
  const chartPeriods = [...periodeOpsi].sort().slice(-12);
  const resChart: ResultRow[] = chartPeriods.length
    ? await prisma.checkpointResult.findMany({
        where: {
          status: "submitted",
          period: { in: chartPeriods },
          // Kelas terpilih menyempitkan lebih jauh; "all" tetap dibatasi lingkup staf.
          ...(kelas !== "all" ? { kelasLabel: kelas } : labelIn ? { kelasLabel: labelIn } : {}),
        },
        select: SELECT_RES,
      })
    : [];
  const deret = perkembangan(chartPeriods, resChart);

  const [th, bl] = period.split("-");
  return {
    kelasOpsi,
    periodeOpsi,
    kelas,
    period,
    namaBulan: `${BULAN_PANJANG[Number(bl) - 1]} ${th}`,
    ringkas,
    rekap,
    perkembangan: deret,
    chartPeriods,
    belum,
    adaData: periodeOpsi.length > 0,
    dibatasiKe: dibatasiKe(lingkup),
  };
}
