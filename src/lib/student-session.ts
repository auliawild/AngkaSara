/**
 * Sesi SISWA (login via NISN, tanpa password — kredensial lunak yang disepakati).
 * Terpisah dari Better Auth (yang untuk staf). Sesi = JWT ditandatangani `jose`,
 * disimpan di cookie httpOnly `siswa_sesi`. Middleware & server action memverifikasi.
 *
 * Rahasia: STUDENT_SESSION_SECRET (min 32 char). BEDA dari BETTER_AUTH_SECRET.
 */
import { SignJWT, jwtVerify } from "jose";

export const STUDENT_COOKIE = "siswa_sesi";
const ALG = "HS256";
const MAX_AGE = 60 * 60 * 8; // 8 jam

export interface StudentSession {
  studentId: string;
  nisn: string;
  nama: string;
  kelasLabel: string;
}

function secret(): Uint8Array {
  const s = process.env.STUDENT_SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("STUDENT_SESSION_SECRET belum diset / terlalu pendek");
  return new TextEncoder().encode(s);
}

/** Tanda tangani sesi siswa → string JWT untuk disimpan di cookie. */
export async function signStudentSession(s: StudentSession): Promise<string> {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

/** Verifikasi token; null jika tak sah / kedaluwarsa. Aman dipakai di Edge middleware. */
export async function verifyStudentSession(token: string | undefined): Promise<StudentSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: [ALG] });
    const { studentId, nisn, nama, kelasLabel } = payload as Record<string, unknown>;
    if (typeof studentId === "string" && typeof nisn === "string" && typeof nama === "string" && typeof kelasLabel === "string") {
      return { studentId, nisn, nama, kelasLabel };
    }
    return null;
  } catch {
    return null;
  }
}

export const STUDENT_COOKIE_MAXAGE = MAX_AGE;
