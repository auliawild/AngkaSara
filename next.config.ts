import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // untuk image Docker ramping (lihat Dockerfile)
  // exceljs (impor/template siswa) adalah lib Node besar — jangan di-bundle,
  // biarkan di-require saat runtime server (route handler & server action).
  serverExternalPackages: ["exceljs"],
};

export default nextConfig;
