"use server";
/**
 * Server actions ALUR SKIBA MATH (siswa). Sama filosofi Check Point: soal
 * DIBANGKITKAN & DINILAI di server; klien tak pernah menerima kunci.
 *
 * Alih-alih menyimpan attempt di DB, dipakai TOKEN JWT ber-seed (jose, secret
 * STUDENT_SESSION_SECRET, terikat ke studentId, kedaluwarsa 30 mnt):
 *   mulai*  → build soal dari seed acak, kirim tersanitasi + token berisi seed.
 *   submit* → verifikasi token (server yang menerbitkan), rebuild soal identik
 *             dari seed, nilai, lalu tulis state + PracticeActivity.
 * Unlock level & kuota diagnostik (maks 2×) DITEGAKKAN DI SERVER.
 */
import { SignJWT, jwtVerify } from "jose";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { sesiSiswa } from "@/server/student-auth";
import {
  buildArena,
  buildDiagnostik,
  sanitasi,
  nilaiArena,
  nilaiDiagnostik,
  levelTime,
  topicValid,
  MAX_DIAG_ATTEMPTS,
  DIAG_DETIK,
  type SoalKlien,
  type HasilArena,
  type HasilDiagnostik,
} from "@/lib/skiba";
import { TOPICS } from "@/lib/soal-numerasi";

const ALG = "HS256";
const TOKEN_MAXAGE = 60 * 30; // 30 menit untuk menyelesaikan satu arena/diagnostik

