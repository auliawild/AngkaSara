/**
 * Config kelas & helper periode — port dari D:\LitNum\assets\kelas.js.
 * SATU-SATUNYA tempat mengatur jumlah kelas. Dipakai untuk seed DB, validasi impor,
 * dropdown, dan bucket grafik Evaluasi. Total 46 kelas (X 16 + XI 15 + XII 15).
 */

export type Tingkat = "X" | "XI" | "XII";
export type BucketMode = "hari" | "minggu" | "bulan" | "tahun";

export interface Jurusan {
  kode: string;
  nama: string;
  icon: string;
  rombel: Record<Tingkat, number>; // 0 = jurusan belum ada di tingkat itu
}

export const TINGKAT: Tingkat[] = ["X", "XI", "XII"];
export const SISWA_PER_KELAS = 40;

export const JURUSAN_LIST: Jurusan[] = [
  { kode: "TKR", nama: "Teknik Kendaraan Ringan", icon: "🚗", rombel: { X: 5, XI: 5, XII: 5 } },
  { kode: "TSM", nama: "Teknik Sepeda Motor", icon: "🏍️", rombel: { X: 3, XI: 3, XII: 3 } },
  { kode: "TKJ", nama: "Teknik Komputer & Jaringan", icon: "💻", rombel: { X: 5, XI: 5, XII: 5 } },
  { kode: "Kuliner", nama: "Kuliner", icon: "🍳", rombel: { X: 2, XI: 2, XII: 2 } },
  { kode: "TPTUP", nama: "Teknik Pemanasan, Tata Udara & Pendinginan", icon: "❄️", rombel: { X: 1, XI: 0, XII: 0 } },
];

export function jumlahRombel(kode: string, tingkat: Tingkat): number {
  const j = JURUSAN_LIST.find((x) => x.kode === kode);
  if (!j) return 0;
  const n = j.rombel[tingkat];
  return typeof n === "number" ? n : 0;
}
export function rombelUntuk(kode: string, tingkat: Tingkat): string[] {
  const n = jumlahRombel(kode, tingkat);
  const out: string[] = [];
  for (let i = 1; i <= n; i++) out.push(String(i));
  return out;
}
export function jurusanUntuk(tingkat: Tingkat): Jurusan[] {
  return JURUSAN_LIST.filter((j) => jumlahRombel(j.kode, tingkat) > 0);
}
export function namaKelas(tingkat: string, jurusan: string, rombel: string | number): string {
  return `${tingkat} ${jurusan} ${rombel}`;
}
export function semuaKelas(): string[] {
  const out: string[] = [];
  for (const t of TINGKAT)
    for (const j of JURUSAN_LIST) for (const r of rombelUntuk(j.kode, t)) out.push(namaKelas(t, j.kode, r));
  return out;
}
export function ikonJurusan(kelas: string): string {
  const j = JURUSAN_LIST.find((x) => (kelas || "").indexOf(x.kode) >= 0);
  return j ? j.icon : "🏫";
}
export function urutkanKelas(a: string, b: string): number {
  const ia = TINGKAT.indexOf((a || "").split(" ")[0] as Tingkat);
  const ib = TINGKAT.indexOf((b || "").split(" ")[0] as Tingkat);
  if (ia !== ib) return ia - ib;
  return (a || "") < (b || "") ? -1 : 1;
}

/**
 * Validasi & normalisasi label kelas dari impor bebas ("xi tkj 2" → "XI TKJ 2").
 * Return null kalau tak sah (tingkat salah, jurusan tak dikenal, atau rombel tak ada
 * di tingkat itu — mis. "XII TPTUP 1" ditolak). Port dari evaluasi.html normalKelas.
 */
export function normalKelas(input: string): string | null {
  const bag = String(input || "").trim().split(/\s+/);
  if (bag.length !== 3) return null;
  const t = bag[0].toUpperCase() as Tingkat;
  if (!TINGKAT.includes(t)) return null;
  const j = JURUSAN_LIST.find((x) => x.kode.toLowerCase() === bag[1].toLowerCase());
  if (!j) return null;
  if (!rombelUntuk(j.kode, t).includes(bag[2])) return null;
  return namaKelas(t, j.kode, bag[2]);
}

