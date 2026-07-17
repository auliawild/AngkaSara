/**
 * SKIBA Math — logika murni (Phase 2). Port dari D:\LitNum\skiba-math.html.
 *
 * Prinsip keamanan (sama seperti Check Point): soal DIBANGKITKAN & DINILAI di server.
 * Klien tak pernah menerima kunci jawaban. Alih-alih menyimpan attempt di DB,
 * arena/diagnostik memakai SEED: server membangun N soal deterministik dari seed,
 * kirim versi tersanitasi + seed ke klien; saat submit klien mengembalikan seed +
 * pilihan, server MEMBANGUN ULANG soal identik dari seed lalu menilai.
 *
 * Determinisme: `build*` menjalankan SATU engine ber-seed dalam urutan konsumsi RNG
 * yang sama persis di `mulai*` dan `submit*`, sehingga soal (dan kuncinya) identik.
 * Faithful terhadap versi lama: arena dijawab berurutan (tanpa mundur), jadi replay
 * combo dari array jawaban ber-indeks = skor identik.
 */

import {
  createNumerasiEngine,
  clamp,
  TOPICS,
  type Topic,
  type Option,
} from "./soal-numerasi";
import { mulberry32 } from "./rng";

/* ===================== KONSTANTA ===================== */
export const TOTAL_ARENA = 10;
export const TOTAL_DIAG = 30;
export const MAX_DIAG_ATTEMPTS = 2;
export const DIAG_DETIK = 15; // waktu per soal diagnostik

/** Waktu (detik) per soal arena, mengecil seiring level. Port levelTime. */
export function levelTime(L: number): number {
  return Math.max(6, Math.round(18 - L * 0.55));
}
/** Poin dasar per jawaban benar (sebelum dikali combo). Port levelPoints. */
export function levelPoints(L: number): number {
  return 10 + L * 4;
}
export const COMBO_MAX = 5;

/** Bintang dari jumlah benar (≥90%→3, ≥60%→2, else 1). */
export function bintangDari(benar: number, total: number = TOTAL_ARENA): number {
  const pct = benar / total;
  if (pct >= 0.9) return 3;
  if (pct >= 0.6) return 2;
  return 1;
}

/** Label band level (rasa, bukan mudah/sedang/sulit). Port levelBand. */
export function levelBand(L: number): string {
  if (L <= 4) return "Pemula";
  if (L <= 8) return "Penantang";
  if (L <= 12) return "Mahir";
  if (L <= 16) return "Jagoan";
  return "Master";
}
/** Warna level: hijau (L1) → merah (L20). Port levelColor. */
export function levelColor(L: number): string {
  const hue = 130 - ((L - 1) / 19) * 130;
  return `hsl(${hue.toFixed(0)},70%,36%)`;
}

/* ===================== TIPE SOAL ===================== */
/** Soal arena/diagnostik lengkap (dengan kunci) — HANYA di server. */
export interface SoalPenuh {
  topicId: string;
  topicName: string;
  icon: string;
  level: number;
  qHTML: string;
  ctx: string;
  options: Option[];
  answer: string;
}
/** Versi tersanitasi untuk klien — TANPA `answer`. */
export type SoalKlien = Omit<SoalPenuh, "answer">;

function topicMeta(id: string): Topic {
  return TOPICS.find((t) => t.id === id) ?? TOPICS[0];
}
export function topicValid(id: string): boolean {
  return TOPICS.some((t) => t.id === id);
}

function bangunSoal(
  engine: ReturnType<typeof createNumerasiEngine>,
  topicId: string,
  level: number,
): SoalPenuh {
  const q = engine.generateUniqueQuestion(topicId, level);
  const t = topicMeta(topicId);
  return {
    topicId,
    topicName: t.name,
    icon: t.icon,
    level,
    qHTML: q.qHTML,
    ctx: q.ctx,
    options: q.options,
    answer: q.answer,
  };
}

/** Buang kunci sebelum dikirim ke klien. */
export function sanitasi(soal: SoalPenuh[]): SoalKlien[] {
  return soal.map(({ answer: _answer, ...rest }) => rest);
}

/* ===================== BUILD (deterministik dari seed) ===================== */

/** 10 soal arena satu topik & level, dari seed. */
export function buildArena(seed: number, topicId: string, level: number): SoalPenuh[] {
  const engine = createNumerasiEngine(mulberry32(seed >>> 0));
  const out: SoalPenuh[] = [];
  for (let i = 0; i < TOTAL_ARENA; i++) out.push(bangunSoal(engine, topicId, level));
  return out;
}

