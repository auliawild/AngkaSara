import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 pakai driver adapter. Adapter dipilih dari skema DATABASE_URL:
//   - postgres:// atau postgresql://  → PostgreSQL (PRODUKSI, container/VPS)
//   - selain itu (mis. file:./…)      → SQLite (DEV lokal; Docker/Postgres tak jalan di laptop)
// Client di-generate per lingkungan: dev dari prisma/schema.prisma (sqlite),
// produksi dari prisma/postgres/schema.prisma (postgresql) di dalam Docker.
// Lihat DEPLOY.md & buglog SQLITE-01. Singleton supaya HMR dev tak bikin koneksi berganda.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function isPostgres(url: string | undefined): boolean {
  return !!url && /^postgres(ql)?:\/\//i.test(url);
}

function createPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL as string;
  const adapter = isPostgres(url)
    ? new PrismaPg({ connectionString: url })
    : new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
