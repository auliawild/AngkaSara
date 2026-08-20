"use server";
/**
 * Loader DATA PENELITIAN tingkat SEKOLAH (khusus ADMIN).
 *
 * Menyatukan tiga ranah untuk keperluan penelitian, seluruh siswa aktif satu sekolah:
 *   - Tes Diagnostik : SKIBA (SkibaProfile.diagScore + rata SkibaTopicState.recLevel) &
 *                      SKIBACA (SkibacaDiagnostic.scores → rata %, recommended)
 *   - Check Point    : rata CheckpointResult (numerasi/literasi/total) antar bulan tiap siswa
 *   - Progres        : level SKIBA (SkibaTopicState.progress), bacaan SKIBACA (SkibacaProgress),
 *                      keaktifan (PracticeActivity per domain)
 *
 * Agregasi berat memakai `groupBy` supaya tidak menarik ribuan baris ke memori (laptop dev
 * ±4 GB, buglog MEM-01). Rumus rata-rata ada di `src/lib/penelitian.ts` (murni & diuji).
 * Rekap agregat saja — TIDAK ada baris/identitas per siswa (keputusan produk).
 */
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { urutkanKelas } from "@/lib/kelas";
import { rekapPenelitian, type SiswaMetrik, type RekapPenelitian } from "@/lib/penelitian";

/** Pastikan sesi ADMIN (halaman se-sekolah bersifat sensitif). */
async function requireAdmin(): Promise<void> {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) throw new Error("Sesi staf tidak ditemukan. Silakan masuk kembali.");
  const role = (s.user as { role?: string }).role ?? "GURU";
  if (role !== "ADMIN") throw new Error("Hanya Admin yang boleh membuka Data Penelitian.");
}

function panjangProgress(json: string): number {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((n) => typeof n === "number").length : 0;
  } catch {
    return 0;
  }
}

/** Rata skor % antar level dari JSON SkibacaDiagnostic.scores ({ "1": 80, ... }). */
function rataScoresDiag(json: string): number | null {
  try {
    const obj = JSON.parse(json) as Record<string, unknown>;
    const vals = Object.values(obj).filter((v): v is number => typeof v === "number");
    return vals.length ? Math.round(vals.reduce((s, x) => s + x, 0) / vals.length) : null;
  } catch {
    return null;
  }
}

export interface DataPenelitian extends RekapPenelitian {
  dibuatPada: string; // ISO waktu snapshot diambil (untuk lampiran penelitian)
}

