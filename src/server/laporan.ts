import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { urutkanKelas } from "@/lib/kelas";
import {
  bangunRaport,
  barisDariRaport,
  type BarisKelas,
  type CpRow,
  type RaportSiswa,
  type SkibaState,
  type SkibacaProg,
  type SkibacaSum,
} from "@/lib/laporan";
import {
  daftarSemester,
  labelSemester,
  parseSemester,
  rentangSemester,
  semesterDari,
  semesterId,
  type Semester,
} from "@/lib/semester";

async function requireStaf(): Promise<void> {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) throw new Error("Sesi staf tidak ditemukan.");
}

/** Opsi filter (kelas & semester) — dipakai halaman daftar laporan. */
export interface OpsiLaporan {
  kelasOpsi: string[];
  semesterOpsi: { id: string; label: string }[];
}

async function opsiSemester(): Promise<Semester[]> {
  const rows = await prisma.checkpointResult.findMany({
    where: { status: "submitted" },
    distinct: ["period"],
    select: { period: true },
  });
  return daftarSemester(rows.map((r) => r.period));
}

export async function muatOpsiLaporan(): Promise<OpsiLaporan> {
  await requireStaf();
  const kelasRows = await prisma.kelas.findMany({ select: { label: true } });
  const sems = await opsiSemester();
  return {
    kelasOpsi: kelasRows.map((k) => k.label).sort(urutkanKelas),
    semesterOpsi: sems.map((s) => ({ id: semesterId(s), label: labelSemester(s) })),
  };
}

function parseProgress(json: string): number[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((n): n is number => typeof n === "number") : [];
  } catch {
    return [];
  }
}

/** Semester terpilih (default: semester berjalan) dari id URL. */
function pilihSemester(id?: string): Semester {
  return (id && parseSemester(id)) || semesterDari();
}

/**
 * Kumpulkan raport satu batch siswa untuk satu semester. Semua query di-batch by studentId
 * (efisien untuk satu kelas ≤40 siswa). Check Point difilter per periode semester; SKIBA &
 * SKIBACA snapshot kumulatif; keaktifan latihan dihitung dari PracticeActivity dalam rentang.
 */
async function kumpulkanRaport(
  students: { id: string; nama: string; nisn: string; kelasLabel: string }[],
  s: Semester,
): Promise<Map<string, RaportSiswa>> {
  const ids = students.map((x) => x.id);
  const out = new Map<string, RaportSiswa>();
  if (ids.length === 0) return out;

  const { mulai, selesai, periods } = rentangSemester(s);

  const [cpRows, skibaRows, progRows, sumRows, aktRows] = await Promise.all([
    prisma.checkpointResult.findMany({
      where: { studentId: { in: ids }, status: "submitted", period: { in: periods } },
      select: { studentId: true, period: true, numerasi: true, literasi: true, total: true },
    }),
    prisma.skibaTopicState.findMany({
      where: { studentId: { in: ids } },
      select: { studentId: true, score: true, progress: true },
    }),
    prisma.skibacaProgress.findMany({
      where: { studentId: { in: ids } },
      select: { studentId: true, percent: true, wpm: true },
    }),
    prisma.skibacaSummary.findMany({
      where: { studentId: { in: ids } },
      select: { studentId: true, score: true },
    }),
    prisma.practiceActivity.groupBy({
      by: ["studentId", "domain"],
      where: { studentId: { in: ids }, createdAt: { gte: mulai, lt: selesai } },
      _count: { _all: true },
    }),
  ]);

  const cpBy = new Map<string, CpRow[]>();
  for (const r of cpRows) {
    const arr = cpBy.get(r.studentId) ?? [];
    arr.push({ period: r.period, numerasi: r.numerasi, literasi: r.literasi, total: r.total });
    cpBy.set(r.studentId, arr);
  }
  const skibaBy = new Map<string, SkibaState[]>();
  for (const r of skibaRows) {
    const arr = skibaBy.get(r.studentId) ?? [];
    arr.push({ topicId: "", score: r.score, progress: parseProgress(r.progress) });
    skibaBy.set(r.studentId, arr);
  }
  const progBy = new Map<string, SkibacaProg[]>();
  for (const r of progRows) {
    const arr = progBy.get(r.studentId) ?? [];
    arr.push({ percent: r.percent, wpm: r.wpm });
    progBy.set(r.studentId, arr);
  }
  const sumBy = new Map<string, SkibacaSum[]>();
  for (const r of sumRows) {
    const arr = sumBy.get(r.studentId) ?? [];
    arr.push({ score: r.score });
    sumBy.set(r.studentId, arr);
  }
  const aktNum = new Map<string, number>();
  const aktLit = new Map<string, number>();
  for (const r of aktRows) {
    const n = r._count._all;
    if (r.domain === "NUMERASI") aktNum.set(r.studentId, n);
    else if (r.domain === "LITERASI") aktLit.set(r.studentId, n);
  }

  for (const st of students) {
    out.set(
      st.id,
      bangunRaport({
        identitas: { nama: st.nama, nisn: st.nisn, kelasLabel: st.kelasLabel },
        cpRows: cpBy.get(st.id) ?? [],
        skibaStates: skibaBy.get(st.id) ?? [],
        skibacaProgress: progBy.get(st.id) ?? [],
        skibacaSummaries: sumBy.get(st.id) ?? [],
        aktivitasNumerasi: aktNum.get(st.id) ?? 0,
        aktivitasLiterasi: aktLit.get(st.id) ?? 0,
      }),
    );
  }
  return out;
}

