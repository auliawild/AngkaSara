/**
 * Peringkat gabungan SKIBA Math + SKIBACA (MURNI, tanpa IO) — dipakai loader server & diuji Vitest.
 *
 * Rumus (keputusan user 2026-07-19): **seimbang 50:50**.
 *   nilaiSkiba   = 50 × (level selesai / 200) + 50 × (rata skor arena / 100)
 *   nilaiSkibaca = 50 × (bacaan kuis selesai / 75) + 50 × (rata skor kuis / 100)
 *   nilai        = (nilaiSkiba + nilaiSkibaca) / 2            → 0..100
 *
 * Separuh "capaian" (banyaknya yang diselesaikan) + separuh "mutu" (persen benar) supaya
 * tidak bisa didongkrak hanya dengan rajin main, dan tidak pula dimenangi anak yang baru
 * mengerjakan satu soal dengan skor 100. Rentang waktu: **kumulatif** (snapshot capaian),
 * sejalan dengan bagian "capaian latihan" di raport ([[laporan]]).
 */
import { JUMLAH_LEVEL, BACAAN_KUIS_PER_LEVEL } from "./skibaca";
import { SKIBA_TOTAL_LEVEL } from "./laporan";

/** Bacaan kuis yang tersedia untuk satu jurusan (5 level × 15 bacaan). */
export const SKIBACA_TOTAL_KUIS = JUMLAH_LEVEL * BACAAN_KUIS_PER_LEVEL; // 75

/** Bobot capaian vs mutu di dalam satu modul (harus berjumlah 100). */
export const BOBOT_CAPAIAN = 50;
export const BOBOT_MUTU = 50;

/** Bulatkan ke 1 desimal — nilai tampil & dasar pemeringkatan (hindari beda float remeh). */
export function bulat1(x: number): number {
  return Math.round(x * 10) / 10;
}

function porsi(nilai: number, maks: number): number {
  if (maks <= 0) return 0;
  return Math.min(1, Math.max(0, nilai / maks));
}

/** Nilai satu modul 0..100 dari capaian (x dari maks) + mutu (rata persen, null = belum ada). */
export function nilaiModul(capaian: number, maks: number, mutu: number | null): number {
  const m = Math.min(100, Math.max(0, mutu ?? 0));
  return bulat1(BOBOT_CAPAIAN * porsi(capaian, maks) + BOBOT_MUTU * (m / 100));
}

/** Data mentah satu siswa (sudah diagregasi loader server). */
export interface DataPeringkat {
  siswaId: string;
  nama: string;
  nisn: string;
  kelasLabel: string;
  skibaLevel: number; // level arena selesai, kumulatif (0..200)
  skibaMutu: number | null; // rata skor % aktivitas NUMERASI
  skibacaBacaan: number; // bacaan kuis selesai (0..75)
  skibacaMutu: number | null; // rata skor % kuis bacaan
  aktivitas: number; // total PracticeActivity (numerasi+literasi) — penentu seri
}

export interface BarisPeringkat extends DataPeringkat {
  nilaiSkiba: number;
  nilaiSkibaca: number;
  nilai: number; // gabungan 0..100
  peringkat: number; // 1-based; seri berbagi angka yang sama (1,1,3)
}

export function hitungNilai(d: DataPeringkat): Omit<BarisPeringkat, "peringkat"> {
  const nilaiSkiba = nilaiModul(d.skibaLevel, SKIBA_TOTAL_LEVEL, d.skibaMutu);
  const nilaiSkibaca = nilaiModul(d.skibacaBacaan, SKIBACA_TOTAL_KUIS, d.skibacaMutu);
  return { ...d, nilaiSkiba, nilaiSkibaca, nilai: bulat1((nilaiSkiba + nilaiSkibaca) / 2) };
}

