/**
 * Semester & tahun ajaran (MURNI, tanpa IO) — dipakai loader Laporan Progres & raport.
 * Konvensi sekolah Indonesia:
 *   - Semester GANJIL  : Juli–Desember  (bulan 7..12)  → tahun ajaran `tahun/(tahun+1)`
 *   - Semester GENAP   : Januari–Juni   (bulan 1..6)   → tahun ajaran `(tahun-1)/tahun`
 * `tahun` = tahun kalender dari bulan-bulan semester itu (mis. Ganjil 2026 = Jul–Des 2026).
 * Periode Check Point berformat "YYYY-MM"; sebuah semester memuat 6 periode.
 */

export interface Semester {
  tahun: number; // tahun kalender bulan-bulan semester
  ganjil: boolean; // true = Ganjil (Jul–Des), false = Genap (Jan–Jun)
}

const p2 = (n: number) => String(n).padStart(2, "0");

/** Semester yang memuat tanggal `d` (default sekarang). */
export function semesterDari(d: Date = new Date()): Semester {
  return { tahun: d.getFullYear(), ganjil: d.getMonth() + 1 >= 7 };
}

/** Semester dari sebuah periode "YYYY-MM"; null bila format salah. */
export function semesterDariPeriode(period: string): Semester | null {
  const m = /^(\d{4})-(\d{2})$/.exec(period || "");
  if (!m) return null;
  const bln = Number(m[2]);
  if (bln < 1 || bln > 12) return null;
  return { tahun: Number(m[1]), ganjil: bln >= 7 };
}

/** Rentang tanggal [mulai, selesai) & daftar 6 periode "YYYY-MM" milik semester. */
export function rentangSemester(s: Semester): { mulai: Date; selesai: Date; periods: string[] } {
  const bulanAwal = s.ganjil ? 7 : 1;
  const bulanAkhir = s.ganjil ? 12 : 6;
  const mulai = new Date(s.tahun, bulanAwal - 1, 1, 0, 0, 0, 0);
  const selesai = new Date(s.tahun, bulanAkhir, 1, 0, 0, 0, 0); // eksklusif: 1 hari pertama bulan setelahnya
  const periods: string[] = [];
  for (let m = bulanAwal; m <= bulanAkhir; m++) periods.push(`${s.tahun}-${p2(m)}`);
  return { mulai, selesai, periods };
}

/** "2026/2027" (Ganjil) atau "2025/2026" (Genap). */
export function tahunAjaran(s: Semester): string {
  return s.ganjil ? `${s.tahun}/${s.tahun + 1}` : `${s.tahun - 1}/${s.tahun}`;
}

/** "Ganjil 2026/2027". */
export function labelSemester(s: Semester): string {
  return `${s.ganjil ? "Ganjil" : "Genap"} ${tahunAjaran(s)}`;
}

/** Id ringkas untuk URL: "2026-1" (Ganjil) / "2026-2" (Genap). */
export function semesterId(s: Semester): string {
  return `${s.tahun}-${s.ganjil ? "1" : "2"}`;
}

export function parseSemester(id: string): Semester | null {
  const m = /^(\d{4})-([12])$/.exec(id || "");
  if (!m) return null;
  return { tahun: Number(m[1]), ganjil: m[2] === "1" };
}

export function periodeDalamSemester(period: string, s: Semester): boolean {
  const ps = semesterDariPeriode(period);
  return !!ps && ps.tahun === s.tahun && ps.ganjil === s.ganjil;
}

/**
 * Daftar semester (terbaru dulu) yang punya data, diturunkan dari periode Check Point.
 * Selalu menyertakan semester sekarang agar filter tak pernah kosong.
 */
export function daftarSemester(periods: string[], now: Date = new Date()): Semester[] {
  const seen = new Map<string, Semester>();
  const kini = semesterDari(now);
  seen.set(semesterId(kini), kini);
  for (const p of periods) {
    const s = semesterDariPeriode(p);
    if (s) seen.set(semesterId(s), s);
  }
  const urut = (s: Semester) => s.tahun * 10 + (s.ganjil ? 2 : 1); // Ganjil (Jul–Des) lebih baru dari Genap tahun sama
  return [...seen.values()].sort((a, b) => urut(b) - urut(a));
}