/**
 * 30 soal diagnostik campuran dari seed. URUTAN konsumsi RNG dijaga sama persis
 * dengan versi lama (buildDiagnosticSet lalu generateUniqueQuestion per soal):
 *   shuffle(topics) → 30× randInt(level jitter) → shuffle(plan) → per-soal generate.
 */
export function buildDiagnostik(seed: number): SoalPenuh[] {
  const engine = createNumerasiEngine(mulberry32(seed >>> 0));
  const topics = engine.shuffle(TOPICS.map((t) => t.id));
  const plan: { topicId: string; level: number }[] = [];
  for (let i = 0; i < TOTAL_DIAG; i++) {
    const topicId = topics[i % topics.length];
    const level = clamp(Math.round(1 + (i / 29) * 19 + engine.randInt(-1, 1)), 1, 20);
    plan.push({ topicId, level });
  }
  const urut = engine.shuffle(plan);
  return urut.map(({ topicId, level }) => bangunSoal(engine, topicId, level));
}

/* ===================== PENILAIAN ===================== */

export interface HasilArena {
  benar: number;
  total: number;
  skor: number; // persentase 0..100 (untuk PracticeActivity.score & Evaluasi)
  points: number; // skor combo (untuk papan peringkat)
  bintang: number; // 1..3
  bestCombo: number;
  unlockNext: number | null; // level yang baru terbuka, atau null
}

/**
 * Nilai arena di server. `jawab[i]` = value opsi terpilih (atau null bila kosong/timeout).
 * Replay combo berurutan (arena tak punya navigasi mundur → indeks = urutan menjawab),
 * jadi identik dengan perhitungan interaktif versi lama.
 */
export function nilaiArena(
  soal: SoalPenuh[],
  jawab: (string | null)[],
  level: number,
  capSaatIni: number,
): HasilArena {
  let benar = 0;
  let points = 0;
  let combo = 1;
  let bestCombo = 1;
  for (let i = 0; i < soal.length; i++) {
    const ok = jawab[i] != null && jawab[i] === soal[i].answer;
    if (ok) {
      benar++;
      points += levelPoints(level) * combo;
      combo = Math.min(combo + 1, COMBO_MAX);
      bestCombo = Math.max(bestCombo, combo);
    } else {
      combo = 1;
    }
  }
  const total = soal.length;
  const bintang = bintangDari(benar, total);
  const unlockNext =
    bintang >= 2 && level >= capSaatIni && level < 20 ? level + 1 : null;
  return {
    benar,
    total,
    skor: Math.round((benar / total) * 100),
    points,
    bintang,
    bestCombo,
    unlockNext,
  };
}

export interface RincianTopik {
  topicId: string;
  topicName: string;
  icon: string;
  benar: number;
  total: number;
  pct: number; // 0..100
  recLevel: number; // 1..20 (juga jadi maxUnlocked awal topik)
}
export interface HasilDiagnostik {
  benar: number;
  total: number;
  pct: number;
  levelRata: number; // 1..20
  band: string;
  rincian: RincianTopik[];
}

/**
 * Nilai diagnostik: hitung benar per-topik → recLevel per-topik
 * = clamp(round(topicPct*19)+1). Topik yang tak sempat muncul memakai pct global.
 */
export function nilaiDiagnostik(soal: SoalPenuh[], jawab: (string | null)[]): HasilDiagnostik {
  const stats = new Map<string, { correct: number; total: number }>();
  for (const t of TOPICS) stats.set(t.id, { correct: 0, total: 0 });
  let benar = 0;
  for (let i = 0; i < soal.length; i++) {
    const s = stats.get(soal[i].topicId);
    if (!s) continue;
    s.total++;
    if (jawab[i] != null && jawab[i] === soal[i].answer) {
      s.correct++;
      benar++;
    }
  }
  const total = soal.length;
  const pct = Math.round((benar / total) * 100);
  const rincian: RincianTopik[] = TOPICS.map((t) => {
    const s = stats.get(t.id)!;
    const topicPct = s.total > 0 ? s.correct / s.total : pct / 100;
    return {
      topicId: t.id,
      topicName: t.name,
      icon: t.icon,
      benar: s.correct,
      total: s.total,
      pct: s.total > 0 ? Math.round(topicPct * 100) : 0,
      recLevel: clamp(Math.round(topicPct * 19) + 1, 1, 20),
    };
  });
  const levelRata = clamp(Math.round((pct / 100) * 19) + 1, 1, 20);
  return { benar, total, pct, levelRata, band: levelBand(levelRata), rincian };
}
