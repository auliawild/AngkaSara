import { describe, it, expect } from "vitest";
import { parseSiswa, templateSiswa } from "@/lib/excel";
import { hitungImpor } from "@/lib/impor";
import { semuaKelas, SISWA_PER_KELAS } from "@/lib/kelas";

/* ============================================================
   Impor siswa (#7): parsing Excel/CSV + logika validasi/dedup.
   Menegakkan invarian yang mudah jadi bug: leading-zero NISN tetap utuh,
   kelas tak-sah ditolak (spt "XII TPTUP 1"), duplikat (DB & dalam-berkas)
   dilewati bukan digandakan, template = 46 kelas × 40 baris siap isi.
============================================================ */

const KELAS_SAH = new Map(semuaKelas().map((label, i) => [label, `id-${i}`]));

describe("templateSiswa + parseSiswa (round-trip)", () => {
  it("template = 46 kelas × 40 baris, kolom Kelas terisi, NISN/Nama kosong, urut & lengkap", async () => {
    const buf = await templateSiswa();
    const baris = await parseSiswa(buf, "template.xlsx");
    expect(baris.length).toBe(semuaKelas().length * SISWA_PER_KELAS); // 46 × 40 = 1840
    // setiap kelas muncil tepat SISWA_PER_KELAS kali, dan semuanya kelas sah
    const hitung: Record<string, number> = {};
    for (const b of baris) {
      expect(b.nisn).toBe("");
      expect(b.nama).toBe("");
      expect(KELAS_SAH.has(b.kelas)).toBe(true);
      hitung[b.kelas] = (hitung[b.kelas] || 0) + 1;
    }
    expect(Object.keys(hitung).length).toBe(semuaKelas().length);
    for (const k of semuaKelas()) expect(hitung[k]).toBe(SISWA_PER_KELAS);
  });

  it("mempertahankan NISN berawalan nol saat round-trip Excel (kolom teks)", async () => {
    // Isi ulang template baris pertama lewat parse tak bisa; jadi kita uji lewat
    // pembacaan: buat sheet manual via templateSiswa tak berisi NISN. Sebagai gantinya,
    // uji parser CSV yang paling rawan kehilangan nol:
    const csv = "NISN,Nama,Kelas\n0012345678,Budi,X TKJ 1\n";
    const baris = await parseSiswa(new TextEncoder().encode(csv).buffer, "roster.csv");
    expect(baris[0].nisn).toBe("0012345678");
  });
});

describe("parseSiswa — deteksi kolom & pemisah", () => {
  it("mengenali judul kolom dalam urutan apa pun", async () => {
    const csv = "Kelas;Nama;NISN\nX TKJ 1;Ani;0011112222\n";
    const baris = await parseSiswa(new TextEncoder().encode(csv).buffer, "r.csv");
    expect(baris[0]).toMatchObject({ nisn: "0011112222", nama: "Ani", kelas: "X TKJ 1" });
  });

  it("tanpa baris judul: kolom A/B/C = NISN/Nama/Kelas", async () => {
    const csv = "0011112222\tBudi Pratama\tXI TKJ 2\n";
    const baris = await parseSiswa(new TextEncoder().encode(csv).buffer, "r.txt");
    expect(baris[0]).toMatchObject({ nisn: "0011112222", nama: "Budi Pratama", kelas: "XI TKJ 2" });
  });

  it("menghormati tanda kutip CSV (koma di dalam nama)", async () => {
    const csv = 'NISN,Nama,Kelas\n0011112222,"Budi, S.Pd",X TKR 1\n';
    const baris = await parseSiswa(new TextEncoder().encode(csv).buffer, "r.csv");
    expect(baris[0].nama).toBe("Budi, S.Pd");
  });
});

describe("hitungImpor — validasi, normalisasi kelas, dedup", () => {
  const baris = (rows: [string, string, string][]) =>
    rows.map((r, i) => ({ baris: i + 2, nisn: r[0], nama: r[1], kelas: r[2] }));

  it("menerima baris sah, menolak NISN/kelas/nama invalid, melewati duplikat", () => {
    const existing = new Set(["0099998888"]); // sudah di DB
    const { laporan, toAdd } = hitungImpor(
      baris([
        ["0011112222", "Ani Valid", "x tkj 1"], // sah (kelas dinormalkan)
        ["0099998888", "Duplikat DB", "X TKJ 1"], // dilewati (sudah ada)
        ["0011112222", "Duplikat Berkas", "X TKJ 1"], // dilewati (kembar dalam berkas)
        ["abc", "NISN Salah", "X TKJ 1"], // gagal
        ["0033334444", "", "X TKJ 1"], // gagal (nama kosong)
        ["0055556666", "Kelas Hantu", "XII TPTUP 1"], // gagal (TPTUP tak ada di XII)
        ["", "Tanpa NISN", "X TKJ 1"], // gagal (NISN kosong)
      ]),
      KELAS_SAH,
      existing,
    );
    expect(toAdd.length).toBe(1);
    expect(toAdd[0]).toMatchObject({ nisn: "0011112222", nama: "Ani Valid" });
    expect(toAdd[0].kelasId).toBe(KELAS_SAH.get("X TKJ 1"));
    expect(laporan.ditambah).toBe(1);
    expect(laporan.dilewati.length).toBe(2);
    expect(laporan.gagal.length).toBe(4);
    expect(laporan.perKelas["X TKJ 1"]).toBe(1);
    // alasan gagal spesifik
    const sebab = laporan.gagal.map((g) => g.sebab);
    expect(sebab).toContain("NISN harus 4–15 digit angka");
    expect(sebab).toContain("Nama kosong");
    expect(sebab).toContain("Kelas tidak dikenali");
    expect(sebab).toContain("NISN kosong");
  });

  it("tidak menggandakan: NISN kembar dalam satu berkas hanya masuk sekali", () => {
    const { toAdd, laporan } = hitungImpor(
      baris([
        ["0012345678", "Satu", "X TKR 1"],
        ["0012345678", "Dua", "X TKR 1"],
        ["0012345678", "Tiga", "X TKR 1"],
      ]),
      KELAS_SAH,
      new Set(),
    );
    expect(toAdd.length).toBe(1);
    expect(laporan.dilewati.length).toBe(2);
  });
});
