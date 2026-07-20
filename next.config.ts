import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // untuk image Docker ramping (lihat Dockerfile)
  // Paket Node yang tak boleh di-bundle — di-require saat runtime server & disalin
  // apa adanya ke output `standalone` (penting untuk modul native): exceljs (impor
  // Excel) serta driver DB Prisma (pg/better-sqlite3 + adapternya).
  serverExternalPackages: [
    "exceljs",
    "@prisma/adapter-pg",
    "pg",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
  ],

  // === Hemat memori (laptop dev hanya ~4 GB RAM) ===
  // Gejala bila memori habis: worker render Next mati dan browser menampilkan
  // "Jest worker encountered N child process exceptions, exceeding retry limit"
  // (bukan bug kode — lihat buglog MEM-01).
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // buang halaman dari memori setelah 1 menit menganggur
    pagesBufferLength: 2, // simpan maksimal 2 halaman terkompilasi sekaligus
  },
  experimental: {
    turbopackMemoryLimit: 1024 * 1024 * 1024, // batasi Turbopack ~1 GB
    memoryBasedWorkersCount: true, // jumlah worker mengikuti memori yang tersisa
  },
};

export default nextConfig;
