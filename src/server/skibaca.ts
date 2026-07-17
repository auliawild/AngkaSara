"use server";
/**
 * Server actions ALUR SKIBACA (siswa). Konten bacaan ada di DB (di-seed).
 * Server mengirim bacaan + soal TANPA kunci; menilai jawaban klien terhadap
 * `answerIndex` di DB (server-authoritative). Progres per bacaan (skor terbaik + WPM)
 * & tiap percobaan dicatat ke PracticeActivity (domain LITERASI → dibaca Evaluasi guru).
 */
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { sesiSiswa } from "@/server/student-auth";
import {
  hitungWpm,
  persenSkor,
  badgeSkibaca,
  rekomendasiLevel,
  DIAG_URUTAN_SAMPEL,
  type BacaanKlien,
  type HasilBacaan,
  type DiagBacaanKlien,
  type DiagLevelSkor,
  type HasilDiagnostikBaca,
} from "@/lib/skibaca";

/* ===================== HUB: ringkasan per jurusan ===================== */
export interface JurusanRingkas {
  kode: string;
  full: string;
  icon: string;
  total: number;
  selesai: number; // bacaan dengan progres (pernah dikuis)
  rataPercent: number | null;
}

/** Kartu jurusan untuk hub: jumlah bacaan & progres siswa. */
export async function muatRingkasanJurusan(): Promise<JurusanRingkas[]> {
  const sesi = await sesiSiswa();
  if (!sesi) throw new Error("Sesi siswa tidak ditemukan. Silakan masuk kembali.");

  const passages = await prisma.skibacaPassage.findMany({
    select: { id: true, jurusanKode: true, jurusanFull: true, icon: true },
  });
  const progres = await prisma.skibacaProgress.findMany({
    where: { studentId: sesi.studentId },
    select: { passageId: true, percent: true },
  });
  const progByPassage = new Map(progres.map((p) => [p.passageId, p.percent]));

  const byKode = new Map<string, JurusanRingkas & { _jumlahSkor: number }>();
  for (const p of passages) {
    let j = byKode.get(p.jurusanKode);
    if (!j) {
      j = { kode: p.jurusanKode, full: p.jurusanFull, icon: p.icon, total: 0, selesai: 0, rataPercent: null, _jumlahSkor: 0 };
      byKode.set(p.jurusanKode, j);
    }
    j.total++;
    const pct = progByPassage.get(p.id);
    if (pct != null) {
      j.selesai++;
      j._jumlahSkor += pct;
    }
  }
  return [...byKode.values()].map(({ _jumlahSkor, ...j }) => ({
    ...j,
    rataPercent: j.selesai > 0 ? Math.round(_jumlahSkor / j.selesai) : null,
  }));
}

/* ===================== DETAIL JURUSAN: level → bacaan + progres ===================== */
export interface BacaanRingkas {
  id: string;
  urutan: number;
  title: string;
  wordCount: number;
  percent: number | null;
  wpm: number | null;
}
export interface LevelRingkas {
  level: number;
  bacaan: BacaanRingkas[];
}
export interface DiagnostikTersimpan {
  recommended: number;
  scores: Record<number, number>; // skor% per level yang diujikan
}
export interface JurusanDetail {
  kode: string;
  full: string;
  icon: string;
  levels: LevelRingkas[];
  diagnostik: DiagnostikTersimpan | null; // hasil Tes Diagnostik terakhir (jika ada)
}

