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

/** Pastikan sesi ADMIN; kembalikan sesinya (butuh id utk cegah hapus diri sendiri). */
async function adminSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Sesi staf tidak ditemukan. Silakan masuk kembali.");
  const role = (session.user as { role?: string }).role ?? "GURU";
  if (role !== "ADMIN") throw new Error("Hanya Admin yang boleh mengelola guru/staf.");
  return session;
}

async function requireAdmin(): Promise<void> {
  await adminSession();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AksiResult {
  ok: boolean;
  error?: string;
}

/**
 * Tambah satu akun ADMIN (login pakai email + password). Terpisah dari impor guru (yang selalu GURU).
 * `kelasIds` opsional = kelas yang boleh dinilai admin ini (Nilai Ringkasan). Kosong = akses semua kelas.
 */
export async function tambahAdmin(input: {
  nama: string;
  email: string;
  password: string;
  kelasIds?: string[];
}): Promise<AksiResult> {
  await requireAdmin();
  const nama = input.nama.trim().replace(/\s+/g, " ");
  const email = input.email.trim().toLowerCase();
  const password = input.password ?? "";
  const kelasIds = [...new Set(input.kelasIds ?? [])];
  if (!nama) return { ok: false, error: "Nama wajib diisi." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Email tidak valid." };
  if (password.length < 8) return { ok: false, error: "Kata sandi minimal 8 karakter." };
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } }))
    return { ok: false, error: "Email sudah dipakai." };

  const now = new Date();
  const id = randomUUID();
  await prisma.$transaction([
    prisma.user.create({
      data: {
        id,
        name: nama,
        email,
        emailVerified: true,
        role: "ADMIN",
        createdAt: now,
        updatedAt: now,
        ...(kelasIds.length ? { kelasDinilai: { connect: kelasIds.map((k) => ({ id: k })) } } : {}),
      },
    }),
    prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: id,
        providerId: "credential",
        userId: id,
        password: await hashPassword(password),
        createdAt: now,
        updatedAt: now,
      },
    }),
  ]);
  revalidatePath("/guru/staf");
  return { ok: true };
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

/**
 * Hapus satu akun guru/admin (beserta sesi & kredensialnya via cascade). Penjaga:
 * tak bisa hapus akun sendiri, dan tak boleh menghapus admin terakhir (harus tersisa ≥1 admin).
 */
export async function hapusStaf(userId: string): Promise<AksiResult> {
  const s = await adminSession();
  if (userId === s.user.id) return { ok: false, error: "Tidak bisa menghapus akun sendiri." };
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!u) return { ok: false, error: "Akun tidak ditemukan." };
  if (u.role === "ADMIN") {
    const jml = await prisma.user.count({ where: { role: "ADMIN" } });
    if (jml <= 1) return { ok: false, error: "Minimal harus ada 1 admin." };
  }
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/guru/staf");
  return { ok: true };
}

/**
 * Setel kelas yang boleh dinilai (Nilai Ringkasan) untuk satu staf. Kosong = akses semua kelas.
 * Menggantikan seluruh daftar (bukan menambah). Hanya ADMIN.
 */
export async function setKelasDinilai(userId: string, kelasIds: string[]): Promise<AksiResult> {
  await requireAdmin();
  const ids = [...new Set(kelasIds ?? [])];
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!u) return { ok: false, error: "Akun tidak ditemukan." };

  // Validasi id kelas benar-benar ada (hindari connect id sampah).
  if (ids.length) {
    const ada = await prisma.kelas.count({ where: { id: { in: ids } } });
    if (ada !== ids.length) return { ok: false, error: "Sebagian kelas tidak valid." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { kelasDinilai: { set: ids.map((k) => ({ id: k })) } },
  });
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
