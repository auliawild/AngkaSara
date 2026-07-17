/**
 * Better Auth — otentikasi STAF (email + password, RBAC lewat field `role`).
 * Siswa TIDAK lewat sini (mereka login via NISN → cookie jose; lihat student-session.ts).
 *
 * Prisma 7 pakai driver adapter (better-sqlite3, dev). prismaAdapter cukup diberi
 * instance PrismaClient kita (src/lib/db.ts). provider "sqlite" wajib disebut.
 * `role` didaftarkan sbg additionalField supaya ikut tersimpan & terbaca di sesi.
 */
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    // Sekolah internal: tak ada verifikasi email / reset via email (belum ada SMTP).
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "GURU",
        input: false, // tak boleh diset dari sisi klien saat sign-up
      },
    },
  },
  // nextCookies() HARUS plugin terakhir — menuliskan cookie sesi di server actions.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
