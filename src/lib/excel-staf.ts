/**
 * Impor & template GURU/STAF via Excel/CSV — dipakai server action `imporStaf`
 * dan route unduh template `/guru/staf/template`. Node runtime saja (exceljs).
 *
 * Format diterima: satu lembar dengan kolom Nama, NIP (judul dicari otomatis dalam
 * 8 baris pertama; urut bebas). Tanpa baris judul → kolom A=Nama, B=NIP. Validasi NIP
 * & keunikan dilakukan di layer impor (impor-staf.ts), bukan di sini.
 */
import ExcelJS from "exceljs";
import { readRows, type BarisMentah } from "./excel";

export interface BarisStaf {
  baris: number; // nomor baris di berkas (1-based) untuk laporan galat
  nama: string;
  nip: string; // mentah — divalidasi di impor-staf
}

const NAMA_LEMBAR = "Guru & Staf";

/* ============================ BACA ============================ */

export async function parseStaf(buffer: ArrayBuffer, filename: string): Promise<BarisStaf[]> {
  return mapRowsStaf(await readRows(buffer, filename));
}

/** Cari baris judul (Nama/NIP) → petakan kolom; jika tak ada, asumsi A=Nama, B=NIP. */
function mapRowsStaf(rows: BarisMentah[]): BarisStaf[] {
  let headerIdx = -1;
  let colNama = -1;
  let colNip = -1;
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    const cells = rows[i].cells.map((c) => (c || "").toLowerCase().trim());
    const iNa = cells.findIndex((c) => c.includes("nama") || c === "name");
    const iNip = cells.findIndex((c) => c.includes("nip") || c.includes("nomor induk"));
    if (iNa >= 0 && iNip >= 0) {
      headerIdx = i;
      colNama = iNa;
      colNip = iNip;
      break;
    }
  }
  if (headerIdx < 0) {
    colNama = 0;
    colNip = 1;
  }
  const out: BarisStaf[] = [];
  const start = headerIdx < 0 ? 0 : headerIdx + 1;
  for (let i = start; i < rows.length; i++) {
    const { r, cells } = rows[i];
    const nama = (cells[colNama] || "").replace(/\s+/g, " ").trim();
    const nip = (cells[colNip] || "").replace(/\s+/g, "").trim();
    if (!nama && !nip) continue; // baris kosong
    out.push({ baris: r, nama, nip });
  }
  return out;
}

/* ============================ TULIS (template) ============================ */

/**
 * Template kosong: header Nama|NIP + beberapa baris contoh kosong. Kolom NIP diformat
 * teks agar angka panjang/berawalan nol tidak berubah. Password awal = NIP (tak ada kolom).
 */
export async function templateStaf(): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AngkaSara";
  const ws = wb.addWorksheet(NAMA_LEMBAR, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Nama", key: "nama", width: 34 },
    { header: "NIP", key: "nip", width: 24 },
  ];
  ws.getColumn(2).numFmt = "@"; // teks — jaga NIP apa adanya

  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  head.alignment = { vertical: "middle" };
  head.height = 20;

  ws.addRow({ nama: "Contoh: Budi Santoso, S.Pd", nip: "198501012010011001" });
  for (let i = 0; i < 40; i++) ws.addRow({ nama: "", nip: "" });

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}