/**
 * Urutkan & beri nomor peringkat. Penentu seri berturut-turut: nilai gabungan → jumlah
 * aktivitas (yang lebih rajin di atas) → nama (A→Z, supaya urutan stabil/deterministik).
 * Siswa dengan nilai sama tetap mendapat peringkat yang sama.
 */
export function susunPeringkat(data: DataPeringkat[]): BarisPeringkat[] {
  const rows = data.map(hitungNilai).sort((a, b) => {
    if (b.nilai !== a.nilai) return b.nilai - a.nilai;
    if (b.aktivitas !== a.aktivitas) return b.aktivitas - a.aktivitas;
    return a.nama.localeCompare(b.nama, "id-ID");
  });
  let peringkat = 0;
  let sebelum: number | null = null;
  return rows.map((r, i) => {
    if (sebelum === null || r.nilai !== sebelum) {
      peringkat = i + 1;
      sebelum = r.nilai;
    }
    return { ...r, peringkat };
  });
}

/* ── Peringkat antar kelas ── */
export interface BarisKelasPeringkat {
  kelasLabel: string;
  jumlahSiswa: number;
  jumlahAktif: number; // siswa dengan nilai > 0
  rataNilai: number;
  rataSkiba: number;
  rataSkibaca: number;
  peringkat: number;
}

function rata1(xs: number[]): number {
  return xs.length ? bulat1(xs.reduce((s, x) => s + x, 0) / xs.length) : 0;
}

/**
 * Agregat per kelas dari baris siswa. Rata-rata memakai SELURUH siswa kelas (termasuk yang
 * belum pernah main, nilai 0) supaya kelas dengan partisipasi rendah tidak diuntungkan.
 */
export function susunPeringkatKelas(rows: BarisPeringkat[]): BarisKelasPeringkat[] {
  const per = new Map<string, BarisPeringkat[]>();
  for (const r of rows) {
    const arr = per.get(r.kelasLabel);
    if (arr) arr.push(r);
    else per.set(r.kelasLabel, [r]);
  }
  const kelas = [...per.entries()]
    .map(([kelasLabel, xs]) => ({
      kelasLabel,
      jumlahSiswa: xs.length,
      jumlahAktif: xs.filter((x) => x.nilai > 0).length,
      rataNilai: rata1(xs.map((x) => x.nilai)),
      rataSkiba: rata1(xs.map((x) => x.nilaiSkiba)),
      rataSkibaca: rata1(xs.map((x) => x.nilaiSkibaca)),
    }))
    .sort((a, b) => (b.rataNilai !== a.rataNilai ? b.rataNilai - a.rataNilai : a.kelasLabel.localeCompare(b.kelasLabel)));

  let peringkat = 0;
  let sebelum: number | null = null;
  return kelas.map((k, i) => {
    if (sebelum === null || k.rataNilai !== sebelum) {
      peringkat = i + 1;
      sebelum = k.rataNilai;
    }
    return { ...k, peringkat };
  });
}

/**
 * Lencana untuk 3 besar (dipakai tabel guru & papan siswa). Siswa/kelas bernilai 0 TIDAK
 * mendapat medali — tanpa penjaga ini, seluruh siswa yang belum pernah berlatih seri di
 * peringkat 2 dan sama-sama tampil 🥈.
 */
export function medali(peringkat: number, nilai = 1): string {
  if (nilai <= 0) return "";
  return peringkat === 1 ? "🥇" : peringkat === 2 ? "🥈" : peringkat === 3 ? "🥉" : "";
}

/** Ambil N teratas + baris siswa tertentu (untuk tampilan siswa: "posisi kamu"). */
export function potongTeratas(
  rows: BarisPeringkat[],
  n: number,
  siswaId?: string,
): { teratas: BarisPeringkat[]; saya: BarisPeringkat | null } {
  return {
    teratas: rows.slice(0, n),
    saya: siswaId ? (rows.find((r) => r.siswaId === siswaId) ?? null) : null,
  };
}
