/**
 * Logika MURNI impor siswa (tanpa IO/DB/auth) — dipisah dari server action
 * `imporSiswa` supaya bisa diuji langsung (Vitest) dan tak melanggar aturan
 * "use server" (yang mewajibkan semua export berupa async function).
 *
 * Format baru: berkas cukup berisi Nama + Kelas. UserName login DIBUAT OTOMATIS
 * per kelas (lihat [[username]]) melanjutkan nomor urut yang sudah ada. Kolom
 * NISN/UserName tetap boleh diisi manual (untuk siswa yang memang punya NISN).
 * Duplikat dicegah berdasarkan (nama + kelas) agar impor ganda tak menggandakan.
 */
import { normalKelas, type Tingkat } from "./kelas";
import type { BarisSiswa } from "./excel";
import { prefixUsername, buatUsername, urutanBerikut } from "./username";

export const NISN_RE = /^\d{4,15}$/;

/** Metadata satu kelas AKTIF untuk impor (dipakai membuat prefix UserName). */
export interface KelasImpor {
  id: string;
  tingkat: Tingkat;
  jurusanKode: string;
  rombel: number;
}

/** Siswa yang sudah ada — untuk dedup nama & meneruskan nomor urut UserName. */
export interface SiswaAda {
  nisn: string;
  nama: string;
  kelasId: string;
}

export interface ImporLaporan {
  ditambah: number;
  perKelas: Record<string, number>;
  dibuat: { baris: number; nama: string; kelas: string; username: string }[]; // UserName tergenerate
  dilewati: { baris: number; nama: string; sebab: string }[]; // sudah ada (nama+kelas / NISN sama)
  gagal: { baris: number; isi: string; sebab: string }[]; // data tak valid
}

function ambilSet<K>(m: Map<K, Set<string>>, k: K): Set<string> {
  let s = m.get(k);
  if (!s) m.set(k, (s = new Set()));
  return s;
}
function ambilArr<K>(m: Map<K, string[]>, k: K): string[] {
  let a = m.get(k);
  if (!a) m.set(k, (a = []));
  return a;
}

/**
 * Tentukan baris mana yang ditambah/dilewati/gagal, bangkitkan UserName otomatis,
 * dan petakan ke `kelasId`. `kelasByLabel` = label kelas AKTIF → metadata kelas;
 * `existing` = siswa yang sudah ada (semua kelas). Duplikat nama dalam satu kelas
 * (baik vs DB maupun dalam-berkas) dilewati; UserName tak pernah dipakai ulang.
 */
export function hitungImpor(
  baris: BarisSiswa[],
  kelasByLabel: Map<string, KelasImpor>,
  existing: SiswaAda[],
): { laporan: ImporLaporan; toAdd: { nisn: string; nama: string; kelasId: string }[] } {
  const laporan: ImporLaporan = { ditambah: 0, perKelas: {}, dibuat: [], dilewati: [], gagal: [] };
  const toAdd: { nisn: string; nama: string; kelasId: string }[] = [];

  // Indeks data yang sudah ada.
  const taken = new Set<string>(); // semua nisn/UserName terpakai (global; jaga @unique)
  const namaKelas = new Map<string, Set<string>>(); // kelasId → nama (lowercase) yang sudah ada
  const nisnKelas = new Map<string, string[]>(); // kelasId → nisn yang sudah ada (untuk urutanBerikut)
  for (const e of existing) {
    taken.add(e.nisn);
    ambilSet(namaKelas, e.kelasId).add(e.nama.trim().toLowerCase());
    ambilArr(nisnKelas, e.kelasId).push(e.nisn);
  }
  const urutBerikut = new Map<string, number>(); // kelasId → nomor urut berikutnya (lazy)

  /** Alokasikan satu UserName unik untuk kelas, meneruskan nomor urut. Null bila kelas tak valid. */
  function alokasi(info: KelasImpor): string | null {
    const prefix = prefixUsername(info.tingkat, info.jurusanKode, info.rombel);
    if (!prefix) return null;
    let urut = urutBerikut.get(info.id) ?? urutanBerikut(prefix, nisnKelas.get(info.id) ?? []);
    let uname = buatUsername(prefix, urut);
    while (taken.has(uname)) uname = buatUsername(prefix, ++urut);
    urutBerikut.set(info.id, urut + 1);
    taken.add(uname);
    return uname;
  }

  for (const b of baris) {
    const nama = b.nama.trim().replace(/\s+/g, " ");
    const nisnManual = (b.nisn || "").trim();
    if (!nama) {
      laporan.gagal.push({ baris: b.baris, isi: nisnManual || "(kosong)", sebab: "Nama kosong" });
      continue;
    }
    const label = normalKelas(b.kelas);
    if (!label) {
      laporan.gagal.push({ baris: b.baris, isi: `${nama} — "${b.kelas}"`, sebab: "Kelas tidak dikenali" });
      continue;
    }
    const info = kelasByLabel.get(label);
    if (!info) {
      laporan.gagal.push({ baris: b.baris, isi: `${nama} — "${label}"`, sebab: "Kelas nonaktif" });
      continue;
    }
    // Dedup nama dalam kelas — cegah impor roster yang sama dua kali.
    const set = ambilSet(namaKelas, info.id);
    if (set.has(nama.toLowerCase())) {
      laporan.dilewati.push({ baris: b.baris, nama, sebab: `Sudah ada di ${label}` });
      continue;
    }

    let username: string;
    if (nisnManual) {
      // Kolom NISN/UserName diisi manual → dipakai apa adanya.
      if (!NISN_RE.test(nisnManual)) {
        laporan.gagal.push({ baris: b.baris, isi: nisnManual, sebab: "NISN harus 4–15 digit angka" });
        continue;
      }
      if (taken.has(nisnManual)) {
        laporan.dilewati.push({ baris: b.baris, nama, sebab: "NISN/UserName sudah terdaftar" });
        continue;
      }
      username = nisnManual;
      taken.add(username);
    } else {
      const u = alokasi(info);
      if (!u) {
        laporan.gagal.push({ baris: b.baris, isi: `${nama} — "${label}"`, sebab: "Kelas tak bisa dibuatkan UserName" });
        continue;
      }
      username = u;
      laporan.dibuat.push({ baris: b.baris, nama, kelas: label, username });
    }

    set.add(nama.toLowerCase());
    toAdd.push({ nisn: username, nama, kelasId: info.id });
    laporan.perKelas[label] = (laporan.perKelas[label] || 0) + 1;
  }
  laporan.ditambah = toAdd.length;
  return { laporan, toAdd };
}