/** Semua level+bacaan sebuah jurusan (judul saja, tanpa soal) + progres siswa + hasil diagnostik. */
export async function muatJurusan(kode: string): Promise<JurusanDetail> {
  const sesi = await sesiSiswa();
  if (!sesi) throw new Error("Sesi siswa tidak ditemukan.");

  const rows = await prisma.skibacaPassage.findMany({
    where: { jurusanKode: kode },
    orderBy: [{ level: "asc" }, { urutan: "asc" }],
    select: { id: true, jurusanFull: true, icon: true, level: true, urutan: true, title: true, wordCount: true },
  });
  if (rows.length === 0) throw new Error("Jurusan tidak dikenal.");

  const [progres, diag] = await Promise.all([
    prisma.skibacaProgress.findMany({
      where: { studentId: sesi.studentId, passage: { jurusanKode: kode } },
      select: { passageId: true, percent: true, wpm: true },
    }),
    prisma.skibacaDiagnostic.findUnique({
      where: { studentId_jurusanKode: { studentId: sesi.studentId, jurusanKode: kode } },
    }),
  ]);
  const prog = new Map(progres.map((p) => [p.passageId, p]));

  const levels: LevelRingkas[] = [];
  for (const r of rows) {
    let lv = levels.find((x) => x.level === r.level);
    if (!lv) {
      lv = { level: r.level, bacaan: [] };
      levels.push(lv);
    }
    const pr = prog.get(r.id);
    lv.bacaan.push({
      id: r.id,
      urutan: r.urutan,
      title: r.title,
      wordCount: r.wordCount,
      percent: pr?.percent ?? null,
      wpm: pr?.wpm ?? null,
    });
  }
  let diagnostik: DiagnostikTersimpan | null = null;
  if (diag) {
    let scores: Record<number, number> = {};
    try {
      scores = JSON.parse(diag.scores) as Record<number, number>;
    } catch {
      scores = {};
    }
    diagnostik = { recommended: diag.recommended, scores };
  }
  return { kode, full: rows[0].jurusanFull, icon: rows[0].icon, levels, diagnostik };
}

/* ===================== BACA satu bacaan (tanpa kunci) ===================== */
export async function mulaiBacaan(passageId: string): Promise<BacaanKlien> {
  const sesi = await sesiSiswa();
  if (!sesi) throw new Error("Sesi siswa tidak ditemukan.");
  const p = await prisma.skibacaPassage.findUnique({
    where: { id: passageId },
    include: { questions: { orderBy: { urutan: "asc" } } },
  });
  if (!p) throw new Error("Bacaan tidak ditemukan.");
  return {
    id: p.id,
    jurusanKode: p.jurusanKode,
    jurusanFull: p.jurusanFull,
    icon: p.icon,
    level: p.level,
    urutan: p.urutan,
    title: p.title,
    text: p.text,
    wordCount: p.wordCount,
    soal: p.questions.map((q) => ({
      urutan: q.urutan,
      q: q.q,
      options: JSON.parse(q.options) as string[], // TANPA answerIndex
    })),
  };
}

/* ===================== SUBMIT kuis (server-graded) ===================== */
export interface SubmitBacaanHasil {
  ok: boolean;
  error?: string;
  hasil?: HasilBacaan & { title: string; level: number };
}

export async function submitBacaan(input: {
  passageId: string;
  jawab: (number | null)[];
  detikBaca: number;
}): Promise<SubmitBacaanHasil> {
  const sesi = await sesiSiswa();
  if (!sesi) return { ok: false, error: "Sesi siswa habis. Masuk kembali." };

  const p = await prisma.skibacaPassage.findUnique({
    where: { id: input.passageId },
    include: { questions: { orderBy: { urutan: "asc" } } },
  });
  if (!p) return { ok: false, error: "Bacaan tidak ditemukan." };

  const jawab = Array.isArray(input.jawab) ? input.jawab : [];
  let benar = 0;
  const koreksi = p.questions.map((q, i) => {
    const pilih = typeof jawab[i] === "number" ? (jawab[i] as number) : null;
    const ok = pilih === q.answerIndex;
    if (ok) benar++;
    return { urutan: q.urutan, benar: ok, answerIndex: q.answerIndex, pilih };
  });
  const total = p.questions.length;
  const percent = persenSkor(benar, total);
  const detikBaca = Math.max(1, Math.round(input.detikBaca || 0));
  const wpm = hitungWpm(p.wordCount, detikBaca);
  const badge = badgeSkibaca(percent);

  // progres: simpan capaian TERBAIK (skor; jika seri, WPM lebih tinggi)
  const existing = await prisma.skibacaProgress.findUnique({
    where: { studentId_passageId: { studentId: sesi.studentId, passageId: p.id } },
  });
  const lebihBaik = !existing || percent > existing.percent || (percent === existing.percent && wpm > existing.wpm);
  if (lebihBaik) {
    await prisma.skibacaProgress.upsert({
      where: { studentId_passageId: { studentId: sesi.studentId, passageId: p.id } },
      create: { studentId: sesi.studentId, passageId: p.id, percent, wpm },
      update: { percent, wpm },
    });
  }
  // setiap percobaan tetap tercatat untuk dashboard guru
  await prisma.practiceActivity.create({
    data: {
      studentId: sesi.studentId,
      kelasLabel: sesi.kelasLabel,
      domain: "LITERASI",
      category: p.jurusanFull,
      level: `Level ${p.level}`,
      activity: p.title,
      score: percent,
      wpm,
      detail: `${benar}/${total} soal benar`,
    },
  });

  revalidatePath("/siswa/skibaca");
  revalidatePath("/siswa");
  return {
    ok: true,
    hasil: { benar, total, percent, wpm, detikBaca, badge, koreksi, title: p.title, level: p.level },
  };
}

