/**
 * Check Point — build & scoring, port dari D:\LitNum\ujian.html (bangunSoal/selesai).
 * Dijalankan di SERVER: soal dibangkitkan & dinilai server, tak bisa dicurangi klien.
 *
 * Desain seed (penting):
 *  - PROFIL & rotasi (pasangan topik↔level, pilihan bacaan) pakai seed PERIODE
 *    (seedBulan = tahun*12+bulan) → SAMA untuk semua siswa bulan itu → adil & sebanding.
 *  - ISI soal (angka) & urutan opsi pakai RNG PER-SISWA (hash(studentKey,period)) →
 *    tiap siswa dapat angka & posisi kunci berbeda (anti-nyontek) tapi reproducible.
 */

import { createNumerasiEngine, TOPICS, type Option } from "./soal-numerasi";
import { hashSeed, mulberry32, shuffleWith, type Rng } from "./rng";

export const CHECKPOINT_CONFIG = {
  JML_NUM: 20, // 2 soal per 10 topik
  JML_BACAAN: 3, // 3 bacaan x 5 soal = 15 soal literasi
  SOAL_PER_BACAAN: 5,
  DURASI_MENIT: 30,
  LEVELS: [8, 10, 12, 14, 16, 18, 20, 20, 18, 16], // profil kesulitan (rata 15,2), dipakai utuh tiap putaran
  GESER_PUTARAN: 2, // geser level putaran ke-2 → tiap topik dapat 2 level beda
} as const;

/** seed periode "YYYY-MM" → tahun*12 + bulan (bulan 1-12). */
export function seedBulan(period: string): number {
  const p = period.split("-");
  return parseInt(p[0], 10) * 12 + parseInt(p[1], 10);
}

export interface RawQuestion {
  q: string;
  options: string[]; // string[4], urutan kanonik dari bank
  answerIndex: number; // index kunci di options
}
export interface RawPassage {
  kode: string;
  tema: string;
  title: string;
  text: string;
  questions: RawQuestion[];
}

/** Salin bacaan sambil mengacak urutan opsi (rng per-siswa) & hitung ulang answerIndex.
 *  Tanpa ini kunci selalu di posisi 0 → "asal pilih A" dapat 100%. */
export function acakOpsiBacaan(p: RawPassage, rng: Rng): RawPassage {
  return {
    kode: p.kode,
    tema: p.tema,
    title: p.title,
    text: p.text,
    questions: p.questions.map((q) => {
      const benar = q.options[q.answerIndex];
      const options = shuffleWith(rng, q.options);
      return { q: q.q, options, answerIndex: options.indexOf(benar) };
    }),
  };
}

export interface BuiltNum {
  topic: string;
  topicName: string;
  icon: string;
  lv: number;
  qHTML: string;
  ctx: string;
  answer: string;
  options: Option[];
}
export interface BuiltCheckpoint {
  period: string;
  soalNum: BuiltNum[];
  bacaan: RawPassage[];
}

export interface BuildOpts {
  period: string; // "YYYY-MM"
  studentKey: string; // pengenal siswa (mis. student.id / nisn)
  passages: RawPassage[]; // bank bacaan Check Point (dari DB)
}

