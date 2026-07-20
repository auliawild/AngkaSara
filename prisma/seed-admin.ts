/**
 * Seed 1 akun ADMIN awal (staf) untuk Better Auth. Idempoten.
 * Jalankan: `npm run seed:admin`. Kredensial dari env (ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_NAME);
 * ada fallback DEV — WAJIB diganti di produksi.
 *
 * Password di-hash dgn hasher default Better Auth (better-auth/crypto → scrypt) dan
 * disimpan di account(providerId="credential") supaya cocok saat sign-in.
 */
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { prisma } from "./seed-client";

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@smkn1badegan.sch.id").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin-angkasara-2026";
  const name = process.env.ADMIN_NAME || "Administrator";
  if (!process.env.ADMIN_PASSWORD) {
    console.warn("⚠  ADMIN_PASSWORD tak diset — pakai default DEV. GANTI sebelum produksi.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
    console.log(`Admin ${email} sudah ada → role dipastikan ADMIN.`);
    await prisma.$disconnect();
    return;
  }

  const now = new Date();
  const userId = randomUUID();
  await prisma.user.create({
    data: { id: userId, name, email, emailVerified: true, role: "ADMIN", createdAt: now, updatedAt: now },
  });
  await prisma.account.create({
    data: {
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    },
  });
  console.log(`Admin dibuat: ${email}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
