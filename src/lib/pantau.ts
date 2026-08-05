/**
 * Pantauan guru — logika MURNI (tanpa DB/sesi; lihat `server/pantau.ts`).
 *
 * Status kehadiran diturunkan dari `Student.lastSeen` (detak heartbeat halaman siswa):
 * "online" bila detak terakhir dalam AMBANG_ONLINE menit, "baru" bila dalam AMBANG_BARU,
 * selebihnya "lama". Riwayat menggabungkan PracticeActivity (SKIBA/SKIBACA) + CheckpointResult
 * jadi satu lini masa kronologis.
 */

export const AMBANG_ONLINE_MENIT = 5;
export const AMBANG_BARU_MENIT = 30;

export type StatusKehadiran = "online" | "baru" | "lama";

const MENIT = 60_000;

/** Selisih menit dari `sejak` ke `now` (>=0; besar bila sejak null). */
export function menitLalu(sejak: Date | null | undefined, now: Date): number {
  if (!sejak) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now.getTime() - new Date(sejak).getTime()) / MENIT);
}

/** Status kehadiran dari lastSeen. */
export function statusKehadiran(lastSeen: Date | null | undefined, now: Date): StatusKehadiran {
  const m = menitLalu(lastSeen, now);
  if (m <= AMBANG_ONLINE_MENIT) return "online";
  if (m <= AMBANG_BARU_MENIT) return "baru";
  return "lama";
}

/** Label ramah "waktu lalu" (Indonesia). null → "belum pernah". */
export function labelWaktuLalu(sejak: Date | null | undefined, now: Date): string {
  if (!sejak) return "belum pernah";
  const m = menitLalu(sejak, now);
  if (m < 1) return "baru saja";
  if (m < 60) return `${Math.floor(m)} mnt lalu`;
  const jam = m / 60;
  if (jam < 24) return `${Math.floor(jam)} jam lalu`;
  const hari = jam / 24;
  if (hari < 2) return "kemarin";
  if (hari < 7) return `${Math.floor(hari)} hari lalu`;
  return `${Math.floor(hari / 7)} mgg lalu`;
}

/** Apakah dua tanggal berada di hari kalender lokal yang sama. */
export function hariSama(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ===================== RINGKAS AKTIVITAS HARIAN ===================== */
export interface AktivitasRingkas {
  domain: string; // "NUMERASI" | "LITERASI"
  category: string;
  level: string; // "Level 5"
  activity: string;
  score: number;
  points?: number | null;
  stars?: number | null;
  wpm?: number | null;
  createdAt: Date;
}

export interface RingkasHarian {
  num: number;
  lit: number;
  total: number;
}

/** Hitung jumlah pengerjaan HARI INI (per domain) dari daftar aktivitas. */
export function ringkasHarian(aktivitas: AktivitasRingkas[], now: Date): RingkasHarian {
  let num = 0;
  let lit = 0;
  for (const a of aktivitas) {
    if (!hariSama(new Date(a.createdAt), now)) continue;
    if (a.domain === "NUMERASI") num++;
    else if (a.domain === "LITERASI") lit++;
  }
  return { num, lit, total: num + lit };
}

/* ===================== LINI MASA RIWAYAT ===================== */
export type JenisRiwayat = "SKIBA" | "SKIBACA" | "CHECKPOINT";

export interface CheckpointRingkas {
  period: string; // "YYYY-MM"
  total: number; // skor total gabungan
  numerasi: number;
  literasi: number;
  benarNum: number;
  totalNum: number;
  benarLit: number;
  totalLit: number;
  submittedAt: Date | null;
}

export interface ItemRiwayat {
  waktu: Date;
  jenis: JenisRiwayat;
  ikon: string;
  judul: string;
  detail?: string;
  skor: number;
  poin?: number | null;
  bintang?: number | null;
  wpm?: number | null;
}

const IKON_JENIS: Record<JenisRiwayat, string> = {
  SKIBA: "🧮",
  SKIBACA: "📖",
  CHECKPOINT: "📝",
};

/**
 * Gabungkan aktivitas latihan + hasil Check Point jadi satu lini masa kronologis
 * (terbaru dulu). MURNI: caller menyiapkan objek dengan field `Date`.
 */
export function gabungRiwayat(
  aktivitas: AktivitasRingkas[],
  checkpoints: CheckpointRingkas[],
): ItemRiwayat[] {
  const items: ItemRiwayat[] = [];

  for (const a of aktivitas) {
    const jenis: JenisRiwayat = a.domain === "LITERASI" ? "SKIBACA" : "SKIBA";
    items.push({
      waktu: new Date(a.createdAt),
      jenis,
      ikon: IKON_JENIS[jenis],
      judul: a.activity || a.category,
      detail: [a.category, a.level].filter(Boolean).join(" · "),
      skor: a.score,
      poin: a.points ?? null,
      bintang: a.stars ?? null,
      wpm: a.wpm ?? null,
    });
  }

  for (const c of checkpoints) {
    if (!c.submittedAt) continue;
    items.push({
      waktu: new Date(c.submittedAt),
      jenis: "CHECKPOINT",
      ikon: IKON_JENIS.CHECKPOINT,
      judul: `Check Point ${c.period}`,
      detail: `Numerasi ${c.benarNum}/${c.totalNum} · Literasi ${c.benarLit}/${c.totalLit}`,
      skor: c.total,
    });
  }

  items.sort((a, b) => b.waktu.getTime() - a.waktu.getTime());
  return items;
}
