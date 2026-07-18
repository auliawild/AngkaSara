"use server";
/**
 * Server actions KELOLA GURU/STAF (khusus ADMIN): impor massal Excel/CSV, hapus,
 * setel ulang sandi. Akun staf = User Better Auth (login pakai NIP → email internal;
 * lihat [[impor-staf]] & staf-auth.ts). Password awal = NIP (di-hash scrypt Better Auth).
 * Semua impor berperan GURU; ADMIN dibuat terpisah (seed:admin).
 */
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { hashPassword } from "better-auth/crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseStaf } from "@/lib/excel-staf";
import { hitungImporStaf, emailDariNip, NIP_RE, type ImporStafLaporan } from "@/lib/impor-staf";

async function requireAdmin(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Sesi staf tidak ditemukan. Silakan masuk kembali.");
  const role = (session.user as { role?: string }).role ?? "GURU";
  if (role !== "ADMIN") throw new Error("Hanya Admin yang boleh mengelola guru/staf.");
}

export interface AksiResult {
  ok: boolean;
  error?: string;
}

/** Impor massal guru/staf dari .xlsx/.csv. Idempoten terhadap NIP (duplikat dilewati). */
export async function imporStaf(formData: FormData): Promise<ImporStafLaporan> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Berkas belum dipilih.");

  const baris = await parseStaf(await file.arrayBuffer(), file.name);
  if (baris.length === 0) throw new Error("Berkas tidak berisi data guru/staf.");

  const existing = new Set(
    (await prisma.user.findMany({ where: { nip: { not: null } }, select: { nip: true } }))
      .map((u) => u.nip!)
      .filter(Boolean),
  );

  const { laporan, toAdd } = hitungImporStaf(baris, existing);
  if (toAdd.length) {
    const now = new Date();
    const users: { id: string; name: string; email: string; emailVerified: boolean; role: string; nip: string; createdAt: Date; updatedAt: Date }[] = [];
    const accounts: { id: string; accountId: string; providerId: string; userId: string; password: string; createdAt: Date; updatedAt: Date }[] = [];
    for (const s of toAdd) {
      const id = randomUUID();
      users.push({
        id,
        name: s.nama,
        email: emailDariNip(s.nip),
        emailVerified: true,
        role: "GURU",
        nip: s.nip,
        createdAt: now,
        updatedAt: now,
      });
      accounts.push({
        id: randomUUID(),
        accountId: id,
        providerId: "credential",
        userId: id,
        password: await hashPassword(s.nip), // password awal = NIP
        createdAt: now,
        updatedAt: now,
      });
    }
    await prisma.$transaction([
      prisma.user.createMany({ data: users }),
      prisma.account.createMany({ data: accounts }),
    ]);
    revalidatePath("/guru/staf");
  }
  return laporan;
}

/** Hapus satu akun guru (beserta sesi & akun kredensialnya via cascade). ADMIN tak bisa dihapus di sini. */
export async function hapusStaf(userId: string): Promise<AksiResult> {
  await requireAdmin();
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!u) return { ok: false, error: "Akun tidak ditemukan." };
  if (u.role === "ADMIN") return { ok: false, error: "Akun Admin tidak bisa dihapus dari sini." };
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/guru/staf");
  return { ok: true };
}

/** Setel ulang sandi guru menjadi NIP-nya (untuk guru yang lupa password). */
export async function setelUlangSandiStaf(userId: string): Promise<AksiResult> {
  await requireAdmin();
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { nip: true, role: true } });
  if (!u) return { ok: false, error: "Akun tidak ditemukan." };
  if (!u.nip || !NIP_RE.test(u.nip)) return { ok: false, error: "Akun ini tidak punya NIP untuk dijadikan sandi." };
  await prisma.account.updateMany({
    where: { userId, providerId: "credential" },
    data: { password: await hashPassword(u.nip), updatedAt: new Date() },
  });
  return { ok: true };
}
