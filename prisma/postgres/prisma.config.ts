import { defineConfig, env } from "prisma/config";

/**
 * Konfigurasi Prisma untuk PRODUKSI (PostgreSQL) — dipakai oleh `prisma generate`
 * & `prisma migrate deploy` di dalam container. URL diambil dari variabel lingkungan
 * DATABASE_URL yang disuntikkan compose (tanpa dotenv — env sudah tersedia di proses).
 *
 * Dev lokal tetap memakai prisma.config.ts di root (SQLite). Lihat DEPLOY.md.
 */
// CATATAN: path di bawah relatif terhadap LOKASI file config ini (prisma/postgres/),
// bukan direktori kerja. Jadi cukup "./schema.prisma" & "./migrations".
export default defineConfig({
  schema: "./schema.prisma",
  migrations: {
    path: "./migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
