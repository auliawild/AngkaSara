/**
 * Prisma client bersama untuk skrip seed (tsx). Memilih adapter dari skema DATABASE_URL:
 *   postgres:// → PrismaPg (produksi)   ·   selain itu (file:./…) → SQLite (dev lokal).
 * Sengaja pakai path relatif (bukan alias @/) supaya tsx tak perlu resolusi paths.
 * Sejalan dengan pemilihan adapter di src/lib/db.ts.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL as string;
const isPostgres = !!url && /^postgres(ql)?:\/\//i.test(url);

const adapter = isPostgres ? new PrismaPg({ connectionString: url }) : new PrismaBetterSqlite3({ url });

export const prisma = new PrismaClient({ adapter });
