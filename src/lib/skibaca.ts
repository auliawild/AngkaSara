/**
 * SKIBACA — logika murni (Phase 3). Port dari D:\LitNum\skibaca.html.
 *
 * Konten (375 bacaan) ada di DB (di-seed), jadi TAK perlu seed/token ber-generator:
 * server mengirim bacaan + soal TANPA `answerIndex` (sanitasi), lalu menilai jawaban
 * klien terhadap `answerIndex` di DB (server-authoritative, sama semangat Check Point).
 * WPM diukur di klien (waktu baca) & dikirim — bukan penentu skor, jadi tak sensitif.
 */

export const SOAL_PER_BACAAN = 5;
export const JUMLAH_LEVEL = 5;
export const BACAAN_PER_LEVEL = 20; // 1..15 kuis (server-graded) + 16..20 ringkasan (dinilai guru)
export const BACAAN_KUIS_PER_LEVEL = 15;
export const MIN_KATA_RINGKASAN = 30; // ringkasan minimal (port MIN_WORDS_SUMMARY)
export type TipeBacaan = "kuis" | "ringkasan";

/** Bacaan pertama tiap level dipakai sebagai sampel Tes Diagnostik (urutan 1..15 → pakai 1). */
export const DIAG_URUTAN_SAMPEL = 1;
/** Ambang lulus per level pada diagnostik (skor% ≥ ini dianggap kuasai level itu). */
export const DIAG_AMBANG = 70;

/**
 * Rekomendasi level awal dari skor diagnostik per level.
 * Port `finishDiagnostik`: rec = level TERTINGGI berturut mulai dari 1 dengan skor ≥ DIAG_AMBANG;
 * berhenti pada level pertama yang gagal/tak diujikan. Minimal Level 1.
 */
export function rekomendasiLevel(scoresByLevel: Record<number, number>): number {
  let rec = 1;
  for (let lv = 1; lv <= JUMLAH_LEVEL; lv++) {
    const sc = scoresByLevel[lv];
    if (sc !== undefined && sc >= DIAG_AMBANG) rec = lv;
    else break;
  }
  return rec;
}

/** Jumlah kata sebuah teks (dipakai untuk WPM & label panjang). */
export function hitungKata(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** WPM = kata / detik × 60 (detik minimal 1). Port perhitungan showResult. */
export function hitungWpm(kata: number, detik: number): number {
  const d = Math.max(1, Math.round(detik));
  return Math.round((kata / d) * 60);
}

/** Skor kuis (persen) dari jumlah benar. */
export function persenSkor(benar: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((benar / total) * 100);
}

export interface BadgeSkibaca {
  text: string;
  label: string;
  color: string;
}
/**
 * Badge internal SKIBACA (Mandiri/Instruksional) — DISPLAY-ONLY, beda dari klasifikasi rapor.
 * Port badgeFor: ≥90 Mandiri, ≥70 Instruksional, else Perlu Bimbingan.
 */
export function badgeSkibaca(percent: number): BadgeSkibaca {
  if (percent >= 90) return { text: "🌟 Mandiri (Independent)", label: "Mandiri", color: "#4f9c6a" };
  if (percent >= 70) return { text: "👍 Instruksional", label: "Instruksional", color: "#0057ff" };
  return { text: "💪 Perlu Bimbingan", label: "Perlu Bimbingan", color: "#d1704f" };
}

/** Label perkiraan panjang bacaan berdasar jumlah kata (untuk daftar bacaan). */
export function labelPanjang(kata: number): string {
  if (kata <= 35) return "Pendek";
  if (kata <= 70) return "Sedang";
  if (kata <= 100) return "Panjang";
  return "Sangat panjang";
}

/* ---- tipe bersama server/klien ---- */
export interface SoalKlien {
  urutan: number;
  q: string;
  options: string[]; // TANPA kunci (answerIndex tak dikirim)
}
export interface BacaanKlien {
  id: string;
  jurusanKode: string;
  jurusanFull: string;
  icon: string;
  level: number;
  urutan: number;
  title: string;
  text: string;
  wordCount: number;
  soal: SoalKlien[];
}

export interface HasilBacaan {
  benar: number;
  total: number;
  percent: number;
  wpm: number;
  detikBaca: number;
  badge: BadgeSkibaca;
  koreksi: { urutan: number; benar: boolean; answerIndex: number; pilih: number | null }[];
}

/* ---- Tes Diagnostik (per jurusan): 1 bacaan sampel per level, tanpa kunci ---- */
export interface DiagBacaanKlien {
  level: number;
  passageId: string;
  title: string;
  text: string;
  wordCount: number;
  soal: SoalKlien[]; // TANPA answerIndex
}
export interface DiagLevelSkor {
  level: number;
  benar: number;
  total: number;
  percent: number;
}
export interface HasilDiagnostikBaca {
  kode: string;
  full: string;
  icon: string;
  recommended: number; // level saran (rekomendasiLevel)
  perLevel: DiagLevelSkor[]; // 5 baris, level 1..5
}

/* ---- Ringkasan (bacaan 16..20): teks bebas, dinilai guru ---- */
export interface RingkasanTersimpan {
  text: string;
  wordCount: number;
  score: number | null; // skor guru; null = menunggu penilaian
  feedback: string | null;
  dinilai: boolean;
}
/** Bacaan ringkasan yang dikirim ke klien untuk ditulis (tanpa soal/kunci). */
export interface RingkasanKlien {
  id: string;
  jurusanKode: string;
  jurusanFull: string;
  icon: string;
  level: number;
  urutan: number;
  title: string;
  text: string;
  wordCount: number;
  tersimpan: RingkasanTersimpan | null; // ringkasan siswa sebelumnya (jika ada)
}

/** Hitung kata ringkasan siswa (untuk word-count & validasi min). */
export function hitungKataRingkasan(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).filter(Boolean).length : 0;
}
