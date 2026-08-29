import { prisma } from "@/lib/db";
import { lingkupKelas, bolehKelas, whereLabel, dibatasiKe, type Lingkup } from "@/server/lingkup";
import { urutkanKelas, BULAN_PANJANG } from "@/lib/kelas";
import {
  agregatDiagLiterasi,
  agregatDiagNumerasi,
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
  tahunAjaran,
  type Semester,
} from "@/lib/semester";
import { agregatProgres, agregatKalender, agregatBulan, type ProgresData, type KalenderData } from "@/lib/progres";
import type { BucketMode } from "@/lib/kelas";

/** Opsi filter (kelas & semester) — dipakai halaman daftar laporan. */
export interface OpsiLaporan {
  kelasOpsi: string[];
  semesterOpsi: { id: string; label: string }[];
  /** Kelas yang menjadi lingkup staf ini; null = semua kelas (tak dibatasi). */
  dibatasiKe: string[] | null;
}

async function opsiSemester(l: Lingkup): Promise<Semester[]> {
  const labelIn = whereLabel(l);
  const rows = await prisma.checkpointResult.findMany({
    where: { status: "submitted", ...(labelIn ? { kelasLabel: labelIn } : {}) },
    distinct: ["period"],
    select: { period: true },
  });
  return daftarSemester(rows.map((r) => r.period));
}

/**
 * Opsi filter, sudah dipersempit ke lingkup kelas staf. Ini sekaligus penjaga utama
 * `muatLaporanKelas`: kelas di luar lingkup tak pernah lolos validasi `kelasOpsi`.
 */