/** Muat rekap penelitian seluruh sekolah (admin). */
export async function muatDataPenelitian(): Promise<DataPenelitian> {
  await requireAdmin();

  const students = await prisma.student.findMany({
    where: { aktif: true },
    select: { id: true, kelas: { select: { label: true } } },
  });
  const dibuatPada = new Date().toISOString();
  if (students.length === 0) {
    return { sekolah: rekapPenelitian([], urutkanKelas).sekolah, perKelas: [], dibuatPada };
  }
  const ids = students.map((s) => s.id);

  const [profil, skibaRows, diagBaca, cpRows, bacaRows, aktRows] = await Promise.all([
    // Diagnostik SKIBA: skor % awal per siswa.
    prisma.skibaProfile.findMany({
      where: { studentId: { in: ids } },
      select: { studentId: true, diagScore: true },
    }),
    // SkibaTopicState: level selesai (progress), poin (score), rata recLevel.
    prisma.skibaTopicState.findMany({
      where: { studentId: { in: ids } },
      select: { studentId: true, progress: true, score: true, recLevel: true },
    }),
    // Diagnostik SKIBACA: recommended + scores (bisa >1 baris/jurusan; ambil terbaru per siswa).
    prisma.skibacaDiagnostic.findMany({
      where: { studentId: { in: ids } },
      select: { studentId: true, recommended: true, scores: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    // Check Point: seluruh baris submitted (1/siswa/bulan) → rata antar bulan di memori.
    prisma.checkpointResult.findMany({
      where: { studentId: { in: ids }, status: "submitted" },
      select: { studentId: true, numerasi: true, literasi: true, total: true },
    }),
    // SKIBACA progres: cacah bacaan + rata persen & WPM.
    prisma.skibacaProgress.groupBy({
      by: ["studentId"],
      where: { studentId: { in: ids } },
      _count: { _all: true },
      _avg: { percent: true, wpm: true },
    }),
    // Keaktifan latihan per domain.
    prisma.practiceActivity.groupBy({
      by: ["studentId", "domain"],
      where: { studentId: { in: ids } },
      _count: { _all: true },
    }),
  ]);

  const bulat = (x: number | null) => (x == null ? null : Math.round(x));

  // Diagnostik SKIBA skor.
  const diagSkiba = new Map<string, number | null>();
  for (const p of profil) diagSkiba.set(p.studentId, p.diagScore ?? null);

  // SKIBA: level selesai, poin, tuntas, rata recLevel per siswa.
  const skiba = new Map<string, { level: number; poin: number; tuntas: number; recSum: number; recN: number }>();
  for (const r of skibaRows) {
    const cur = skiba.get(r.studentId) ?? { level: 0, poin: 0, tuntas: 0, recSum: 0, recN: 0 };
    const n = panjangProgress(r.progress);
    cur.level += Math.min(n, 20);
    cur.poin += r.score;
    if (n >= 20) cur.tuntas += 1;
    cur.recSum += r.recLevel;
    cur.recN += 1;
    skiba.set(r.studentId, cur);
  }

  // Diagnostik SKIBACA: baris terbaru per siswa (findMany sudah desc → yang pertama terlihat = terbaru).
  const diagBacaMap = new Map<string, { rec: number; skor: number | null }>();
  for (const d of diagBaca) {
    if (!diagBacaMap.has(d.studentId)) {
      diagBacaMap.set(d.studentId, { rec: d.recommended, skor: rataScoresDiag(d.scores) });
    }
  }

  // Check Point: rata antar bulan per siswa.
  const cpAcc = new Map<string, { num: number; lit: number; tot: number; n: number }>();
  for (const r of cpRows) {
    const cur = cpAcc.get(r.studentId) ?? { num: 0, lit: 0, tot: 0, n: 0 };
    cur.num += r.numerasi;
    cur.lit += r.literasi;
    cur.tot += r.total;
    cur.n += 1;
    cpAcc.set(r.studentId, cur);
  }

  // SKIBACA progres.
  const baca = new Map<string, { n: number; persen: number | null; wpm: number | null }>();
  for (const r of bacaRows) {
    baca.set(r.studentId, { n: r._count._all, persen: bulat(r._avg.percent), wpm: bulat(r._avg.wpm) });
  }

  // Keaktifan.
  const aktNum = new Map<string, number>();
  const aktLit = new Map<string, number>();
  for (const r of aktRows) {
    if (r.domain === "NUMERASI") aktNum.set(r.studentId, (aktNum.get(r.studentId) ?? 0) + r._count._all);
    else if (r.domain === "LITERASI") aktLit.set(r.studentId, (aktLit.get(r.studentId) ?? 0) + r._count._all);
  }

  const rows: SiswaMetrik[] = students.map((s) => {
    const sk = skiba.get(s.id);
    const db = diagBacaMap.get(s.id);
    const cp = cpAcc.get(s.id);
    const b = baca.get(s.id);
    const skorSkiba = diagSkiba.get(s.id) ?? null;
    return {
      kelasLabel: s.kelas.label,
      // recLevel hanya bermakna setelah diagnostik SKIBA (default 1 untuk semua topik).
      diagSkibaSkor: skorSkiba,
      diagSkibaLevel: skorSkiba != null && sk && sk.recN > 0 ? Math.round(sk.recSum / sk.recN) : null,
      diagBacaSkor: db?.skor ?? null,
      diagBacaRec: db?.rec ?? null,
      cpNumerasi: cp ? Math.round(cp.num / cp.n) : null,
      cpLiterasi: cp ? Math.round(cp.lit / cp.n) : null,
      cpTotal: cp ? Math.round(cp.tot / cp.n) : null,
      cpBulan: cp?.n ?? 0,
      skibaLevel: sk?.level ?? 0,
      skibaPoin: sk?.poin ?? 0,
      skibaTuntas: sk?.tuntas ?? 0,
      bacaSelesai: b?.n ?? 0,
      bacaPersen: b?.persen ?? null,
      bacaWpm: b?.wpm ?? null,
      aktivitasNum: aktNum.get(s.id) ?? 0,
      aktivitasLit: aktLit.get(s.id) ?? 0,
    };
  });

  return { ...rekapPenelitian(rows, urutkanKelas), dibuatPada };
}
