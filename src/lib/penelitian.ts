/**
 * Agregasi DATA PENELITIAN tingkat SEKOLAH (MURNI, tanpa IO) — dipakai loader server & diuji Vitest.
 *
 * Tujuan: menyajikan rata-rata satu sekolah (dan rincian per kelas) untuk tiga ranah —
 *   1) Tes Diagnostik  : SKIBA Math (skor % awal) & SKIBACA (skor % antar level, level saran)
 *   2) Check Point      : nilai formal bulanan (numerasi / literasi / total), kumulatif
 *   3) Progres pengerjaan: capaian latihan SKIBA (level) & SKIBACA (bacaan) + keaktifan
 *
 * KONVENSI RATA-RATA (penting untuk validitas penelitian):
 *  - Diagnostik & Check Point → rata-rata dihitung HANYA atas siswa yang MENGIKUTI
 *    (punya datanya). Jumlah pengikut (`*N`) selalu dilaporkan agar cakupan (coverage) jelas.
 *  - Progres pengerjaan → rata-rata dihitung atas SELURUH siswa (yang belum mengerjakan
 *    dihitung 0), karena "belum mengerjakan" adalah data progres yang sah. Kecuali mutu
 *    (rata % kuis & WPM SKIBACA) yang hanya atas siswa yang sudah membaca (mutu tak
 *    terdefinisi bila 0 bacaan).
 *
 * Skor % memakai pembulatan bilangan bulat (konsisten dgn Evaluasi/Raport). Rata-rata
 * "cacahan" per siswa (level, bacaan, poin, aktivitas) memakai 1 desimal agar informatif.
 *
 * SKALA PENILAIAN BERSAMA: seluruh skor asesmen — Diagnostik SKIBA (numerasi), Diagnostik
 * SKIBACA (literasi), dan Check Point (numerasi & literasi) — memakai skala TUNGGAL 0..100
 * dengan band `klasifikasi()` yang sama (Perlu Bimbingan / Cukup / Baik / Mahir). Ini yang
 * membuat SKIBA Math & SKIBACA dapat dibandingkan langsung dan digambar pada satu grafik.
 */
import { klasifikasi, BULAN_PENDEK, type Klasifikasi } from "./kelas";

export const SKALA_MAKS = 100; // skala penilaian bersama SKIBA & SKIBACA

/* ── Pembulatan ── */
function bulat(x: number): number {
  return Math.round(x);
}
function bulat1(x: number): number {
  return Math.round(x * 10) / 10;
}

/** Rata-rata atas nilai yang ADA (null diabaikan). Mengembalikan cacah pengikut & rata (bulat). */
export function rataAda(xs: (number | null | undefined)[]): { n: number; rata: number | null } {
  const v = xs.filter((x): x is number => typeof x === "number");
  return { n: v.length, rata: v.length ? bulat(v.reduce((s, x) => s + x, 0) / v.length) : null };
}

/** Rata-rata atas SEMUA nilai (kosong → 0), 1 desimal. */
function rataSemua(xs: number[]): number {
  return xs.length ? bulat1(xs.reduce((s, x) => s + x, 0) / xs.length) : 0;
}

/* ── Metrik satu siswa (masukan agregasi) ── */
export interface SiswaMetrik {
  kelasLabel: string;
  // Tes Diagnostik SKIBA (numerasi)
  diagSkibaSkor: number | null; // 0..100 (null = belum tes diagnostik SKIBA)
  diagSkibaLevel: number | null; // rata level rekomendasi antar topik 1..20 (null bila belum diagnostik)
  // Tes Diagnostik SKIBACA (literasi)
  diagBacaSkor: number | null; // rata skor % antar level yang diujikan 0..100
  diagBacaRec: number | null; // level saran 1..5
  // Check Point (kumulatif — rata antar bulan siswa)
  cpNumerasi: number | null;
  cpLiterasi: number | null;
  cpTotal: number | null;
  cpBulan: number; // jumlah bulan ikut Check Point
  // Progres SKIBA
  skibaLevel: number; // level selesai kumulatif (0..200)
  skibaPoin: number; // total poin
  skibaTuntas: number; // topik tuntas (20 level)
  // Progres SKIBACA
  bacaSelesai: number; // bacaan kuis dikerjakan
  bacaPersen: number | null; // rata % kuis (null bila belum ada bacaan)
  bacaWpm: number | null; // rata WPM (null bila belum ada bacaan)
  // Keaktifan latihan
  aktivitasNum: number;
  aktivitasLit: number;
}

