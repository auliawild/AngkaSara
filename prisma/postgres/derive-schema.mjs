/**
 * Menghasilkan prisma/postgres/schema.prisma dari prisma/schema.prisma (sumber kebenaran model).
 * Hanya menukar target datasource ke PostgreSQL + menyesuaikan path output generator.
 * Jalankan ulang tiap kali schema dev berubah:  npm run db:pg:sync
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "schema.prisma");
const out = join(here, "schema.prisma");

let s = readFileSync(src, "utf8");

// generator output turun satu level (schema kini di prisma/postgres/)
s = s.replace('"../src/generated/prisma"', '"../../src/generated/prisma"');

// header
s = s.replace(
  /^\/\/ AngkaSara — skema Prisma\..*$/m,
  "// AngkaSara — skema Prisma PRODUKSI (PostgreSQL).",
);
s = s.replace(
  /^\/\/ SEMENTARA memakai SQLite.*$/m,
  "//   JANGAN diedit manual — dihasilkan dari prisma/schema.prisma via `npm run db:pg:sync`.",
);
s = s.replace(/^\/\/ {3}Lihat buglog SQLITE-01.*$/m, "//   Runtime memilih adapter pg via DATABASE_URL (lihat src/lib/db.ts).");

// datasource: provider saja. URL wajib lewat prisma.config.ts di Prisma 7
// (lihat prisma/postgres/prisma.config.ts). Runtime pakai adapter pg (src/lib/db.ts).
s = s.replace('provider = "sqlite"', 'provider = "postgresql"');
s = s.replace(
  /^ {2}\/\/ Prisma 7: URL pindah.*$/m,
  '  // URL untuk Migrate/CLI ada di prisma/postgres/prisma.config.ts; runtime pakai adapter pg.',
);

writeFileSync(out, s);
console.log("OK: prisma/postgres/schema.prisma diperbarui dari prisma/schema.prisma");
