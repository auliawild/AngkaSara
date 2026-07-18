/**
 * Logika MURNI impor guru/staf (tanpa IO/DB/auth) — dipisah dari server action
 * `imporStaf` supaya bisa diuji Vitest. Semua akun impor berperan GURU; identitas
 * login = NIP; password awal = NIP (di-hash di server). Email internal diturunkan
 * dari NIP agar Better Auth (butuh email unik) tetap jalan.
 */
import type { BarisStaf } from "./excel-staf";

export const NIP_RE = /^\d{4,30}$/; // NIP/NUPTK numerik (mis. 18 digit); longgar 4–30

/** Domain internal untuk email turunan NIP (staf login pakai NIP, bukan email ini). */
export const DOMAIN_STAF = "guru.smkn1badegan.sch.id";

/** Email internal deterministik dari NIP (unik) — memenuhi syarat email unik Better Auth. */
export function emailDariNip(nip: string): string {
  return `${nip}@${DOMAIN_STAF}`;
}

/** true bila string tampak sebagai email (mengandung "@") — dipakai login (NIP vs email admin). */
export function tampakEmail(s: string): boolean {
  return s.includes("@");
}

export interface ImporStafLaporan {
  ditambah: number;
  dilewati: { baris: number; nip: string; sebab: string }[]; // duplikat NIP
  gagal: { baris: number; isi: string; sebab: string }[]; // data tak valid
}

/**
 * Tentukan baris mana yang ditambah/dilewati/gagal. `existing` = NIP yang sudah ada di DB.
 * Duplikat di DALAM berkas juga dilewati (NIP pertama menang).
 */
export function hitungImporStaf(
  baris: BarisStaf[],
  existing: Set<string>,
): { laporan: ImporStafLaporan; toAdd: { nama: string; nip: string }[] } {
  const laporan: ImporStafLaporan = { ditambah: 0, dilewati: [], gagal: [] };
  const seen = new Set<string>();
  const toAdd: { nama: string; nip: string }[] = [];

  for (const b of baris) {
    const nama = b.nama.trim();
    const nip = b.nip.trim();
    if (!nama) {
      laporan.gagal.push({ baris: b.baris, isi: nip || "(kosong)", sebab: "Nama kosong" });
      continue;
    }
    if (!nip) {
      laporan.gagal.push({ baris: b.baris, isi: nama, sebab: "NIP kosong" });
      continue;
    }
    if (!NIP_RE.test(nip)) {
      laporan.gagal.push({ baris: b.baris, isi: `${nama} — "${nip}"`, sebab: "NIP harus 4–30 digit angka" });
      continue;
    }
    if (existing.has(nip) || seen.has(nip)) {
      laporan.dilewati.push({ baris: b.baris, nip, sebab: "NIP sudah terdaftar" });
      continue;
    }
    seen.add(nip);
    toAdd.push({ nama, nip });
  }
  laporan.ditambah = toAdd.length;
  return { laporan, toAdd };
}