/* ── Agregat satu kelompok (sekolah atau satu kelas) ── */
export interface AgregatPenelitian {
  jumlahSiswa: number;
  // Diagnostik SKIBA
  diagSkibaN: number;
  diagSkibaSkor: number | null;
  diagSkibaLevel: number | null;
  // Diagnostik SKIBACA
  diagBacaN: number;
  diagBacaSkor: number | null;
  diagBacaRec: number | null;
  // Check Point
  cpN: number; // siswa yang pernah ikut Check Point
  cpNumerasi: number | null;
  cpLiterasi: number | null;
  cpTotal: number | null;
  // Progres SKIBA (atas seluruh siswa)
  skibaLevelRata: number;
  skibaLevelTotal: number;
  skibaPoinRata: number;
  skibaTuntasTotal: number;
  // Progres SKIBACA
  bacaN: number; // siswa yang pernah membaca (untuk mutu)
  bacaSelesaiRata: number;
  bacaSelesaiTotal: number;
  bacaPersen: number | null;
  bacaWpm: number | null;
  // Keaktifan
  aktivitasNumRata: number;
  aktivitasLitRata: number;
}

/** Ringkas sekumpulan siswa menjadi satu agregat (sekolah atau satu kelas). */
export function agregat(rows: SiswaMetrik[]): AgregatPenelitian {
  const dSkibaSkor = rataAda(rows.map((r) => r.diagSkibaSkor));
  const dSkibaLevel = rataAda(rows.map((r) => r.diagSkibaLevel));
  const dBacaSkor = rataAda(rows.map((r) => r.diagBacaSkor));
  const dBacaRec = rataAda(rows.map((r) => r.diagBacaRec));
  const cpNum = rataAda(rows.map((r) => r.cpNumerasi));
  const cpLit = rataAda(rows.map((r) => r.cpLiterasi));
  const cpTot = rataAda(rows.map((r) => r.cpTotal));
  const bacaPersen = rataAda(rows.filter((r) => r.bacaSelesai > 0).map((r) => r.bacaPersen));
  const bacaWpm = rataAda(rows.filter((r) => r.bacaSelesai > 0).map((r) => r.bacaWpm));
  return {
    jumlahSiswa: rows.length,
    diagSkibaN: dSkibaSkor.n,
    diagSkibaSkor: dSkibaSkor.rata,
    diagSkibaLevel: dSkibaLevel.rata,
    diagBacaN: dBacaSkor.n,
    diagBacaSkor: dBacaSkor.rata,
    diagBacaRec: dBacaRec.rata,
    cpN: cpTot.n,
    cpNumerasi: cpNum.rata,
    cpLiterasi: cpLit.rata,
    cpTotal: cpTot.rata,
    skibaLevelRata: rataSemua(rows.map((r) => r.skibaLevel)),
    skibaLevelTotal: rows.reduce((s, r) => s + r.skibaLevel, 0),
    skibaPoinRata: rataSemua(rows.map((r) => r.skibaPoin)),
    skibaTuntasTotal: rows.reduce((s, r) => s + r.skibaTuntas, 0),
    bacaN: rows.filter((r) => r.bacaSelesai > 0).length,
    bacaSelesaiRata: rataSemua(rows.map((r) => r.bacaSelesai)),
    bacaSelesaiTotal: rows.reduce((s, r) => s + r.bacaSelesai, 0),
    bacaPersen: bacaPersen.rata,
    bacaWpm: bacaWpm.rata,
    aktivitasNumRata: rataSemua(rows.map((r) => r.aktivitasNum)),
    aktivitasLitRata: rataSemua(rows.map((r) => r.aktivitasLit)),
  };
}

