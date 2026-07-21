"use server";
/**
 * SIMULASI GURU (sandbox ujicoba) — meniru SKIBA Math & SKIBACA untuk staf, TANPA menyimpan
 * apa pun ke DB. Tak ada baris Student/skibaTopicState/practiceActivity yang dibuat, jadi
 * hasil guru **mustahil** masuk peringkat siswa (beda sumber data — bukan sekadar disaring).
 *
 * Keamanan: sama seperti alur asli, soal DIBANGKITKAN & DINILAI di server; generator numerasi
 * tak pernah dikirim ke klien (klien hanya menerima soal tersanitasi + token ber-seed). Papan skor
 * disimpan di sisi klien (localStorage) — "tersimpan dalam simulasi", bukan di server.
 */
import { SignJWT, jwtVerify } from "jose";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildArena,
  buildDiagnostik,
  sanitasi,
  nilaiArena,
  nilaiDiagnostik,
  levelTime,
  topicValid,
  DIAG_DETIK,
  type SoalKlien,
  type HasilArena,
  type HasilDiagnostik,
} from "@/lib/skiba";
import { TOPICS } from "@/lib/soal-numerasi";
import { persenSkor, badgeSkibaca, type BadgeSkibaca } from "@/lib/skibaca";

const ALG = "HS256";
const TOKEN_MAXAGE = 60 * 40;

async function requireStafId(): Promise<string> {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) throw new Error("Sesi staf tidak ditemukan.");
  return s.user.id;
}
function tokenSecret(): Uint8Array {
  const s = process.env.STUDENT_SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("STUDENT_SESSION_SECRET belum diset.");
  return new TextEncoder().encode(s);
}
function seedAcak(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
async function signToken(claims: Record<string, unknown>, sub: string): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: ALG })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_MAXAGE}s`)
    .sign(tokenSecret());
}
async function verifyToken(token: string, kind: string, sub: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, tokenSecret(), { algorithms: [ALG], subject: sub });
    return payload.kind === kind ? (payload as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/* ===================== SKIBA MATH ===================== */

export interface SimTopik {
  id: string;
  name: string;
  icon: string;
}

export interface SimSoalPaket {
  soal: SoalKlien[];
  token: string;
  detikPerSoal: number;
}

/** Mulai tes diagnostik (30 soal campuran). */
export async function simMulaiDiagnostik(): Promise<SimSoalPaket> {
  const uid = await requireStafId();
  const seed = seedAcak();
  const soal = buildDiagnostik(seed);
  const token = await signToken({ kind: "simdiag", seed }, uid);
  return { soal: sanitasi(soal), token, detikPerSoal: DIAG_DETIK };
}

/** Nilai diagnostik dari token (rebuild dari seed) + jawaban. Tak menyimpan apa pun. */
export async function simNilaiDiagnostik(input: { token: string; jawab: (string | null)[] }): Promise<
  { ok: false; error: string } | { ok: true; hasil: HasilDiagnostik }
> {
  const uid = await requireStafId();
  const p = await verifyToken(input.token, "simdiag", uid);
  if (!p) return { ok: false, error: "Sesi diagnostik tidak sah / kedaluwarsa. Mulai ulang." };
  const soal = buildDiagnostik(Number(p.seed));
  const jawab = Array.isArray(input.jawab) ? input.jawab.slice(0, soal.length) : [];
  return { ok: true, hasil: nilaiDiagnostik(soal, jawab) };
}

export interface SimArenaHasil extends HasilArena {
  topicName: string;
  level: number;
}

/** Mulai arena satu topik & level (semua level terbuka di simulasi). */
export async function simMulaiArena(input: { topicId: string; level: number }): Promise<SimSoalPaket & { topicId: string; level: number }> {
  const uid = await requireStafId();
  if (!topicValid(input.topicId)) throw new Error("Topik tidak dikenal.");
  const lv = Math.floor(input.level);
  if (!(lv >= 1 && lv <= 20)) throw new Error("Level tidak valid.");
  const seed = seedAcak();
  const soal = buildArena(seed, input.topicId, lv);
  const token = await signToken({ kind: "simarena", topicId: input.topicId, level: lv, seed }, uid);
  return { soal: sanitasi(soal), token, detikPerSoal: levelTime(lv), topicId: input.topicId, level: lv };
}

/** Nilai arena dari token + jawaban. Tak menyimpan apa pun. */
export async function simNilaiArena(input: { token: string; jawab: (string | null)[] }): Promise<
  { ok: false; error: string } | { ok: true; hasil: SimArenaHasil }
> {
  const uid = await requireStafId();
  const p = await verifyToken(input.token, "simarena", uid);
  if (!p) return { ok: false, error: "Sesi arena tidak sah / kedaluwarsa. Mulai ulang." };
  const topicId = String(p.topicId);
  const level = Number(p.level);
  if (!topicValid(topicId) || !(level >= 1 && level <= 20)) return { ok: false, error: "Token arena rusak." };
  const soal = buildArena(Number(p.seed), topicId, level);
  const jawab = Array.isArray(input.jawab) ? input.jawab.slice(0, soal.length) : [];
  const hasil = nilaiArena(soal, jawab, level, level); // cap = level → tak ada logika unlock
  const topicName = TOPICS.find((t) => t.id === topicId)?.name ?? topicId;
  return { ok: true, hasil: { ...hasil, topicName, level } };
}

/* ===================== SKIBACA (sampel bacaan) ===================== */

export interface SimBacaanKlien {
  id: string;
  jurusanFull: string;
  icon: string;
  level: number;
  title: string;
  text: string;
  wordCount: number;
  soal: { urutan: number; q: string; options: string[] }[]; // TANPA answerIndex
}

/** Ambil beberapa bacaan kuis contoh (read-only) untuk simulasi literasi. */
export async function simContohBacaan(maks = 4): Promise<SimBacaanKlien[]> {
  await requireStafId();
  // Sampel: bacaan pertama tiap level (urutan 1), lintas level, satu jurusan pertama yang ada.
  const rows = await prisma.skibacaPassage.findMany({
    where: { tipe: "kuis", urutan: 1 },
    orderBy: [{ level: "asc" }],
    take: maks,
    include: { questions: { orderBy: { urutan: "asc" } } },
  });
  return rows.map((p) => ({
    id: p.id,
    jurusanFull: p.jurusanFull,
    icon: p.icon,
    level: p.level,
    title: p.title,
    text: p.text,
    wordCount: p.wordCount,
    soal: p.questions.map((q) => ({ urutan: q.urutan, q: q.q, options: JSON.parse(q.options) as string[] })),
  }));
}

export interface SimBacaanHasil {
  benar: number;
  total: number;
  percent: number;
  badge: BadgeSkibaca;
  koreksi: { urutan: number; benar: boolean; answerIndex: number; pilih: number | null }[];
}

/** Nilai kuis bacaan (server-authoritative vs answerIndex di DB). Tak menyimpan apa pun. */
export async function simNilaiBacaan(input: { passageId: string; jawab: (number | null)[] }): Promise<
  { ok: false; error: string } | { ok: true; hasil: SimBacaanHasil & { title: string; level: number } }
> {
  await requireStafId();
  const p = await prisma.skibacaPassage.findUnique({
    where: { id: input.passageId },
    include: { questions: { orderBy: { urutan: "asc" } } },
  });
  if (!p || p.tipe !== "kuis") return { ok: false, error: "Bacaan tidak ditemukan." };
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
  return { ok: true, hasil: { benar, total, percent, badge: badgeSkibaca(percent), koreksi, title: p.title, level: p.level } };
}
