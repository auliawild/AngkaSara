/**
 * Agregasi Laporan Progres & Raport (MURNI, tanpa IO) — dipakai loader server & diuji Vitest.
 *
 * Nilai AKHIR raport = Check Point (asesmen formal bulanan). SKIBA Math & SKIBACA ditampilkan
 * sebagai capaian latihan mandiri (pendukung), bukan penentu nilai akhir. Semua rata-rata
 * memakai Math.round agar konsisten dengan modul Evaluasi ([[evaluasi]]).
 */
import { klasifikasi, type Klasifikasi } from "./kelas";

export function rata(xs: number[]): number {
  return xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : 0;
}

/* ── Denominator acuan (untuk konteks "x dari y") ── */
export const SKIBA_TOTAL_TOPIK = 10; // TOPICS di soal-numerasi.ts
export const SKIBA_LEVEL_PER_TOPIK = 20; // Arena 20 level per topik
export const SKIBA_TOTAL_LEVEL = SKIBA_TOTAL_TOPIK * SKIBA_LEVEL_PER_TOPIK; // 200

/* ── Check Point (nilai formal) ── */
export interface CpRow {
  period: string; // "YYYY-MM"
  numerasi: number;
  literasi: number;
  total: number;
}

export interface AgregatCp {
  ikut: number; // jumlah bulan ikut Check Point dalam semester
  numerasi: number | null;
  literasi: number | null;
  total: number | null;
  klas: Klasifikasi | null;
  perBulan: CpRow[]; // urut naik menurut period
}

export function agregatCheckpoint(rows: CpRow[]): AgregatCp {
  const perBulan = [...rows].sort((a, b) => (a.period < b.period ? -1 : a.period > b.period ? 1 : 0));
  const ikut = perBulan.length;
  const total = ikut ? rata(perBulan.map((r) => r.total)) : null;
  return {
    ikut,
    numerasi: ikut ? rata(perBulan.map((r) => r.numerasi)) : null,
    literasi: ikut ? rata(perBulan.map((r) => r.literasi)) : null,
    total,
    klas: total != null ? klasifikasi(total) : null,
    perBulan,
  };
}

/* ── SKIBA Math (latihan numerasi) — snapshot kumulatif capaian ── */
export interface SkibaState {
  topicId: string;
  score: number; // akumulasi poin (combo) di topik
  progress: number[]; // level yang pernah diselesaikan (1..20)
}

export interface AgregatSkiba {
  topikMain: number; // topik dgn ≥1 level selesai
  levelSelesai: number; // total level selesai (semua topik)
  totalPoin: number; // jumlah poin
  topikTuntas: number; // topik dgn 20 level selesai
}

export function agregatSkiba(states: SkibaState[]): AgregatSkiba {
  let levelSelesai = 0;
  let totalPoin = 0;
  let topikMain = 0;
  let topikTuntas = 0;
  for (const s of states) {
    const n = s.progress.length;
    if (n > 0) topikMain++;
    if (n >= SKIBA_LEVEL_PER_TOPIK) topikTuntas++;
    levelSelesai += Math.min(n, SKIBA_LEVEL_PER_TOPIK);
    totalPoin += s.score;
  }
  return { topikMain, levelSelesai, totalPoin, topikTuntas };
}

/* ── SKIBACA (latihan literasi) — snapshot kumulatif capaian ── */
export interface SkibacaProg {
  percent: number; // skor kuis terbaik 0..100
  wpm: number;
}
export interface SkibacaSum {
  score: number | null; // skor ringkasan dari guru; null = belum dinilai
}

export interface AgregatSkibaca {
  bacaanSelesai: number; // jumlah bacaan kuis yang dikerjakan
  rataPersen: number | null; // rata skor kuis
  rataWpm: number | null; // rata kecepatan baca
  ringkasanKirim: number;
  ringkasanDinilai: number;
  rataRingkasan: number | null; // rata skor ringkasan yang sudah dinilai
}

export function agregatSkibaca(progress: SkibacaProg[], summaries: SkibacaSum[]): AgregatSkibaca {
  const dinilai = summaries.filter((s) => s.score != null).map((s) => s.score as number);
  return {
    bacaanSelesai: progress.length,
    rataPersen: progress.length ? rata(progress.map((p) => p.percent)) : null,
    rataWpm: progress.length ? rata(progress.map((p) => p.wpm)) : null,
    ringkasanKirim: summaries.length,
    ringkasanDinilai: dinilai.length,
    rataRingkasan: dinilai.length ? rata(dinilai) : null,
  };
}

/* ── Hasil Tes Diagnostik (asesmen awal) — jadi titik awal grafik perkembangan ── */
export interface DiagNumerasi {
  score: number; // skor % diagnostik SKIBA (0..100)
  levelRata: number; // rata level rekomendasi antar topik (1..20)
  at: string | null; // ISO waktu tes (untuk info)
}
export interface DiagLiterasi {
  jurusanKode: string;
  recommended: number; // level saran 1..5
  rataScore: number; // rata skor % antar level yang diujikan (0..100)
  at: string | null;
}

/** Level rekomendasi 1..20 dari skor 0..100 (padanan levelRata di lib/skiba). */
function levelDariSkor(pct: number): number {
  const L = Math.round((pct / 100) * 19) + 1;
  return L < 1 ? 1 : L > 20 ? 20 : L;
}

