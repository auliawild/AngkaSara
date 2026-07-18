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