/* ── Rekap penelitian: sekolah + per kelas ── */
export interface AgregatKelas extends AgregatPenelitian {
  kelasLabel: string;
}
export interface RekapPenelitian {
  sekolah: AgregatPenelitian;
  perKelas: AgregatKelas[]; // urut sesuai comparator yang diberikan pemanggil
}

/**
 * Susun rekap: agregat seluruh sekolah + agregat tiap kelas. `urutKelas` = comparator label
 * (mis. urutkanKelas) agar urutan kelas konsisten dgn modul lain.
 */
export function rekapPenelitian(rows: SiswaMetrik[], urutKelas: (a: string, b: string) => number): RekapPenelitian {
  const perLabel = new Map<string, SiswaMetrik[]>();
  for (const r of rows) {
    const arr = perLabel.get(r.kelasLabel);
    if (arr) arr.push(r);
    else perLabel.set(r.kelasLabel, [r]);
  }
  const perKelas: AgregatKelas[] = [...perLabel.entries()]
    .sort((a, b) => urutKelas(a[0], b[0]))
    .map(([kelasLabel, list]) => ({ kelasLabel, ...agregat(list) }));
  return { sekolah: agregat(rows), perKelas };
}

/* ── Deret perkembangan tingkat SEKOLAH (siap grafik) ── */

/** "YYYY-MM" → "Agu 2026". */
export function labelPeriode(period: string): string {
  const [th, bl] = period.split("-");
  return `${BULAN_PENDEK[Number(bl) - 1] ?? bl} ${th}`;
}

/** Band klasifikasi bersama untuk suatu skor 0..100 (null bila tak ada data). */
export function bandSkor(skor: number | null): Klasifikasi | null {
  return skor == null ? null : klasifikasi(skor);
}

/** Rata Check Point satu bulan di tingkat sekolah (skala 0..100). */
export interface BulanCP {
  period: string; // "YYYY-MM"
  numerasi: number | null;
  literasi: number | null;
}

/**
 * Satu titik pada grafik perkembangan sekolah. Titik pertama = baseline diagnostik ("Awal"),
 * selanjutnya satu titik per bulan Check Point. `selisih*` = skor bulan itu − baseline
 * diagnostik (positif = naik dari asesmen awal), hanya untuk titik Check Point.
 */
export interface TitikSekolah {
  label: string;
  period: string | null; // null untuk baseline
  tipe: "diagnostik" | "checkpoint";
  numerasi: number | null;
  literasi: number | null;
  selisihNum: number | null;
  selisihLit: number | null;
}

/**
 * Rangkai deret perkembangan sekolah: baseline diagnostik (rata skor diagnostik SKIBA sbg
 * numerasi & SKIBACA sbg literasi) lalu rata Check Point tiap bulan. Bulan diurut menaik.
 * Skala tunggal 0..100 untuk kedua domain → langsung bisa digambar & dibandingkan.
 */
export function deretSekolah(
  baseline: { numerasi: number | null; literasi: number | null },
  cpPerBulan: BulanCP[],
): TitikSekolah[] {
  const titik: TitikSekolah[] = [];
  const adaBaseline = baseline.numerasi != null || baseline.literasi != null;
  if (adaBaseline) {
    titik.push({
      label: "Awal (Diagnostik)",
      period: null,
      tipe: "diagnostik",
      numerasi: baseline.numerasi,
      literasi: baseline.literasi,
      selisihNum: null,
      selisihLit: null,
    });
  }
  const selisih = (v: number | null, base: number | null) => (v == null || base == null ? null : v - base);
  const urut = [...cpPerBulan].sort((a, b) => (a.period < b.period ? -1 : a.period > b.period ? 1 : 0));
  for (const b of urut) {
    titik.push({
      label: labelPeriode(b.period),
      period: b.period,
      tipe: "checkpoint",
      numerasi: b.numerasi,
      literasi: b.literasi,
      selisihNum: selisih(b.numerasi, baseline.numerasi),
      selisihLit: selisih(b.literasi, baseline.literasi),
    });
  }
  return titik;
}
