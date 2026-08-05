"use server";
/**
 * Pantauan guru (guru + admin, dibatasi LINGKUP kelas seperti Laporan/Evaluasi).
 *
 * - `muatPantauan`: daftar siswa dengan status kehadiran (online real-time dari
 *   `Student.lastSeen`) + rekap kegiatan HARI INI.
 * - `muatPantauanSiswa`: detail 1 siswa — hub level SKIBA (cermin tampilan siswa)
 *   + lini masa riwayat lengkap (SKIBA/SKIBACA + Check Point).
 * Aturan murni di `lib/pantau.ts`. Peringkat/skor tak disentuh.
 */
import { prisma } from "@/lib/db";
import { urutkanKelas, BULAN_PENDEK } from "@/lib/kelas";
import { lingkupKelas, whereLabel, bolehKelas, dibatasiKe } from "@/server/lingkup";
import { TOPICS } from "@/lib/soal-numerasi";
import { MAX_DIAG_ATTEMPTS } from "@/lib/skiba";
import {
  statusKehadiran,
  ringkasHarian,
  gabungRiwayat,
  labelWaktuLalu,
  type StatusKehadiran,
  type AktivitasRingkas,
} from "@/lib/pantau";

const URUT_STATUS: Record<StatusKehadiran, number> = { online: 0, baru: 1, lama: 2 };