function tokenSecret(): Uint8Array {
  const s = process.env.STUDENT_SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("STUDENT_SESSION_SECRET belum diset.");
  return new TextEncoder().encode(s);
}
function seedAcak(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
async function signToken(claims: Record<string, unknown>, studentId: string): Promise<string> {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: ALG })
    .setSubject(studentId)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_MAXAGE}s`)
    .sign(tokenSecret());
}
async function verifyToken(
  token: string,
  kind: string,
  studentId: string,
): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, tokenSecret(), { algorithms: [ALG], subject: studentId });
    if (payload.kind !== kind) return null;
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

/* ===================== MUAT STATE ===================== */
export interface TopikState {
  topicId: string;
  name: string;
  icon: string;
  maxUnlocked: number;
  score: number;
  recLevel: number;
  progress: number[];
}
export interface SkibaData {
  topik: TopikState[];
  totalScore: number;
  diagAttempts: number;
  diagSisa: number;
}

/** Muat state semua topik + kuota diagnostik untuk siswa aktif. */
export async function muatSkiba(): Promise<SkibaData> {
  const sesi = await sesiSiswa();
  if (!sesi) throw new Error("Sesi siswa tidak ditemukan. Silakan masuk kembali.");
  const [rows, profile] = await Promise.all([
    prisma.skibaTopicState.findMany({ where: { studentId: sesi.studentId } }),
    prisma.skibaProfile.findUnique({ where: { studentId: sesi.studentId } }),
  ]);
  const byId = new Map(rows.map((r) => [r.topicId, r]));
  const topik: TopikState[] = TOPICS.map((t) => {
    const r = byId.get(t.id);
    let progress: number[] = [];
    if (r) {
      try {
        progress = JSON.parse(r.progress) as number[];
      } catch {
        progress = [];
      }
    }
    return {
      topicId: t.id,
      name: t.name,
      icon: t.icon,
      maxUnlocked: r?.maxUnlocked ?? 1,
      score: r?.score ?? 0,
      recLevel: r?.recLevel ?? 1,
      progress,
    };
  });
  const diagAttempts = profile?.diagAttempts ?? 0;
  return {
    topik,
    totalScore: topik.reduce((s, t) => s + t.score, 0),
    diagAttempts,
    diagSisa: Math.max(0, MAX_DIAG_ATTEMPTS - diagAttempts),
  };
}

/* ===================== ARENA ===================== */
export interface MulaiArenaHasil {
  soal: SoalKlien[];
  token: string;
  detikPerSoal: number;
  level: number;
  topicId: string;
  topicName: string;
}

/** Mulai arena: validasi topik & UNLOCK di server, bangun 10 soal dari seed acak. */
export async function mulaiArena(topicId: string, level: number): Promise<MulaiArenaHasil> {
  const sesi = await sesiSiswa();
  if (!sesi) throw new Error("Sesi siswa tidak ditemukan.");
  if (!topicValid(topicId)) throw new Error("Topik tidak dikenal.");
  const lv = Math.floor(level);
  if (!(lv >= 1 && lv <= 20)) throw new Error("Level tidak valid.");

  const st = await prisma.skibaTopicState.findUnique({
    where: { studentId_topicId: { studentId: sesi.studentId, topicId } },
  });
  const cap = st?.maxUnlocked ?? 1;
  if (lv > cap) throw new Error(`Level ${lv} masih terkunci untuk topik ini.`);

  const seed = seedAcak();
  const soal = buildArena(seed, topicId, lv);
  const token = await signToken({ kind: "arena", topicId, level: lv, seed }, sesi.studentId);
  const t = TOPICS.find((x) => x.id === topicId)!;
  return { soal: sanitasi(soal), token, detikPerSoal: levelTime(lv), level: lv, topicId, topicName: t.name };
}

export interface SubmitArenaHasil {
  ok: boolean;
  error?: string;
  hasil?: HasilArena & { topicName: string; level: number };
}

/** Kumpulkan arena: rebuild dari token+seed, nilai, update state & catat aktivitas. */
export async function submitArena(input: {
  token: string;
  jawab: (string | null)[];
}): Promise<SubmitArenaHasil> {
  const sesi = await sesiSiswa();
  if (!sesi) return { ok: false, error: "Sesi siswa habis. Masuk kembali." };
  const p = await verifyToken(input.token, "arena", sesi.studentId);
  if (!p) return { ok: false, error: "Sesi arena tidak sah / kedaluwarsa. Mulai ulang." };

  const topicId = String(p.topicId);
  const level = Number(p.level);
  const seed = Number(p.seed);
  if (!topicValid(topicId) || !(level >= 1 && level <= 20)) {
    return { ok: false, error: "Token arena rusak." };
  }
  const soal = buildArena(seed, topicId, level);

  const st = await prisma.skibaTopicState.findUnique({
    where: { studentId_topicId: { studentId: sesi.studentId, topicId } },
  });
  const cap = st?.maxUnlocked ?? 1;
  const jwb = Array.isArray(input.jawab) ? input.jawab.slice(0, soal.length) : [];
  const hasil = nilaiArena(soal, jwb, level, cap);

  let progress: number[] = [];
  if (st) {
    try {
      progress = JSON.parse(st.progress) as number[];
    } catch {
      progress = [];
    }
  }
  if (!progress.includes(level)) progress.push(level);
  const newMax = hasil.unlockNext ?? cap;
  const t = TOPICS.find((x) => x.id === topicId)!;

  await prisma.$transaction([
    prisma.skibaTopicState.upsert({
      where: { studentId_topicId: { studentId: sesi.studentId, topicId } },
      create: {
        studentId: sesi.studentId,
        topicId,
        maxUnlocked: newMax,
        score: hasil.points,
        recLevel: 1,
        progress: JSON.stringify(progress),
      },
      update: {
        maxUnlocked: newMax,
        score: { increment: hasil.points },
        progress: JSON.stringify(progress),
      },
    }),
    prisma.practiceActivity.create({
      data: {
        studentId: sesi.studentId,
        kelasLabel: sesi.kelasLabel,
        domain: "NUMERASI",
        category: t.name,
        level: `Level ${level}`,
        activity: `${t.name} Lv${level}`,
        score: hasil.skor,
        stars: hasil.bintang,
        points: hasil.points,
        detail: `${hasil.benar}/${hasil.total} benar`,
      },
    }),
  ]);

  revalidatePath("/siswa/skiba");
  revalidatePath("/siswa");
  return { ok: true, hasil: { ...hasil, topicName: t.name, level } };
}

/* ===================== DIAGNOSTIK ===================== */
export interface MulaiDiagHasil {
  soal: SoalKlien[];
  token: string;
  detikPerSoal: number;
  sisa: number;
}

/** Mulai diagnostik: tegakkan kuota (maks 2×) & konsumsi 1 kuota di server (spt versi lama). */
export async function mulaiDiagnostik(): Promise<MulaiDiagHasil> {
  const sesi = await sesiSiswa();
  if (!sesi) throw new Error("Sesi siswa tidak ditemukan.");
  const profile = await prisma.skibaProfile.findUnique({ where: { studentId: sesi.studentId } });
  const used = profile?.diagAttempts ?? 0;
  if (used >= MAX_DIAG_ATTEMPTS)
    throw new Error(`Kesempatan tes diagnostik sudah habis (maksimal ${MAX_DIAG_ATTEMPTS}×).`);

  await prisma.skibaProfile.upsert({
    where: { studentId: sesi.studentId },
    create: { studentId: sesi.studentId, diagAttempts: 1 },
    update: { diagAttempts: { increment: 1 } },
  });

  const seed = seedAcak();
  const soal = buildDiagnostik(seed);
  const token = await signToken({ kind: "diag", seed }, sesi.studentId);
  revalidatePath("/siswa/skiba");
  return { soal: sanitasi(soal), token, detikPerSoal: DIAG_DETIK, sisa: MAX_DIAG_ATTEMPTS - used - 1 };
}

export interface SubmitDiagHasil {
  ok: boolean;
  error?: string;
  hasil?: HasilDiagnostik;
}

/** Kumpulkan diagnostik: rebuild dari seed, nilai per-topik, set recLevel & buka level awal. */
export async function submitDiagnostik(input: {
  token: string;
  jawab: (string | null)[];
}): Promise<SubmitDiagHasil> {
  const sesi = await sesiSiswa();
  if (!sesi) return { ok: false, error: "Sesi siswa habis. Masuk kembali." };
  const p = await verifyToken(input.token, "diag", sesi.studentId);
  if (!p) return { ok: false, error: "Sesi diagnostik tidak sah / kedaluwarsa." };

  const soal = buildDiagnostik(Number(p.seed));
  const jwb = Array.isArray(input.jawab) ? input.jawab.slice(0, soal.length) : [];
  const hasil = nilaiDiagnostik(soal, jwb);

  const existing = await prisma.skibaTopicState.findMany({ where: { studentId: sesi.studentId } });
  const byId = new Map(existing.map((r) => [r.topicId, r]));
  // Simpan skor & waktu diagnostik sebagai baseline grafik perkembangan (raport).
  await prisma.skibaProfile.upsert({
    where: { studentId: sesi.studentId },
    create: { studentId: sesi.studentId, diagAttempts: 1, diagScore: hasil.pct, diagAt: new Date() },
    update: { diagScore: hasil.pct, diagAt: new Date() },
  });
  await prisma.$transaction(
    hasil.rincian.map((r) => {
      const cur = byId.get(r.topicId);
      const newMax = Math.max(cur?.maxUnlocked ?? 1, r.recLevel);
      return prisma.skibaTopicState.upsert({
        where: { studentId_topicId: { studentId: sesi.studentId, topicId: r.topicId } },
        create: {
          studentId: sesi.studentId,
          topicId: r.topicId,
          maxUnlocked: newMax,
          recLevel: r.recLevel,
          score: 0,
          progress: "[]",
        },
        update: { maxUnlocked: newMax, recLevel: r.recLevel },
      });
    }),
  );

  revalidatePath("/siswa/skiba");
  return { ok: true, hasil };
}