/* ===================== TES DIAGNOSTIK (per jurusan) ===================== */
/**
 * Sampel diagnostik = bacaan pertama (urutan DIAG_URUTAN_SAMPEL) tiap level 1..5 sebuah jurusan,
 * server-authoritative (klien tak boleh memilih bacaan). Dipakai mulai & submit agar identik.
 */
async function sampelDiagnostik(kode: string) {
  return prisma.skibacaPassage.findMany({
    where: { jurusanKode: kode, urutan: DIAG_URUTAN_SAMPEL },
    orderBy: { level: "asc" },
    include: { questions: { orderBy: { urutan: "asc" } } },
  });
}

export interface MulaiDiagnostikBacaHasil {
  kode: string;
  full: string;
  icon: string;
  bacaan: DiagBacaanKlien[]; // 5 bacaan, urut level 1..5, TANPA kunci
}

/** Mulai Tes Diagnostik: kirim 5 bacaan sampel (tanpa answerIndex). Boleh diulang. */
export async function mulaiDiagnostikBaca(kode: string): Promise<MulaiDiagnostikBacaHasil> {
  const sesi = await sesiSiswa();
  if (!sesi) throw new Error("Sesi siswa tidak ditemukan.");
  const rows = await sampelDiagnostik(kode);
  if (rows.length === 0) throw new Error("Jurusan tidak dikenal.");
  return {
    kode,
    full: rows[0].jurusanFull,
    icon: rows[0].icon,
    bacaan: rows.map((p) => ({
      level: p.level,
      passageId: p.id,
      title: p.title,
      text: p.text,
      wordCount: p.wordCount,
      soal: p.questions.map((q) => ({
        urutan: q.urutan,
        q: q.q,
        options: JSON.parse(q.options) as string[], // TANPA answerIndex
      })),
    })),
  };
}

export interface SubmitDiagnostikBacaHasil {
  ok: boolean;
  error?: string;
  hasil?: HasilDiagnostikBaca;
}

/**
 * Kumpulkan Tes Diagnostik: `jawab` selaras urutan level 1..5 yang dikirim `mulai`
 * (jawab[i] = pilihan 5 soal bacaan sampel level ke-i). Server menilai thd DB,
 * menghitung skor% per level, menurunkan rekomendasi, lalu upsert hasil.
 */
export async function submitDiagnostikBaca(input: {
  kode: string;
  jawab: (number | null)[][];
}): Promise<SubmitDiagnostikBacaHasil> {
  const sesi = await sesiSiswa();
  if (!sesi) return { ok: false, error: "Sesi siswa habis. Masuk kembali." };

  const rows = await sampelDiagnostik(input.kode);
  if (rows.length === 0) return { ok: false, error: "Jurusan tidak dikenal." };

  const jawabSemua = Array.isArray(input.jawab) ? input.jawab : [];
  const perLevel: DiagLevelSkor[] = [];
  const scoresByLevel: Record<number, number> = {};
  rows.forEach((p, i) => {
    const jwb = Array.isArray(jawabSemua[i]) ? jawabSemua[i] : [];
    let benar = 0;
    p.questions.forEach((q, qi) => {
      if (typeof jwb[qi] === "number" && jwb[qi] === q.answerIndex) benar++;
    });
    const total = p.questions.length;
    const percent = persenSkor(benar, total);
    perLevel.push({ level: p.level, benar, total, percent });
    scoresByLevel[p.level] = percent;
  });

  const recommended = rekomendasiLevel(scoresByLevel);
  await prisma.skibacaDiagnostic.upsert({
    where: { studentId_jurusanKode: { studentId: sesi.studentId, jurusanKode: input.kode } },
    create: {
      studentId: sesi.studentId,
      jurusanKode: input.kode,
      recommended,
      scores: JSON.stringify(scoresByLevel),
    },
    update: { recommended, scores: JSON.stringify(scoresByLevel) },
  });

  revalidatePath("/siswa/skibaca");
  return {
    ok: true,
    hasil: { kode: input.kode, full: rows[0].jurusanFull, icon: rows[0].icon, recommended, perLevel },
  };
}
