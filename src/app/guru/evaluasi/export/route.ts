import ExcelJS from "exceljs";
import { muatEvaluasi } from "@/server/evaluasi";
import type { RekapKelas } from "@/lib/evaluasi";

const KOLOM = ["Kelas", "Jumlah Siswa", "Ikut", "Belum", "Numerasi", "Literasi", "Nilai Akhir", "Klasifikasi"];

function baris(r: RekapKelas): (string | number)[] {
  return [
    r.kelasLabel,
    r.jumlah,
    r.ikut,
    r.belum,
    r.numerasi ?? "",
    r.literasi ?? "",
    r.total ?? "",
    r.klas?.label ?? "",
  ];
}

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const kelas = url.searchParams.get("kelas") ?? "all";
  const period = url.searchParams.get("period") ?? undefined;
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

  let d;
  try {
    d = await muatEvaluasi({ kelas, period });
  } catch {
    return new Response("Tidak diizinkan.", { status: 401 });
  }

  const namaFile = `evaluasi-${d.period}`;

  if (format === "csv") {
    const lines = [KOLOM, ...d.rekap.map(baris)].map((row) => row.map(csvEscape).join(",")).join("\r\n");
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
  const ws = wb.addWorksheet(`Evaluasi ${d.namaBulan}`, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.addRow(KOLOM);
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  ws.columns.forEach((c, i) => (c.width = i === 0 ? 16 : 14));
  for (const r of d.rekap) ws.addRow(baris(r));

  const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${namaFile}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
