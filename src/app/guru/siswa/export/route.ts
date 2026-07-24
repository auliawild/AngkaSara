import { headers } from "next/headers";
import ExcelJS from "exceljs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Unduh daftar siswa satu kelas beserta UserName (kredensial login siswa).
 * Khusus ADMIN (sejajar penjaga halaman /guru/siswa). Format: ?format=xlsx|csv.
 */
const KOLOM = ["No", "Nama", "UserName (login)", "Kelas", "Status"];

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function amanNamaFile(s: string): string {
  return s.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "kelas";
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Tidak diizinkan.", { status: 401 });
  const role = (session.user as { role?: string }).role ?? "GURU";
  if (role !== "ADMIN") return new Response("Khusus admin.", { status: 403 });

  const url = new URL(req.url);
  const kelasId = url.searchParams.get("kelas") ?? "";
  const format = url.searchParams.get("format") === "csv" ? "csv" : "xlsx";

  const kelas = await prisma.kelas.findUnique({ where: { id: kelasId }, select: { label: true } });
  if (!kelas) return new Response("Kelas tidak ditemukan.", { status: 404 });

  const siswa = await prisma.student.findMany({
    where: { kelasId },
    orderBy: { nama: "asc" },
    select: { nisn: true, nama: true, aktif: true },
  });

  const rows: (string | number)[][] = siswa.map((s, i) => [
    i + 1,
    s.nama,
    s.nisn,
    kelas.label,
    s.aktif ? "Aktif" : "Nonaktif",
  ]);

  const namaFile = `siswa-${amanNamaFile(kelas.label)}`;

  if (format === "csv") {
    const lines = [KOLOM, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
    return new Response("﻿" + lines, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${namaFile}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "AngkaSara";
  const ws = wb.addWorksheet(kelas.label, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.addRow(KOLOM);
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  ws.columns = [{ width: 6 }, { width: 32 }, { width: 18 }, { width: 14 }, { width: 12 }];
  // UserName sebagai teks agar angka awal tak hilang / tak jadi notasi ilmiah di Excel.
  for (const r of rows) {
    const row = ws.addRow(r);
    row.getCell(3).numFmt = "@";
  }

  const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${namaFile}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