/** Bangun satu Check Point untuk (siswa, periode). Deterministik. */
export function buildCheckpoint({ period, studentKey, passages }: BuildOpts): BuiltCheckpoint {
  const { JML_NUM, JML_BACAAN, LEVELS, GESER_PUTARAN } = CHECKPOINT_CONFIG;
  const seedRotasi = seedBulan(period); // sama utk semua siswa bulan itu
  const rng = mulberry32(hashSeed(studentKey, period)); // per-siswa
  const eng = createNumerasiEngine(rng);

  // Numerasi: JML_NUM soal, 2 per topik; level dari LEVELS diputar oleh seedRotasi.
  const soalNum: BuiltNum[] = [];
  for (let i = 0; i < JML_NUM; i++) {
    const t = TOPICS[i % TOPICS.length];
    const putaran = Math.floor(i / TOPICS.length);
    const lv = LEVELS[(i + seedRotasi + putaran * GESER_PUTARAN) % LEVELS.length];
    const q = eng.generateUniqueQuestion(t.id, lv);
    soalNum.push({
      topic: t.id,
      topicName: t.name,
      icon: t.icon,
      lv,
      qHTML: q.qHTML,
      ctx: q.ctx,
      answer: q.answer,
      options: q.options,
    });
  }

  // Literasi: pilih JML_BACAAN bacaan (seleksi by seedRotasi), acak opsi (rng per-siswa).
  const n = passages.length;
  const jmlBacaan = Math.min(JML_BACAAN, n);
  const bacaan: RawPassage[] = [];
  if (n > 0) {
    const mulai = (seedRotasi * jmlBacaan) % n; // geser sejumlah bacaan → bulan berurutan tak beririsan
    const LOMPAT = Math.max(1, Math.floor(n / jmlBacaan)); // sebar → tak semua bacaan setema
    for (let k = 0; k < jmlBacaan; k++) {
      bacaan.push(acakOpsiBacaan(passages[(mulai + k * LOMPAT) % n], rng));
    }
  }

  return { period, soalNum, bacaan };
}

/* ── Bentuk yang AMAN dikirim ke klien (tanpa kunci jawaban) ── */
export interface ClientNum {
  topic: string;
  topicName: string;
  icon: string;
  lv: number;
  qHTML: string;
  ctx: string;
  options: Option[]; // {label, value} — value dikirim balik saat submit; kunci tak ditandai
}
export interface ClientPassageQ {
  q: string;
  options: string[]; // urutan sudah diacak per-siswa; klien kirim index pilihan
}
export interface ClientPassage {
  kode: string;
  tema: string;
  title: string;
  text: string;
  questions: ClientPassageQ[];
}
export interface ClientCheckpoint {
  period: string;
  soalNum: ClientNum[];
  bacaan: ClientPassage[];
}

/** Buang SEMUA kunci (answer / answerIndex) sebelum dikirim ke klien. */
export function untukKlien(b: BuiltCheckpoint): ClientCheckpoint {
  return {
    period: b.period,
    soalNum: b.soalNum.map((q) => ({
      topic: q.topic,
      topicName: q.topicName,
      icon: q.icon,
      lv: q.lv,
      qHTML: q.qHTML,
      ctx: q.ctx,
      options: q.options,
    })),
    bacaan: b.bacaan.map((p) => ({
      kode: p.kode,
      tema: p.tema,
      title: p.title,
      text: p.text,
      questions: p.questions.map((q) => ({ q: q.q, options: q.options })),
    })),
  };
}

export interface CheckpointScore {
  numerasi: number;
  literasi: number;
  total: number;
  benarNum: number;
  totalNum: number;
  benarLit: number;
  totalLit: number;
}

/** Nilai Check Point di server. jawabNum = string value pilihan; jawabLit = index pilihan. */
export function nilaiCheckpoint(
  built: BuiltCheckpoint,
  jawabNum: (string | null)[],
  jawabLit: (number | null)[][],
): CheckpointScore {
  let benarNum = 0;
  built.soalNum.forEach((q, i) => {
    if (jawabNum[i] != null && String(jawabNum[i]) === String(q.answer)) benarNum++;
  });
  let benarLit = 0,
    totalLit = 0;
  built.bacaan.forEach((p, pi) => {
    p.questions.forEach((q, qi) => {
      totalLit++;
      if (jawabLit[pi]?.[qi] === q.answerIndex) benarLit++;
    });
  });
  const totalNum = built.soalNum.length;
  const numerasi = totalNum ? Math.round((benarNum / totalNum) * 100) : 0;
  const literasi = totalLit ? Math.round((benarLit / totalLit) * 100) : 0;
  const total = Math.round((numerasi + literasi) / 2);
  return { numerasi, literasi, total, benarNum, totalNum, benarLit, totalLit };
}
