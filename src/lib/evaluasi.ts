/**
 * Agregasi Evaluasi (MURNI, tanpa IO) — dipakai server loader & route ekspor,
 * diuji langsung Vitest. Sumber: baris CheckpointResult (submitted). Rata-rata
 * pakai pembulatan yang sama dgn app lama (Math.round) supaya angka konsisten.
 */
import { klasifikasi, type Klasifikasi } from "./kelas";

export interface ResultRow {
  studentId: string;
  kelasLabel: string;
  period: string; // "YYYY-MM"
  numerasi: number;
  literasi: number;
  total: number;
}

export function rata(xs: number[]): number {
  return xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : 0;
}

/* ── Ringkasan satu cakupan (mis. periode berjalan, kelas terpilih) ── */
export interface Ringkas {
  jumlah: number; // total siswa target
  ikut: number; // yang sudah Check Point
  belum: number;
  numerasi: number | null;
  literasi: number | null;
  total: number | null;
  klas: Klasifikasi | null;
}

export function ringkasan(jumlahTarget: number, results: ResultRow[]): Ringkas {
  const ikut = results.length;
  const total = ikut ? rata(results.map((r) => r.total)) : null;
  return {
    jumlah: jumlahTarget,
    ikut,
    belum: Math.max(0, jumlahTarget - ikut),
    numerasi: ikut ? rata(results.map((r) => r.numerasi)) : null,
    literasi: ikut ? rata(results.map((r) => r.literasi)) : null,
    total,
    klas: total != null ? klasifikasi(total) : null,
  };
}

/* ── Rekap per kelas untuk satu periode ── */
export interface RekapKelas {
  kelasLabel: string;
  jumlah: number;
  ikut: number;
  belum: number;
  numerasi: number | null;
  literasi: number | null;
  total: number | null;
  klas: Klasifikasi | null;
}

/**
 * Satu baris per kelas. `kelasJumlah` = daftar {label, jumlah siswa aktif} (sumber
 * kebenaran jumlah); `results` = hasil periode itu (semua kelas). Kelas tanpa hasil
 * tetap muncul (ikut 0) agar guru lihat yang belum jalan.
 */
export function rekapPerKelas(
  kelasJumlah: { label: string; jumlah: number }[],
  results: ResultRow[],
): RekapKelas[] {
  const byKelas = new Map<string, ResultRow[]>();
  for (const r of results) {
    const arr = byKelas.get(r.kelasLabel) ?? [];
    arr.push(r);
    byKelas.set(r.kelasLabel, arr);
  }
  return kelasJumlah.map(({ label, jumlah }) => {
    const rs = byKelas.get(label) ?? [];
    const total = rs.length ? rata(rs.map((r) => r.total)) : null;
    return {
      kelasLabel: label,
      jumlah,
      ikut: rs.length,
      belum: Math.max(0, jumlah - rs.length),
      numerasi: rs.length ? rata(rs.map((r) => r.numerasi)) : null,
      literasi: rs.length ? rata(rs.map((r) => r.literasi)) : null,
      total,
      klas: total != null ? klasifikasi(total) : null,
    };
  });
}

/* ── Deret perkembangan antar periode (untuk grafik garis) ── */
export interface TitikPerkembangan {
  period: string;
  numerasi: number | null;
  literasi: number | null;
  total: number | null;
}

/** Untuk tiap periode di `periods`, rata-rata dari `results` di periode itu (null bila kosong). */
export function perkembangan(periods: string[], results: ResultRow[]): TitikPerkembangan[] {
  const byPeriod = new Map<string, ResultRow[]>();
  for (const r of results) {
    const arr = byPeriod.get(r.period) ?? [];
    arr.push(r);
    byPeriod.set(r.period, arr);
  }
  return periods.map((p) => {
    const rs = byPeriod.get(p) ?? [];
    return {
      period: p,
      numerasi: rs.length ? rata(rs.map((r) => r.numerasi)) : null,
      literasi: rs.length ? rata(rs.map((r) => r.literasi)) : null,
      total: rs.length ? rata(rs.map((r) => r.total)) : null,
    };
  });
}
