"use server";
/**
 * Server actions login/logout SISWA (via NISN). Validasi ke tabel Student,
 * lalu set cookie sesi jose. Tak ada password (kredensial lunak yang disepakati).
 */
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import {
  signStudentSession,
  verifyStudentSession,
  STUDENT_COOKIE,
  STUDENT_COOKIE_MAXAGE,
  type StudentSession,
} from "@/lib/student-session";

export interface MasukResult {
  ok: boolean;
  error?: string;
}

/** Login siswa: NISN valid & aktif → set cookie sesi. */
export async function masukSiswa(nisnRaw: string): Promise<MasukResult> {
  const nisn = String(nisnRaw || "").trim();
  if (!/^\d{4,15}$/.test(nisn)) return { ok: false, error: "NISN hanya berisi angka (4–15 digit)." };

  const s = await prisma.student.findUnique({
    where: { nisn },
    include: { kelas: true },
  });
  if (!s) return { ok: false, error: "NISN tidak terdaftar. Hubungi guru." };
  if (!s.aktif) return { ok: false, error: "Akun siswa nonaktif. Hubungi guru." };

  const sesi: StudentSession = { studentId: s.id, nisn: s.nisn, nama: s.nama, kelasLabel: s.kelas.label };
  const token = await signStudentSession(sesi);
  const jar = await cookies();
  jar.set(STUDENT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: STUDENT_COOKIE_MAXAGE,
  });
  return { ok: true };
}

/** Logout siswa: hapus cookie sesi. */
export async function keluarSiswa(): Promise<void> {
  const jar = await cookies();
  jar.delete(STUDENT_COOKIE);
}

/** Baca sesi siswa saat ini (server component / action). null bila belum login. */
export async function sesiSiswa(): Promise<StudentSession | null> {
  const jar = await cookies();
  return verifyStudentSession(jar.get(STUDENT_COOKIE)?.value);
}