/* ===================== KLASIFIKASI ===================== */
export interface Klasifikasi {
  label: string;
  color: string;
  ic: string;
}
export function klasifikasi(score: number): Klasifikasi {
  if (score >= 90) return { label: "Mahir", color: "#4f9c6a", ic: "🌳" };
  if (score >= 75) return { label: "Baik", color: "#0057ff", ic: "🌿" };
  if (score >= 60) return { label: "Cukup", color: "#e0a800", ic: "🌱" };
  return { label: "Perlu Bimbingan", color: "#d1704f", ic: "🔴" };
}

/* ===================== PERIODE ===================== */
export const BULAN_PANJANG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
export const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const HARI_PENDEK = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const p2 = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM" untuk sebuah tanggal (default sekarang) — periode Check Point. */
export function periodKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}`;
}

export function isoWeek(d: Date): { tahun: number; minggu: number } {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const awal = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - awal.getTime()) / 86400000 + 1) / 7);
  return { tahun: t.getUTCFullYear(), minggu: week };
}
export function awalMinggu(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay() || 7;
  x.setDate(x.getDate() - (day - 1));
  return x;
}
export function bucketKey(ts: number | Date, mode: BucketMode): string {
  const d = new Date(ts);
  if (mode === "hari") return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  if (mode === "minggu") {
    const w = isoWeek(d);
    return `${w.tahun}-W${p2(w.minggu)}`;
  }
  if (mode === "bulan") return `${d.getFullYear()}-${p2(d.getMonth() + 1)}`;
  return String(d.getFullYear());
}
export function bucketLabel(key: string, mode: BucketMode): string {
  let p: string[];
  if (mode === "hari") {
    p = key.split("-");
    const dd = new Date(+p[0], +p[1] - 1, +p[2]);
    return HARI_PENDEK[dd.getDay()] + " " + +p[2];
  }
  if (mode === "minggu") {
    p = key.split("-W");
    return "Mg" + +p[1];
  }
  if (mode === "bulan") {
    p = key.split("-");
    return BULAN_PENDEK[+p[1] - 1] + " '" + p[0].slice(2);
  }
  return key;
}
export function bucketLabelPanjang(key: string, mode: BucketMode): string {
  let p: string[];
  if (mode === "hari") {
    p = key.split("-");
    const dd = new Date(+p[0], +p[1] - 1, +p[2]);
    return `${HARI_PENDEK[dd.getDay()]}, ${+p[2]} ${BULAN_PENDEK[+p[1] - 1]} ${p[0]}`;
  }
  if (mode === "minggu") {
    p = key.split("-W");
    return `Minggu ke-${+p[1]} tahun ${p[0]}`;
  }
  if (mode === "bulan") {
    p = key.split("-");
    return `${BULAN_PANJANG[+p[1] - 1]} ${p[0]}`;
  }
  return "Tahun " + key;
}
export function bucketTerakhir(mode: BucketMode, n: number, now: Date = new Date()): string[] {
  const out: string[] = [];
  if (mode === "hari") {
    for (let i = n - 1; i >= 0; i--) out.push(bucketKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i), "hari"));
  } else if (mode === "minggu") {
    const sen = awalMinggu(now);
    for (let i = n - 1; i >= 0; i--) out.push(bucketKey(new Date(sen.getFullYear(), sen.getMonth(), sen.getDate() - i * 7), "minggu"));
  } else if (mode === "bulan") {
    for (let i = n - 1; i >= 0; i--) out.push(bucketKey(new Date(now.getFullYear(), now.getMonth() - i, 1), "bulan"));
  } else {
    for (let i = n - 1; i >= 0; i--) out.push(String(now.getFullYear() - i));
  }
  return out;
}
export const BUCKET_JUMLAH: Record<BucketMode, number> = { hari: 14, minggu: 12, bulan: 12, tahun: 5 };
export const BUCKET_NAMA: Record<BucketMode, string> = { hari: "Harian", minggu: "Mingguan", bulan: "Bulanan", tahun: "Tahunan" };