export async function muatOpsiLaporan(): Promise<OpsiLaporan> {
  const lingkup = await lingkupKelas();
  const labelIn = whereLabel(lingkup);
  const kelasRows = await prisma.kelas.findMany({
    where: { aktif: true, ...(labelIn ? { label: labelIn } : {}) },
    select: { label: true },
  });
  const sems = await opsiSemester(lingkup);
  return {
    kelasOpsi: kelasRows.map((k) => k.label).sort(urutkanKelas),
    semesterOpsi: sems.map((s) => ({ id: semesterId(s), label: labelSemester(s) })),
    dibatasiKe: dibatasiKe(lingkup),
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

/** Parse skor diagnostik SKIBACA ({"1":80,...}) jadi Record<string, number>. */
function parseScores(json: string): Record<string, number> {
  try {
    const obj = JSON.parse(json);
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(obj)) if (typeof v === "number") out[k] = v;
      return out;
    }
  } catch {
    /* abaikan */
  }
  return {};
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

  const [cpRows, skibaRows, progRows, sumRows, aktRows, profRows, diagLitRows] = await Promise.all([
    prisma.checkpointResult.findMany({
      where: { studentId: { in: ids }, status: "submitted", period: { in: periods } },
      select: { studentId: true, period: true, numerasi: true, literasi: true, total: true },
    }),
    prisma.skibaTopicState.findMany({
      where: { studentId: { in: ids } },
      select: { studentId: true, score: true, progress: true, recLevel: true },
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
    prisma.skibaProfile.findMany({
      where: { studentId: { in: ids } },
      select: { studentId: true, diagScore: true, diagAt: true },
    }),
    prisma.skibacaDiagnostic.findMany({
      where: { studentId: { in: ids } },
      select: { studentId: true, jurusanKode: true, recommended: true, scores: true, updatedAt: true },
      orderBy: { updatedAt: "desc" }, // paling baru dulu → dipakai per siswa
    }),
  ]);

  const cpBy = new Map<string, CpRow[]>();
  for (const r of cpRows) {
    const arr = cpBy.get(r.studentId) ?? [];
    arr.push({ period: r.period, numerasi: r.numerasi, literasi: r.literasi, total: r.total });
    cpBy.set(r.studentId, arr);
  }
  const skibaBy = new Map<string, SkibaState[]>();
  const recLevelsBy = new Map<string, number[]>();
  for (const r of skibaRows) {
    const arr = skibaBy.get(r.studentId) ?? [];
    arr.push({ topicId: "", score: r.score, progress: parseProgress(r.progress) });
    skibaBy.set(r.studentId, arr);
    const rl = recLevelsBy.get(r.studentId) ?? [];
    rl.push(r.recLevel);
    recLevelsBy.set(r.studentId, rl);
  }
  const profBy = new Map<string, { diagScore: number | null; diagAt: Date | null }>();
  for (const r of profRows) profBy.set(r.studentId, { diagScore: r.diagScore, diagAt: r.diagAt });
  // diagLitRows sudah urut updatedAt desc → ambil yang PERTAMA per siswa (terbaru).
  const diagLitBy = new Map<string, (typeof diagLitRows)[number]>();
  for (const r of diagLitRows) if (!diagLitBy.has(r.studentId)) diagLitBy.set(r.studentId, r);
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
    const prof = profBy.get(st.id);
    const diagNum = agregatDiagNumerasi({
      score: prof?.diagScore ?? null,
      at: prof?.diagAt ? prof.diagAt.toISOString() : null,
      recLevels: recLevelsBy.get(st.id) ?? [],
    });
    const dl = diagLitBy.get(st.id);
    const diagLit = agregatDiagLiterasi(
      dl
        ? {
            jurusanKode: dl.jurusanKode,
            recommended: dl.recommended,
            scores: parseScores(dl.scores),
            at: dl.updatedAt.toISOString(),
          }
        : null,
    );
    out.set(
      st.id,
      bangunRaport({
        identitas: { nama: st.nama, nisn: st.nisn, kelasLabel: st.kelasLabel },
        cpRows: cpBy.get(st.id) ?? [],
        skibaStates: skibaBy.get(st.id) ?? [],
        skibacaProgress: progBy.get(st.id) ?? [],
        skibacaSummaries: sumBy.get(st.id) ?? [],
        diagNum,
        diagLit,
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
  dibatasiKe: string[] | null;
}

/** Daftar progres siswa satu kelas untuk satu semester. Kelas di luar lingkup staf → dianggap belum dipilih. */
export async function muatLaporanKelas(params: { kelas?: string; semester?: string }): Promise<LaporanKelas> {
  const opsi = await muatOpsiLaporan(); // sekaligus penjaga sesi + penyaring lingkup
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
    dibatasiKe: opsi.dibatasiKe,
  };
}

export interface RaportDetail {
  raport: RaportSiswa;
  semesterId: string;
  semesterLabel: string;
  tahunAjaran: string; // "2026/2027"
}

/**
 * Raport lengkap satu siswa untuk satu semester (untuk halaman detail & cetak).
 * Null bila siswa tak ada ATAU kelasnya di luar lingkup staf (halaman memanggil `notFound()`).
 */
export async function muatRaportSiswa(params: { siswaId: string; semester?: string }): Promise<RaportDetail | null> {
  const lingkup = await lingkupKelas();
  const s = pilihSemester(params.semester);
  const st = await prisma.student.findUnique({
    where: { id: params.siswaId },
    select: { id: true, nama: true, nisn: true, kelas: { select: { label: true } } },
  });
  if (!st || !bolehKelas(lingkup, st.kelas.label)) return null;

  const raport = await kumpulkanRaport(
    [{ id: st.id, nama: st.nama, nisn: st.nisn, kelasLabel: st.kelas.label }],
    s,
  );
  return {
    raport: raport.get(st.id)!,
    semesterId: semesterId(s),
    semesterLabel: labelSemester(s),
    tahunAjaran: tahunAjaran(s),
  };
}

export interface RaportKelas {
  kelas: string;
  semesterId: string;
  semesterLabel: string;
  tahunAjaran: string; // "2026/2027"
  daftar: { id: string; raport: RaportSiswa }[];
}

/** Raport seluruh siswa aktif satu kelas (untuk cetak sekelas). Null bila kelas tak dikenal / di luar lingkup. */
export async function muatRaportKelas(params: { kelas: string; semester?: string }): Promise<RaportKelas | null> {
  const lingkup = await lingkupKelas();
  if (!bolehKelas(lingkup, params.kelas)) return null;
  const s = pilihSemester(params.semester);
  const kelasRow = await prisma.kelas.findUnique({ where: { label: params.kelas }, select: { label: true } });
  if (!kelasRow) return null;

  const students = await prisma.student.findMany({
    where: { aktif: true, kelas: { label: params.kelas } },
    select: { id: true, nama: true, nisn: true },
    orderBy: { nama: "asc" },
  });
  const map = await kumpulkanRaport(
    students.map((x) => ({ ...x, kelasLabel: params.kelas })),
    s,
  );
  return {
    kelas: params.kelas,
    semesterId: semesterId(s),
    semesterLabel: labelSemester(s),
    tahunAjaran: tahunAjaran(s),
    daftar: students.map((st) => ({ id: st.id, raport: map.get(st.id)! })),
  };
}

const MODE_SAH: BucketMode[] = ["hari", "minggu", "bulan"];

/** Normalisasi mode bucket dari param URL (default mingguan). */
export function pilihMode(m?: string): BucketMode {
  return m && (MODE_SAH as string[]).includes(m) ? (m as BucketMode) : "minggu";
}

/**
 * Progres latihan satu siswa dibucket harian/mingguan/bulanan (dari PracticeActivity).
 * Ambil aktivitas ≤ ~400 hari terakhir (cukup untuk jendela terbesar: 12 bulan). Null bila siswa tak ada.
 */
export async function muatProgresSiswa(params: { siswaId: string; mode?: string }): Promise<ProgresData | null> {
  const lingkup = await lingkupKelas();
  const st = await prisma.student.findUnique({
    where: { id: params.siswaId },
    select: { id: true, kelas: { select: { label: true } } },
  });
  if (!st || !bolehKelas(lingkup, st.kelas.label)) return null;

  const mode = pilihMode(params.mode);
  const sejak = new Date();
  sejak.setDate(sejak.getDate() - 400);
  const akt = await prisma.practiceActivity.findMany({
    where: { studentId: st.id, createdAt: { gte: sejak } },
    select: { createdAt: true, domain: true, score: true, points: true },
  });
  return agregatProgres(
    akt.map((a) => ({ ts: a.createdAt, domain: a.domain, score: a.score, points: a.points ?? 0 })),
    mode,
  );
}

/** Label jendela untuk tiap mode (dipakai judul cetak progres). */
export const KET_MODE: Record<BucketMode, string> = {
  hari: "14 hari terakhir",
  minggu: "12 minggu terakhir",
  bulan: "12 bulan terakhir",
  tahun: "5 tahun terakhir",
};

export interface BarisProgresKelas {
  siswaId: string;
  nama: string;
  nisn: string;
  totalNum: number; // jumlah pengerjaan numerasi
  totalLit: number; // jumlah pengerjaan literasi
  totalPoin: number;
  rataNum: number | null; // mutu: rata skor numerasi
  rataLit: number | null;
  // Check Point bulan ini (nilai formal 0–100); null = belum dikerjakan bulan ini.
  cpNumerasi: number | null;
  cpLiterasi: number | null;
  cpTotal: number | null;
}
export interface ProgresKelas {
  kelas: string;
  bulanId: string; // "YYYY-MM"
  bulanLabel: string; // "Juli 2026"
  prev: string;
  next: string;
  baris: BarisProgresKelas[];
}

/**
 * Rekap progres latihan seluruh siswa aktif satu kelas untuk SATU BULAN kalender (tabel cetak sekelas).
 * Tarik PracticeActivity bulan itu sekali, agregat per siswa. Null bila kelas tak dikenal. Default = bulan berjalan.
 */
export async function muatProgresKelas(params: { kelas: string; bulan?: string }): Promise<ProgresKelas | null> {
  const lingkup = await lingkupKelas();
  if (!bolehKelas(lingkup, params.kelas)) return null;
  const kelasRow = await prisma.kelas.findUnique({ where: { label: params.kelas }, select: { label: true } });
  if (!kelasRow) return null;

  const { tahun, bulan, mulai, selesai, bulanId, bulanLabel, prev, next } = infoBulan(params.bulan);
  const students = await prisma.student.findMany({
    where: { aktif: true, kelas: { label: params.kelas } },
    select: { id: true, nama: true, nisn: true },
    orderBy: { nama: "asc" },
  });
  const ids = students.map((s) => s.id);

  const akt = ids.length
    ? await prisma.practiceActivity.findMany({
        where: { studentId: { in: ids }, createdAt: { gte: mulai, lt: selesai } },
        select: { studentId: true, createdAt: true, domain: true, score: true, points: true },
      })
    : [];

  // Check Point bulan ini (nilai formal) — 1 baris/siswa/bulan.
  const cp = ids.length
    ? await prisma.checkpointResult.findMany({
        where: { studentId: { in: ids }, period: bulanId, status: "submitted" },
        select: { studentId: true, numerasi: true, literasi: true, total: true },
      })
    : [];
  const cpByStudent = new Map(cp.map((r) => [r.studentId, r]));

  const byStudent = new Map<string, { ts: Date; domain: string; score: number; points: number }[]>();
  for (const a of akt) {
    const arr = byStudent.get(a.studentId) ?? [];
    arr.push({ ts: a.createdAt, domain: a.domain, score: a.score, points: a.points ?? 0 });
    byStudent.set(a.studentId, arr);
  }

  const baris: BarisProgresKelas[] = students.map((st) => {
    const r = agregatBulan(byStudent.get(st.id) ?? [], tahun, bulan);
    const c = cpByStudent.get(st.id) ?? null;
    return {
      siswaId: st.id,
      nama: st.nama,
      nisn: st.nisn,
      totalNum: r.totalNum,
      totalLit: r.totalLit,
      totalPoin: r.totalPoin,
      rataNum: r.rataNum,
      rataLit: r.rataLit,
      cpNumerasi: c?.numerasi ?? null,
      cpLiterasi: c?.literasi ?? null,
      cpTotal: c?.total ?? null,
    };
  });

  return { kelas: params.kelas, bulanId, bulanLabel, prev, next, baris };
}

/* ── Kalender latihan harian (satu bulan) ── */

/** Parse "YYYY-MM" → {tahun, bulan 1..12}. Default: bulan berjalan. */
function parseBulan(s?: string): { tahun: number; bulan: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(s ?? "");
  if (m) {
    const th = Number(m[1]);
    const bl = Number(m[2]);
    if (bl >= 1 && bl <= 12) return { tahun: th, bulan: bl };
  }
  const now = new Date();
  return { tahun: now.getFullYear(), bulan: now.getMonth() + 1 };
}
const idBulan = (th: number, bl: number) => `${th}-${String(bl).padStart(2, "0")}`;

/** Semua info satu bulan kalender dari "YYYY-MM": rentang tanggal, label, id, prev/next. */
function infoBulan(s?: string) {
  const { tahun, bulan } = parseBulan(s);
  const prevB = bulan === 1 ? { th: tahun - 1, bl: 12 } : { th: tahun, bl: bulan - 1 };
  const nextB = bulan === 12 ? { th: tahun + 1, bl: 1 } : { th: tahun, bl: bulan + 1 };
  return {
    tahun,
    bulan,
    mulai: new Date(tahun, bulan - 1, 1),
    selesai: new Date(tahun, bulan, 1), // awal bulan berikutnya (eksklusif)
    bulanId: idBulan(tahun, bulan),
    bulanLabel: `${BULAN_PANJANG[bulan - 1]} ${tahun}`,
    prev: idBulan(prevB.th, prevB.bl),
    next: idBulan(nextB.th, nextB.bl),
  };
}

export interface KalenderSiswa {
  nama: string;
  nisn: string;
  kelasLabel: string;
  bulanId: string; // "YYYY-MM"
  bulanLabel: string; // "Juli 2026"
  prev: string; // "YYYY-MM"
  next: string;
  kal: KalenderData;
}

/** Kalender latihan harian satu siswa untuk satu bulan (layar & cetak). Null bila siswa tak ada / di luar lingkup. */
export async function muatKalenderSiswa(params: { siswaId: string; bulan?: string }): Promise<KalenderSiswa | null> {
  const lingkup = await lingkupKelas();
  const st = await prisma.student.findUnique({
    where: { id: params.siswaId },
    select: { id: true, nama: true, nisn: true, kelas: { select: { label: true } } },
  });
  if (!st || !bolehKelas(lingkup, st.kelas.label)) return null;

  const { tahun, bulan, mulai, selesai, bulanId, bulanLabel, prev, next } = infoBulan(params.bulan);

  const akt = await prisma.practiceActivity.findMany({
    where: { studentId: st.id, createdAt: { gte: mulai, lt: selesai } },
    select: { createdAt: true, domain: true, score: true, points: true },
  });
  const kal = agregatKalender(
    akt.map((a) => ({ ts: a.createdAt, domain: a.domain, score: a.score, points: a.points ?? 0 })),
    tahun,
    bulan,
  );

  return { nama: st.nama, nisn: st.nisn, kelasLabel: st.kelas.label, bulanId, bulanLabel, prev, next, kal };
}
