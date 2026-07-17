import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Prisma 7 pakai driver adapter. SEMENTARA SQLite (dev lokal tanpa Docker/Postgres).
// Kembali ke Postgres: ganti ke PrismaPg({ connectionString }). Lihat buglog SQLITE-01.
// Singleton supaya HMR dev tak bikin koneksi berganda.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL as string });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