export interface LaporanKelas {
  kelasOpsi: string[];
  semesterOpsi: { id: string; label: string }[];
  kelas: string | null; // null = belum pilih kelas
  semesterId: string;
  semesterLabel: string;
  baris: BarisKelas[];
  adaSiswa: boolean;
}

/** Daftar progres siswa satu kelas untuk satu semester. */
export async function muatLaporanKelas(params: { kelas?: string; semester?: string }): Promise<LaporanKelas> {
  await requireStaf();
  const opsi = await muatOpsiLaporan();
  const s = pilihSemester(params.semester);
  const kelas = params.kelas && opsi.kelasOpsi.includes(params.kelas) ? params.kelas : null;

  let baris: BarisKelas[] = [];
  if (kelas) {
    const students = await prisma.student.findMany({
      where: { aktif: true, kelas: { label: kelas } },
      select: { id: true, nama: true, nisn: true },
      orderBy: { nama: "asc" },
    });
    const raport = await kumpulkanRaport(
      students.map((x) => ({ ...x, kelasLabel: kelas })),
      s,
    );
    baris = students.map((st) => barisDariRaport(st.id, raport.get(st.id)!));
  }

  return {
    kelasOpsi: opsi.kelasOpsi,
    semesterOpsi: opsi.semesterOpsi,
    kelas,
    semesterId: semesterId(s),
    semesterLabel: labelSemester(s),
    baris,
    adaSiswa: baris.length > 0,
  };
}

export interface RaportDetail {
  raport: RaportSiswa;
  semesterId: string;
  semesterLabel: string;
}

/** Raport lengkap satu siswa untuk satu semester (untuk halaman detail & cetak). Null bila siswa tak ada. */
export async function muatRaportSiswa(params: { siswaId: string; semester?: string }): Promise<RaportDetail | null> {
  await requireStaf();
  const s = pilihSemester(params.semester);
  const st = await prisma.student.findUnique({
    where: { id: params.siswaId },
    select: { id: true, nama: true, nisn: true, kelas: { select: { label: true } } },
  });
  if (!st) return null;

  const raport = await kumpulkanRaport(
    [{ id: st.id, nama: st.nama, nisn: st.nisn, kelasLabel: st.kelas.label }],
    s,
  );
  return {
    raport: raport.get(st.id)!,
    semesterId: semesterId(s),
    semesterLabel: labelSemester(s),
  };
}
