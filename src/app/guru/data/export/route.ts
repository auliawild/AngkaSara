import ExcelJS from "exceljs";
import { muatDataPenelitian } from "@/server/penelitian";
import type { AgregatPenelitian } from "@/lib/penelitian";

/** Kolom rekap penelitian (baris = satu kelas, plus baris SEKOLAH). */
const KOLOM = [
  "Kelas",
  "Jumlah Siswa",
  "Diag SKIBA (n)",
  "Diag SKIBA Skor",
  "Diag SKIBA Level",
  "Diag SKIBACA (n)",
  "Diag SKIBACA Skor",
  "Diag SKIBACA Lv Saran",
  "Check Point (n)",
  "CP Numerasi",
  "CP Literasi",
  "CP Total",
  "SKIBA Level (rata)",
  "SKIBA Level (total)",
  "SKIBA Topik Tuntas",
  "SKIBA Poin (rata)",
  "SKIBACA Bacaan (rata)",
  "SKIBACA Bacaan (total)",
  "SKIBACA % Kuis",
  "SKIBACA WPM",
  "Aktivitas Num (rata)",
  "Aktivitas Lit (rata)",
];

const kosong = (x: number | null) => (x == null ? "" : x);

function baris(label: string, a: AgregatPenelitian): (string | number)[] {
  return [
    label,
    a.jumlahSiswa,
    a.diagSkibaN,
    kosong(a.diagSkibaSkor),
    kosong(a.diagSkibaLevel),
    a.diagBacaN,
    kosong(a.diagBacaSkor),
    kosong(a.diagBacaRec),
    a.cpN,
    kosong(a.cpNumerasi),
    kosong(a.cpLiterasi),
    kosong(a.cpTotal),
    a.skibaLevelRata,
    a.skibaLevelTotal,
    a.skibaTuntasTotal,
    a.skibaPoinRata,
    a.bacaSelesaiRata,
    a.bacaSelesaiTotal,
    kosong(a.bacaPersen),
    kosong(a.bacaWpm),
    a.aktivitasNumRata,
    a.aktivitasLitRata,
  ];
}

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "csv" ? "csv" : "xlsx";

  let d;
  try {
    d = await muatDataPenelitian();
  } catch {
    return new Response("Tidak diizinkan.", { status: 401 });
  }

  const tanggal = d.dibuatPada.slice(0, 10);
  const namaFile = `data-penelitian-${tanggal}`;
  const semua: (string | number)[][] = [
    ...d.perKelas.map((k) => baris(k.kelasLabel, k)),
    baris("SEKOLAH (semua)", d.sekolah),
  ];

  if (format === "csv") {
    const lines = [KOLOM, ...semua].map((row) => row.map(csvEscape).join(",")).join("\r\n");
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
  const ws = wb.addWorksheet("Rekap per Kelas", { views: [{ state: "frozen", ySplit: 1, xSplit: 1 }] });
  ws.addRow(KOLOM);
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C3AED" } };
  ws.columns.forEach((c, i) => (c.width = i === 0 ? 18 : 15));
  for (const r of d.perKelas) ws.addRow(baris(r.kelasLabel, r));
  const totalRow = ws.addRow(baris("SEKOLAH (semua)", d.sekolah));
  totalRow.font = { bold: true };
  totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEDE9FE" } };

  // Sheet perkembangan sekolah (siap grafik): diagnostik → Check Point tiap bulan (skala 0–100).
  const KOLOM_P = ["Titik", "Periode", "Tipe", "Numerasi (SKIBA)", "Literasi (SKIBACA)", "Δ Num vs Diagnostik", "Δ Lit vs Diagnostik"];
  const pw = wb.addWorksheet("Perkembangan", { views: [{ state: "frozen", ySplit: 1 }] });
  pw.addRow(KOLOM_P);
  const phead = pw.getRow(1);
  phead.font = { bold: true, color: { argb: "FFFFFFFF" } };
  phead.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C3AED" } };
  pw.columns.forEach((c, i) => (c.width = i === 0 ? 18 : 18));
  for (const t of d.perkembangan) {
    pw.addRow([
      t.label,
      t.period ?? "",
      t.tipe === "diagnostik" ? "Diagnostik" : "Check Point",
      kosong(t.numerasi),
      kosong(t.literasi),
      kosong(t.selisihNum),
      kosong(t.selisihLit),
    ]);
  }

  // Sheet metadata untuk konteks penelitian.
  const meta = wb.addWorksheet("Keterangan");
  meta.getColumn(1).width = 26;
  meta.getColumn(2).width = 70;
  const info: [string, string][] = [
    ["Sumber", "AngkaSara — SMK Negeri 1 Badegan Ponorogo"],
    ["Diambil pada", d.dibuatPada],
    ["Cakupan", `Seluruh siswa aktif satu sekolah (${d.sekolah.jumlahSiswa} siswa, ${d.perKelas.length} kelas)`],
    ["Diagnostik & Check Point", "Rata-rata dihitung HANYA atas siswa yang mengikuti; kolom (n) = jumlah pengikut."],
    ["Progres pengerjaan", "Rata-rata atas SELURUH siswa (yang belum mengerjakan dihitung 0)."],
    ["Mutu SKIBACA (% Kuis, WPM)", "Hanya atas siswa yang sudah membaca minimal satu bacaan."],
    ["Skala penilaian bersama", "Seluruh skor asesmen (Diagnostik SKIBA & SKIBACA, Check Point numerasi & literasi) memakai skala TUNGGAL 0–100 dengan band sama (Perlu Bimbingan <60 / Cukup 60–74 / Baik 75–89 / Mahir ≥90) → SKIBA & SKIBACA dapat dibandingkan langsung."],
    ["Sheet Perkembangan", "Deret siap grafik: baseline diagnostik lalu rata Check Point tiap bulan; kolom Δ = Check Point − diagnostik (positif = naik dari asesmen awal)."],
    ["Skala lain", "SKIBA Level: 0–200. Diag SKIBACA Lv Saran: 1–5. Diag SKIBA Level: 1–20."],
  ];
  info.forEach(([k, v]) => {
    const row = meta.addRow([k, v]);
    row.getCell(1).font = { bold: true };
  });

  const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${namaFile}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