function awalHari(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** "5 Agu, 10.15" dari sebuah tanggal. */
function jamTanggal(d: Date): string {
  const jam = String(d.getHours()).padStart(2, "0");
  const menit = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${BULAN_PENDEK[d.getMonth()]}, ${jam}.${menit}`;
}

/* ===================== DAFTAR PANTAUAN ===================== */
export interface BarisPantau {
  siswaId: string;
  nama: string;
  nisn: string;
  kelasLabel: string;
  status: StatusKehadiran;
  lastSeenLabel: string;
  aktifNum: number;
  aktifLit: number;
  aktifTotal: number;
  terakhirLabel: string | null; // aktivitas terakhir hari ini + jam
}

export interface DataPantau {
  kelasOpsi: string[];
  kelasTerpilih: string | null;
  dibatasiKe: string[] | null;
  onlineCount: number;
  totalCount: number;
  siswa: BarisPantau[];
}

/** Muat daftar siswa dalam lingkup (opsional saring 1 kelas) + status & kegiatan hari ini. */
export async function muatPantauan(params: { kelas?: string } = {}): Promise<DataPantau> {
  const lingkup = await lingkupKelas(); // sekaligus penjaga sesi staf
  const labelIn = whereLabel(lingkup);

  const kelasRows = await prisma.kelas.findMany({
    where: { aktif: true, ...(labelIn ? { label: labelIn } : {}) },
    select: { label: true },
  });
  const kelasOpsi = kelasRows.map((k) => k.label).sort(urutkanKelas);
  const kelasTerpilih = params.kelas && kelasOpsi.includes(params.kelas) ? params.kelas : null;

  const siswaRows = await prisma.student.findMany({
    where: {
      aktif: true,
      kelas: { label: kelasTerpilih ? kelasTerpilih : labelIn ? labelIn : undefined },
    },
    select: { id: true, nama: true, nisn: true, lastSeen: true, kelas: { select: { label: true } } },
  });

  const now = new Date();
  const mulai = awalHari(now);
  const ids = siswaRows.map((s) => s.id);
  const aktivitas = ids.length
    ? await prisma.practiceActivity.findMany({
        where: { studentId: { in: ids }, createdAt: { gte: mulai } },
        select: { studentId: true, domain: true, activity: true, category: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Kelompokkan aktivitas hari ini per siswa.
  const perSiswa = new Map<string, { num: number; lit: number; terakhir: { label: string; waktu: Date } | null }>();
  for (const a of aktivitas) {
    let e = perSiswa.get(a.studentId);
    if (!e) {
      e = { num: 0, lit: 0, terakhir: null };
      perSiswa.set(a.studentId, e);
    }
    if (a.domain === "NUMERASI") e.num++;
    else if (a.domain === "LITERASI") e.lit++;
    // aktivitas sudah desc → yang pertama ditemui = terbaru.
    if (!e.terakhir) e.terakhir = { label: `${a.activity || a.category} · ${jamTanggal(a.createdAt)}`, waktu: a.createdAt };
  }

  const siswa: BarisPantau[] = siswaRows.map((s) => {
    const e = perSiswa.get(s.id);
    return {
      siswaId: s.id,
      nama: s.nama,
      nisn: s.nisn,
      kelasLabel: s.kelas.label,
      status: statusKehadiran(s.lastSeen, now),
      lastSeenLabel: labelWaktuLalu(s.lastSeen, now),
      aktifNum: e?.num ?? 0,
      aktifLit: e?.lit ?? 0,
      aktifTotal: (e?.num ?? 0) + (e?.lit ?? 0),
      terakhirLabel: e?.terakhir?.label ?? null,
    };
  });

  // Urut: status kehadiran → paling aktif hari ini → nama.
  siswa.sort(
    (a, b) =>
      URUT_STATUS[a.status] - URUT_STATUS[b.status] ||
      b.aktifTotal - a.aktifTotal ||
      a.nama.localeCompare(b.nama, "id"),
  );

  return {
    kelasOpsi,
    kelasTerpilih,
    dibatasiKe: dibatasiKe(lingkup),
    onlineCount: siswa.filter((s) => s.status === "online").length,
    totalCount: siswa.length,
    siswa,
  };
}

/* ===================== DETAIL SISWA ===================== */
export interface TopikPantau {
  topicId: string;
  name: string;
  icon: string;
  maxUnlocked: number;
  score: number;
  recLevel: number;
  selesai: number; // jumlah level tuntas
}

export interface ItemRiwayatKlien {
  waktuLabel: string;
  ikon: string;
  jenis: string;
  judul: string;
  detail?: string;
  skor: number;
  poin?: number | null;
  bintang?: number | null;
  wpm?: number | null;
}

export interface DetailPantau {
  siswaId: string;
  nama: string;
  nisn: string;
  kelasLabel: string;
  status: StatusKehadiran;
  lastSeenLabel: string;
  totalScore: number;
  topikDibuka: number;
  topik: TopikPantau[];
  diagAttempts: number;
  diagMaks: number;
  diagScore: number | null;
  riwayat: ItemRiwayatKlien[];
}

function parseProgress(json: string): number[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((n): n is number => typeof n === "number") : [];
  } catch {
    return [];
  }
}

const RIWAYAT_MAKS = 150;

/**
 * Detail 1 siswa untuk Pantauan. `null` bila di luar lingkup staf (halaman → notFound()).
 */
export async function muatPantauanSiswa(siswaId: string): Promise<DetailPantau | null> {
  const lingkup = await lingkupKelas();
  const s = await prisma.student.findUnique({
    where: { id: siswaId },
    select: {
      id: true,
      nama: true,
      nisn: true,
      lastSeen: true,
      kelas: { select: { label: true } },
    },
  });
  if (!s || !bolehKelas(lingkup, s.kelas.label)) return null;

  const [topikRows, profile, aktivitasRows, checkpointRows] = await Promise.all([
    prisma.skibaTopicState.findMany({ where: { studentId: siswaId } }),
    prisma.skibaProfile.findUnique({ where: { studentId: siswaId } }),
    prisma.practiceActivity.findMany({
      where: { studentId: siswaId },
      orderBy: { createdAt: "desc" },
      take: RIWAYAT_MAKS,
      select: {
        domain: true,
        category: true,
        level: true,
        activity: true,
        score: true,
        points: true,
        stars: true,
        wpm: true,
        createdAt: true,
      },
    }),
    prisma.checkpointResult.findMany({
      where: { studentId: siswaId, status: "submitted" },
      orderBy: { submittedAt: "desc" },
      select: {
        period: true,
        total: true,
        numerasi: true,
        literasi: true,
        benarNum: true,
        totalNum: true,
        benarLit: true,
        totalLit: true,
        submittedAt: true,
      },
    }),
  ]);

  const byId = new Map(topikRows.map((r) => [r.topicId, r]));
  const topik: TopikPantau[] = TOPICS.map((t) => {
    const r = byId.get(t.id);
    return {
      topicId: t.id,
      name: t.name,
      icon: t.icon,
      maxUnlocked: r?.maxUnlocked ?? 1,
      score: r?.score ?? 0,
      recLevel: r?.recLevel ?? 1,
      selesai: r ? parseProgress(r.progress).length : 0,
    };
  });

  const items = gabungRiwayat(aktivitasRows as AktivitasRingkas[], checkpointRows);
  const riwayat: ItemRiwayatKlien[] = items.map((it) => ({
    waktuLabel: jamTanggal(it.waktu),
    ikon: it.ikon,
    jenis: it.jenis,
    judul: it.judul,
    detail: it.detail,
    skor: it.skor,
    poin: it.poin,
    bintang: it.bintang,
    wpm: it.wpm,
  }));

  const now = new Date();
  return {
    siswaId: s.id,
    nama: s.nama,
    nisn: s.nisn,
    kelasLabel: s.kelas.label,
    status: statusKehadiran(s.lastSeen, now),
    lastSeenLabel: labelWaktuLalu(s.lastSeen, now),
    totalScore: topik.reduce((sum, t) => sum + t.score, 0),
    topikDibuka: topik.filter((t) => t.maxUnlocked > 1).length,
    topik,
    diagAttempts: profile?.diagAttempts ?? 0,
    diagMaks: MAX_DIAG_ATTEMPTS,
    diagScore: profile?.diagScore ?? null,
    riwayat,
  };
}
