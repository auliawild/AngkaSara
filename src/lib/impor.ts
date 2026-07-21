/**
 * Logika MURNI impor siswa (tanpa IO/DB/auth) — dipisah dari server action
 * `imporSiswa` supaya bisa diuji langsung (Vitest) dan tak melanggar aturan
 * "use server" (yang mewajibkan semua export berupa async function).
 */
import { normalKelas } from "./kelas";
import type { BarisSiswa } from "./excel";

export const NISN_RE = /^\d{4,15}$/;

export interface ImporLaporan {
  ditambah: number;
  perKelas: Record<string, number>;
  dilewati: { baris: number; nisn: string; sebab: string }[]; // duplikat NISN
  gagal: { baris: number; isi: string; sebab: string }[]; // data tak valid
}

/**
 * Tentukan baris mana yang ditambah/dilewati/gagal dan petakan ke `kelasId`.
 * `kelasByLabel` = label kelas sah → id; `existing` = NISN yang sudah ada di DB.
 * Duplikat di DALAM berkas juga dilewati (NISN pertama menang).
 */
export function hitungImpor(
  baris: BarisSiswa[],
  kelasByLabel: Map<string, string>,
  existing: Set<string>,
): { laporan: ImporLaporan; toAdd: { nisn: string; nama: string; kelasId: string }[] } {
  const laporan: ImporLaporan = { ditambah: 0, perKelas: {}, dilewati: [], gagal: [] };
  const seen = new Set<string>();
  const toAdd: { nisn: string; nama: string; kelasId: string }[] = [];

  for (const b of baris) {
    const nisn = b.nisn.trim();
    const nama = b.nama.trim();
    if (!nisn) {
      laporan.gagal.push({ baris: b.baris, isi: nama || "(kosong)", sebab: "NISN kosong" });
      continue;
    }
    if (!NISN_RE.test(nisn)) {
      laporan.gagal.push({ baris: b.baris, isi: nisn, sebab: "NISN harus 4–15 digit angka" });
      continue;
    }
    if (!nama) {
      laporan.gagal.push({ baris: b.baris, isi: nisn, sebab: "Nama kosong" });
      continue;
    }
    const kelas = normalKelas(b.kelas);
    if (!kelas) {
      laporan.gagal.push({ baris: b.baris, isi: `${nama} — "${b.kelas}"`, sebab: "Kelas tidak dikenali" });
      continue;
    }
    // `kelasByLabel` hanya berisi kelas AKTIF. Label sah tapi tak ada di map = kelas nonaktif.
    if (!kelasByLabel.has(kelas)) {
      laporan.gagal.push({ baris: b.baris, isi: `${nama} — "${kelas}"`, sebab: "Kelas nonaktif" });
      continue;
    }
    if (existing.has(nisn) || seen.has(nisn)) {
      laporan.dilewati.push({ baris: b.baris, nisn, sebab: "NISN sudah terdaftar" });
      continue;
    }
    seen.add(nisn);
    toAdd.push({ nisn, nama, kelasId: kelasByLabel.get(kelas)! });
    laporan.perKelas[kelas] = (laporan.perKelas[kelas] || 0) + 1;
  }
  laporan.ditambah = toAdd.length;
  return { laporan, toAdd };
}
