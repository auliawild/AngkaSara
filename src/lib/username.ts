/**
 * Generator UserName siswa TANPA NISN. Aturan (8 digit):
 *   [4 digit angkatan][1 digit jurusan][1 digit rombel][2 digit urutan]
 *
 * - Angkatan dari tingkat: X=2026, XI=2025, XII=2024 (turun 1 tiap tingkat naik).
 * - Nomor jurusan 1-digit dari urutan JURUSAN_LIST: TKR=1, TSM=2, TKJ=3, Kuliner=4, TPTUP=5.
 * - Rombel 1-digit (kelas rombel maks 5, jadi selalu muat).
 * - Urutan = nomor urut input berikutnya di kelas (stabil; lubang bekas hapus TIDAK dipakai ulang),
 *   dipadkan 2 digit. Bila kelas >99 siswa, urutan meluap jadi 3 digit (UserName 9 digit) — tetap valid.
 *
 * Murni (tanpa I/O) agar bisa diuji; server yang menyediakan daftar nisn yang sudah ada.
 */
import { JURUSAN_LIST, type Tingkat } from "./kelas";

/** Tahun angkatan berdasar tingkat. */
export const TAHUN_ANGKATAN: Record<Tingkat, number> = { X: 2026, XI: 2025, XII: 2024 };

/** Nomor jurusan 1-digit (1-based) dari urutan di JURUSAN_LIST; 0 bila kode tak dikenal. */
export function nomorJurusan(kode: string): number {
  const i = JURUSAN_LIST.findIndex((j) => j.kode === kode);
  return i < 0 ? 0 : i + 1;
}

/**
 * Prefix UserName kelas (6 digit): [angkatan][jurusan][rombel].
 * Return null bila tingkat/jurusan/rombel tak valid (jurusan & rombel harus 1 digit, 1..9).
 */
export function prefixUsername(tingkat: Tingkat, jurusanKode: string, rombel: number): string | null {
  const tahun = TAHUN_ANGKATAN[tingkat];
  const jur = nomorJurusan(jurusanKode);
  if (!tahun) return null;
  if (jur < 1 || jur > 9) return null;
  if (!Number.isInteger(rombel) || rombel < 1 || rombel > 9) return null;
  return `${tahun}${jur}${rombel}`;
}

/** Susun UserName lengkap dari prefix (6 digit) + nomor urut (dipad 2 digit). */
export function buatUsername(prefix: string, urutan: number): string {
  return `${prefix}${String(urutan).padStart(2, "0")}`;
}

/**
 * Nomor urut berikutnya untuk sebuah prefix, dihitung dari daftar nisn/UserName yang sudah ada.
 * Hanya yang cocok pola (diawali prefix, panjang ≥8, sisa digit angka) yang dihitung;
 * ambil urutan tertinggi lalu +1. Minimal 1. Lubang bekas hapus tak dipakai ulang → stabil.
 */
export function urutanBerikut(prefix: string, adaNisn: Iterable<string>): number {
  let maks = 0;
  for (const n of adaNisn) {
    if (n.length >= 8 && n.startsWith(prefix)) {
      const ekor = n.slice(prefix.length);
      if (/^\d+$/.test(ekor)) {
        const u = Number(ekor);
        if (u > maks) maks = u;
      }
    }
  }
  return maks + 1;
}
