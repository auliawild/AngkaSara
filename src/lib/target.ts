/**
 * Target bulanan SKIBA Math & SKIBACA — logika MURNI (tanpa DB/sesi).
 *
 * Program Agustus–November 2026. Keputusan user:
 *  - Hitungan **KUMULATIF**: target tiap bulan menumpuk. Agustus = 50 level & 25 bacaan,
 *    September = 100 & 50, Oktober = 150 & 75, November = 200 & 100. Melebihi target
 *    tidak masalah — cukup ditandai **sudah / belum** tercapai.
 *  - Sebuah **level SKIBA** dihitung selesai HANYA bila lulus **≥ 2 bintang** (sama syarat
 *    membuka level berikutnya). Level yang sama diulang di bulan lain tetap dihitung sekali
 *    (distinct topik+level di sepanjang program).
 *  - Sebuah **bacaan SKIBACA** dihitung selesai begitu dibaca + kuis dikerjakan (skor bebas),
 *    distinct jurusan+level+judul.
 *
 * Sumber data = baris `PracticeActivity` (createdAt jadi penentu bulan). Karena kumulatif,
 * capaian sebuah bulan = jumlah level/bacaan DISTINCT yang tuntas dari awal program s.d.
 * akhir bulan itu.
 */

/* ===================== KONSTANTA ===================== */
export const TAHUN_TARGET = 2026;
/** Bulan program (1-indexed: 8=Agustus … 11=November). */
export const BULAN_TARGET = [8, 9, 10, 11] as const;
/** Target per bulan (bukan kumulatif — kumulatifnya = per-bulan × urutan bulan). */
export const TARGET_SKIBA_PER_BULAN = 50; // level
export const TARGET_SKIBACA_PER_BULAN = 25; // bacaan
/** Bintang minimum agar sebuah level SKIBA dihitung tuntas. */
export const BINTANG_LULUS = 2;

const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

/** Awal program: 1 Agustus 2026 pukul 00.00 (waktu setempat). */
export function awalProgram(): Date {
  return new Date(TAHUN_TARGET, BULAN_TARGET[0] - 1, 1, 0, 0, 0, 0);
}

/** Milidetik terakhir sebuah bulan program (1-indexed). */
function akhirBulan(bulan1: number): number {
  // new Date(tahun, bulanBerikut0Indexed, 1) − 1ms. bulan1 (1-indexed) == bulan berikut 0-indexed.
  return new Date(TAHUN_TARGET, bulan1, 1, 0, 0, 0, 0).getTime() - 1;
}

/* ===================== TIPE ===================== */
export interface AktivitasTarget {
  domain: string; // "NUMERASI" | "LITERASI"
  category: string;
  level: string; // "Level N"
  activity: string;
  stars: number | null;
  createdAt: Date;
}

export interface BarisTarget {
  bulan: number; // 8..11
  label: string; // "Agustus"
  targetSkiba: number; // kumulatif
  targetSkibaca: number; // kumulatif
  skiba: number; // level distinct tuntas s.d. akhir bulan ini
  skibaca: number; // bacaan distinct tuntas s.d. akhir bulan ini
  skibaTercapai: boolean;
  skibacaTercapai: boolean;
  lewat: boolean; // bulan sudah sepenuhnya berlalu
  berjalan: boolean; // bulan yang sedang berlangsung
}

export interface RekapTarget {
  baris: BarisTarget[];
  /** Indeks baris bulan yang relevan sekarang (di-clamp ke rentang program). */
  idxKini: number;
}

/* ===================== HITUNG ===================== */

function kunciSkiba(a: AktivitasTarget): string {
  return `${a.category}|${a.level}`;
}
function kunciSkibaca(a: AktivitasTarget): string {
  return `${a.category}|${a.level}|${a.activity}`;
}

/** Baris bulan yang relevan "sekarang": bulan berjalan bila di dalam rentang; sebelum
 * Agustus → bulan pertama; sesudah November → bulan terakhir. */
function indexKini(now: Date): number {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  if (y < TAHUN_TARGET || (y === TAHUN_TARGET && m < BULAN_TARGET[0])) return 0;
  if (y > TAHUN_TARGET || (y === TAHUN_TARGET && m > BULAN_TARGET[BULAN_TARGET.length - 1]))
    return BULAN_TARGET.length - 1;
  return BULAN_TARGET.indexOf(m as (typeof BULAN_TARGET)[number]);
}

/**
 * Hitung rekap target kumulatif untuk satu siswa dari daftar aktivitasnya.
 * Capaian bulan-ke-i = level/bacaan DISTINCT yang tuntas dari awal program s.d. akhir bulan-i.
 */
export function hitungTarget(aktivitas: AktivitasTarget[], now: Date = new Date()): RekapTarget {
  const mulai = awalProgram().getTime();
  const nowMs = now.getTime();
  const idxKini = indexKini(now);

  const baris: BarisTarget[] = BULAN_TARGET.map((bulan, i) => {
    const batas = akhirBulan(bulan);
    const skibaSet = new Set<string>();
    const skibacaSet = new Set<string>();
    for (const a of aktivitas) {
      const t = a.createdAt.getTime();
      if (t < mulai || t > batas) continue;
      if (a.domain === "NUMERASI") {
        if ((a.stars ?? 0) >= BINTANG_LULUS) skibaSet.add(kunciSkiba(a));
      } else if (a.domain === "LITERASI") {
        skibacaSet.add(kunciSkibaca(a));
      }
    }
    const targetSkiba = TARGET_SKIBA_PER_BULAN * (i + 1);
    const targetSkibaca = TARGET_SKIBACA_PER_BULAN * (i + 1);
    const skiba = skibaSet.size;
    const skibaca = skibacaSet.size;
    return {
      bulan,
      label: NAMA_BULAN[bulan - 1],
      targetSkiba,
      targetSkibaca,
      skiba,
      skibaca,
      skibaTercapai: skiba >= targetSkiba,
      skibacaTercapai: skibaca >= targetSkibaca,
      lewat: batas < nowMs,
      berjalan: i === idxKini && nowMs >= mulai && nowMs <= akhirBulan(BULAN_TARGET[BULAN_TARGET.length - 1]),
    };
  });

  return { baris, idxKini };
}

/** Baris bulan yang relevan sekarang (untuk kartu ringkas & rekap kelas). */
export function barisKini(rekap: RekapTarget): BarisTarget {
  return rekap.baris[rekap.idxKini];
}

/** Persen capaian 0..100 (di-clamp, untuk progress bar). */
export function persenTarget(nilai: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((nilai / target) * 100));
}