export function agregatDiagNumerasi(input: {
  score: number | null;
  at: string | null;
  recLevels: number[];
}): DiagNumerasi | null {
  if (input.score == null) return null;
  const levelRata = input.recLevels.length
    ? Math.round(input.recLevels.reduce((s, x) => s + x, 0) / input.recLevels.length)
    : levelDariSkor(input.score);
  return { score: input.score, levelRata, at: input.at };
}

export function agregatDiagLiterasi(
  input: { jurusanKode: string; recommended: number; scores: Record<string, number>; at: string | null } | null,
): DiagLiterasi | null {
  if (!input) return null;
  const vals = Object.values(input.scores).filter((v) => typeof v === "number");
  const rataScore = vals.length ? Math.round(vals.reduce((s, x) => s + x, 0) / vals.length) : 0;
  return { jurusanKode: input.jurusanKode, recommended: input.recommended, rataScore, at: input.at };
}

/* ── Grafik perkembangan: baseline diagnostik → skor Check Point tiap bulan ── */
export interface TitikPerkembangan {
  label: string; // "Awal" atau "Bln YYYY"
  numerasi: number | null; // 0..100 (null = tak ada data pada titik ini)
  literasi: number | null;
}

const BULAN_SINGKAT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
function labelBulanSingkat(period: string): string {
  const [th, bl] = period.split("-");
  return `${BULAN_SINGKAT[Number(bl) - 1] ?? bl} ${th}`;
}

/**
 * Rangkai titik perkembangan: titik pertama "Awal" dari diagnostik (bila ada minimal satu domain),
 * lalu satu titik per bulan Check Point (skor numerasi & literasi). Semua di skala 0..100.
 */
export function bangunPerkembangan(input: {
  diagNumerasi: number | null;
  diagLiterasi: number | null;
  cpRows: CpRow[];
}): TitikPerkembangan[] {
  const titik: TitikPerkembangan[] = [];
  if (input.diagNumerasi != null || input.diagLiterasi != null) {
    titik.push({ label: "Awal", numerasi: input.diagNumerasi, literasi: input.diagLiterasi });
  }
  const cp = [...input.cpRows].sort((a, b) => (a.period < b.period ? -1 : a.period > b.period ? 1 : 0));
  for (const r of cp) {
    titik.push({ label: labelBulanSingkat(r.period), numerasi: r.numerasi, literasi: r.literasi });
  }
  return titik;
}

/* ── Raport lengkap satu siswa ── */
export interface IdentitasSiswa {
  nama: string;
  nisn: string;
  kelasLabel: string;
}

export interface RaportSiswa extends IdentitasSiswa {
  cp: AgregatCp;
  skiba: AgregatSkiba;
  skibaca: AgregatSkibaca;
  diagNum: DiagNumerasi | null; // hasil tes diagnostik numerasi (SKIBA)
  diagLit: DiagLiterasi | null; // hasil tes diagnostik literasi (SKIBACA)
  perkembangan: TitikPerkembangan[]; // baseline diagnostik → Check Point (untuk lampiran grafik)
  aktivitasNumerasi: number; // jumlah PracticeActivity NUMERASI dalam semester (keaktifan latihan)
  aktivitasLiterasi: number; // jumlah PracticeActivity LITERASI dalam semester
}

export function bangunRaport(input: {
  identitas: IdentitasSiswa;
  cpRows: CpRow[];
  skibaStates: SkibaState[];
  skibacaProgress: SkibacaProg[];
  skibacaSummaries: SkibacaSum[];
  diagNum: DiagNumerasi | null;
  diagLit: DiagLiterasi | null;
  aktivitasNumerasi: number;
  aktivitasLiterasi: number;
}): RaportSiswa {
  return {
    ...input.identitas,
    cp: agregatCheckpoint(input.cpRows),
    skiba: agregatSkiba(input.skibaStates),
    skibaca: agregatSkibaca(input.skibacaProgress, input.skibacaSummaries),
    diagNum: input.diagNum,
    diagLit: input.diagLit,
    perkembangan: bangunPerkembangan({
      diagNumerasi: input.diagNum?.score ?? null,
      diagLiterasi: input.diagLit?.rataScore ?? null,
      cpRows: input.cpRows,
    }),
    aktivitasNumerasi: input.aktivitasNumerasi,
    aktivitasLiterasi: input.aktivitasLiterasi,
  };
}

/* ── Baris ringkas untuk tabel per-kelas ── */
export interface BarisKelas {
  siswaId: string;
  nama: string;
  nisn: string;
  cpIkut: number; // bulan ikut Check Point (semester)
  cpTotal: number | null; // rata nilai akhir Check Point
  klas: Klasifikasi | null;
  skibaLevel: number; // level SKIBA selesai (kumulatif)
  skibacaBacaan: number; // bacaan SKIBACA selesai (kumulatif)
  aktivitas: number; // total aktivitas latihan dalam semester (numerasi+literasi)
}

export function barisDariRaport(siswaId: string, r: RaportSiswa): BarisKelas {
  return {
    siswaId,
    nama: r.nama,
    nisn: r.nisn,
    cpIkut: r.cp.ikut,
    cpTotal: r.cp.total,
    klas: r.cp.klas,
    skibaLevel: r.skiba.levelSelesai,
    skibacaBacaan: r.skibaca.bacaanSelesai,
    aktivitas: r.aktivitasNumerasi + r.aktivitasLiterasi,
  };
}
