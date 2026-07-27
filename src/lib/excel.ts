/**
 * Impor & template siswa via Excel/CSV — dipakai server action `imporSiswa`
 * dan route unduh template `/guru/siswa/template`. Node runtime saja (exceljs).
 *
 * Format yang diterima: satu lembar dengan kolom Nama & Kelas (judul kolom dicari
 * otomatis dalam 8 baris pertama; boleh urut apa saja). Kolom NISN/UserName opsional.
 * Bila tak ada baris judul, diasumsikan A=Nama, B=Kelas. Validasi/normalisasi kelas &
 * pembuatan UserName otomatis dilakukan di server action, BUKAN di sini (lib ini murni baca/tulis).
 */
import ExcelJS from "exceljs";
import { semuaKelas, SISWA_PER_KELAS } from "./kelas";

export interface BarisSiswa {
  baris: number; // nomor baris di berkas (1-based) untuk laporan galat
  nisn: string;
  nama: string;
  kelas: string; // mentah — belum dinormalisasi
}

const NAMA_LEMBAR = "Siswa";

/* ============================ BACA ============================ */

/** Baris mentah sebuah berkas (dipakai bersama oleh impor siswa & staf). */
export interface BarisMentah {
  r: number; // nomor baris 1-based
  cells: string[];
}

/** Deteksi jenis berkas lalu baca jadi baris mentah {r, cells}. Pemetaan kolom dilakukan pemanggil. */
export async function readRows(buffer: ArrayBuffer, filename: string): Promise<BarisMentah[]> {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  if (ext === "csv" || ext === "txt") return csvRows(new TextDecoder().decode(buffer));
  try {
    return await xlsxRows(buffer);
  } catch (e) {
    // .xls (biner lama) tak didukung exceljs → pesan jelas.
    throw new Error(
      ext === "xls"
        ? "Format .xls lama tidak didukung. Simpan ulang sebagai .xlsx lalu impor kembali."
        : `Berkas tidak bisa dibaca sebagai Excel (${(e as Error).message}).`,
    );
  }
}

/** Deteksi jenis berkas dari nama lalu parse jadi baris {nisn, nama, kelas}. */
export async function parseSiswa(buffer: ArrayBuffer, filename: string): Promise<BarisSiswa[]> {
  return mapRows(await readRows(buffer, filename));
}

async function xlsxRows(buffer: ArrayBuffer): Promise<BarisMentah[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("berkas tidak memiliki lembar kerja");
  const rows: { r: number; cells: string[] }[] = [];
  ws.eachRow({ includeEmpty: false }, (row, r) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, c) => {
      cells[c - 1] = cellText(cell);
    });
    rows.push({ r, cells });
  });
  return rows;
}

/** Ambil teks sel apa adanya (angka NISN tetap string; rich text/hyperlink/formula ditangani). */
function cellText(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v == null) return "";
  if (typeof v === "object") {
    if ("richText" in v && Array.isArray((v as { richText: { text: string }[] }).richText))
      return (v as { richText: { text: string }[] }).richText.map((t) => t.text).join("");
    if ("text" in v && typeof (v as { text: unknown }).text === "string") return (v as { text: string }).text;
    if ("result" in v) return String((v as { result: unknown }).result ?? "");
  }
  return String(cell.text ?? "").trim();
}

function csvRows(teks: string): BarisMentah[] {
  const sep = deteksiPemisah(teks);
  return teks
    .split(/\r?\n/)
    .map((b, i) => ({ r: i + 1, isi: b }))
    .filter((x) => x.isi.trim() !== "")
    .map((x) => ({ r: x.r, cells: pecahBaris(x.isi, sep) }));
}

function deteksiPemisah(teks: string): string {
  const baris1 = teks.split(/\r?\n/).find((b) => b.trim() !== "") || "";
  if (baris1.indexOf("\t") >= 0) return "\t";
  const koma = (baris1.match(/,/g) || []).length;
  const titikKoma = (baris1.match(/;/g) || []).length;
  return titikKoma > koma ? ";" : ",";
}

/** Pecah satu baris CSV, menghormati tanda kutip ("Budi, S.Pd" tetap satu kolom). */
function pecahBaris(baris: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let dalamKutip = false;
  for (let i = 0; i < baris.length; i++) {
    const c = baris[i];
    if (c === '"') {
      if (dalamKutip && baris[i + 1] === '"') {
        cur += '"';
        i++;
      } else dalamKutip = !dalamKutip;
    } else if (c === sep && !dalamKutip) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/**
 * Cari baris judul: yang WAJIB hanya Nama & Kelas (UserName dibuat otomatis).
 * Kolom NISN/UserName bersifat opsional — kalau ada & terisi, dipakai sbagai UserName.
 * Jika tak ada baris judul, diasumsikan A=Nama, B=Kelas.
 */
function mapRows(rows: { r: number; cells: string[] }[]): BarisSiswa[] {
  let headerIdx = -1;
  let colNisn = -1;
  let colNama = -1;
  let colKelas = -1;
  for (let i = 0; i < Math.min(rows.length, 8); i++) {
    const cells = rows[i].cells.map((c) => (c || "").toLowerCase().trim());
    const iNa = cells.findIndex((c) => c.includes("nama") || c === "name");
    const iK = cells.findIndex((c) => c.includes("kelas"));
    if (iNa >= 0 && iK >= 0) {
      headerIdx = i;
      colNama = iNa;
      colKelas = iK;
      colNisn = cells.findIndex((c) => c.includes("nisn") || c.includes("username") || c.includes("user name"));
      break;
    }
  }
  if (headerIdx < 0) {
    // tanpa judul: A=Nama, B=Kelas (UserName otomatis, tak ada kolom NISN)
    colNama = 0;
    colKelas = 1;
    colNisn = -1;
  }
  const out: BarisSiswa[] = [];
  const start = headerIdx < 0 ? 0 : headerIdx + 1;
  for (let i = start; i < rows.length; i++) {
    const { r, cells } = rows[i];
    const nisn = colNisn >= 0 ? (cells[colNisn] || "").trim() : "";
    const nama = (cells[colNama] || "").replace(/\s+/g, " ").trim();
    const kelas = (cells[colKelas] || "").trim();
    if (!nisn && !nama && !kelas) continue; // baris kosong
    out.push({ baris: r, nisn, nama, kelas });
  }
  return out;
}

/* ============================ TULIS (template) ============================ */

/**
 * Template kosong siap isi: header Nama|Kelas, lalu 46 kelas × 40 baris dengan
 * kolom Kelas terisi. Guru cukup mengisi Nama — UserName login dibuat otomatis
 * setelah impor (lihat [[username]]).
 */
export async function templateSiswa(): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AngkaSara";
  const ws = wb.addWorksheet(NAMA_LEMBAR, {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  ws.columns = [
    { header: "Nama", key: "nama", width: 34 },
    { header: "Kelas", key: "kelas", width: 14 },
  ];

  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  head.alignment = { vertical: "middle" };
  head.height = 20;

  for (const kelas of semuaKelas()) {
    for (let i = 0; i < SISWA_PER_KELAS; i++) {
      ws.addRow({ nama: "", kelas });
    }
  }
  // exceljs mengembalikan Buffer Node; cukup untuk Response.
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}
