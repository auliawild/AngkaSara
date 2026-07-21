"use server";
/**
 * Login STAF via NIP + password. NIP dipetakan ke email internal (emailDariNip) lalu
 * diteruskan ke Better Auth (signInEmail; cookie sesi ditulis oleh plugin nextCookies).
 * Akun admin lama berbasis email tetap didukung: bila input mengandung "@" diperlakukan
 * sebagai email. Logout staf tetap lewat auth-client / route Better Auth.
 */
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { tampakEmail } from "@/lib/impor-staf";

export interface MasukStafResult {
  ok: boolean;
  error?: string;
}

/** Login staf: NIP (atau email untuk admin) + password → set cookie sesi Better Auth. */
export async function masukStaf(idRaw: string, password: string): Promise<MasukStafResult> {
  const id = String(idRaw || "").trim();
  if (!id || !password) return { ok: false, error: "NIP dan kata sandi wajib diisi." };

  let email: string | null = null;
  if (tampakEmail(id)) {
    email = id.toLowerCase();
  } else {
    const nip = id.replace(/\s+/g, "");
    const u = await prisma.user.findUnique({ where: { nip }, select: { email: true } });
    email = u?.email ?? null;
  }
  if (!email) return { ok: false, error: "NIP tidak terdaftar. Hubungi admin." };

  try {
    await auth.api.signInEmail({ body: { email, password }, headers: await headers() });
  } catch {
    return { ok: false, error: "NIP atau kata sandi salah." };
  }
  return { ok: true };
}

/**
 * Ubah kata sandi sendiri (self-service, semua staf yang sudah masuk — termasuk admin).
 * Better Auth `changePassword` memverifikasi sandi lama & me-rehash yang baru (scrypt).
 * Sesi saat ini tetap valid; sesi perangkat lain dicabut demi keamanan.
 */
export async function ubahSandiSendiri(input: {
  sandiLama: string;
  sandiBaru: string;
}): Promise<MasukStafResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, error: "Sesi tidak ditemukan. Silakan masuk kembali." };

  const lama = input.sandiLama ?? "";
  const baru = input.sandiBaru ?? "";
  if (baru.length < 8) return { ok: false, error: "Kata sandi baru minimal 8 karakter." };
  if (baru === lama) return { ok: false, error: "Kata sandi baru harus berbeda dari yang lama." };

  try {
    await auth.api.changePassword({
      body: { currentPassword: lama, newPassword: baru, revokeOtherSessions: true },
      headers: await headers(),
    });
  } catch {
    return { ok: false, error: "Kata sandi lama salah." };
  }
  return { ok: true };
}
