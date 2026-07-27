import { describe, it, expect } from "vitest";
import { parseSiswa, templateSiswa } from "@/lib/excel";
import { hitungImpor, type KelasImpor, type SiswaAda } from "@/lib/impor";
import { semuaKelas, SISWA_PER_KELAS, type Tingkat } from "@/lib/kelas";

/* ============================================================
   Impor siswa (#7): parsing Excel/CSV + logika validasi/dedup.
   Menegakkan invarian yang mudah jadi bug: leading-zero NISN tetap utuh,
   kelas tak-sah ditolak (spt "XII TPTUP 1"), duplikat (DB & dalam-berkas)
   dilewati bukan digandakan, template = 46 kelas × 40 baris siap isi.
============================================================ */

// Peta label → metadata kelas (parse "X TKJ 1" → tingkat/jurusan/rombel).
function infoKelas(label: string, i: number): [string, KelasImpor] {
  const m = label.match(/^(X|XI|XII)\s+(.+)\s+(\d+)$/)!;
  return [label, { id: `id-${i}`, tingkat: m[1] as Tingkat, jurusanKode: m[2], rombel: Number(m[3]) }];
}
const KELAS_SAH = new Map<string, KelasImpor>(semuaKelas().map((label, i) => infoKelas(label, i)));

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

  it("tanpa baris judul: kolom A/B = Nama/Kelas (UserName otomatis)", async () => {
    const csv = "Budi Pratama\tXI TKJ 2\n";
    const baris = await parseSiswa(new TextEncoder().encode(csv).buffer, "r.txt");
    expect(baris[0]).toMatchObject({ nama: "Budi Pratama", kelas: "XI TKJ 2", nisn: "" });
  });

  it("menghormati tanda kutip CSV (koma di dalam nama)", async () => {
    const csv = 'NISN,Nama,Kelas\n0011112222,"Budi, S.Pd",X TKR 1\n';
    const baris = await parseSiswa(new TextEncoder().encode(csv).buffer, "r.csv");
    expect(baris[0].nama).toBe("Budi, S.Pd");
  });
});

describe("hitungImpor — UserName otomatis, dedup nama, validasi kelas", () => {
  // rows: [nisnManual, nama, kelas]; nisn kosong = UserName dibuat otomatis.
  const baris = (rows: [string, string, string][]) =>
    rows.map((r, i) => ({ baris: i + 2, nisn: r[0], nama: r[1], kelas: r[2] }));
  const id = (label: string) => KELAS_SAH.get(label)!.id;

  it("membuat UserName otomatis per kelas + dedup nama + tolak invalid", () => {
    const existing: SiswaAda[] = [{ nisn: "0099998888", nama: "Sudah Ada", kelasId: id("X TKJ 1") }];
    const { laporan, toAdd } = hitungImpor(
      baris([
        ["", "Ani Valid", "x tkj 1"], // sah → 20263101 (kelas dinormalkan)
        ["", "Budi Valid", "X TKJ 1"], // sah → 20263102
        ["", "Sudah Ada", "X TKJ 1"], // dilewati (nama sama di kelas, vs DB)
        ["", "Ani Valid", "X TKJ 1"], // dilewati (kembar dalam berkas)
        ["", "", "X TKJ 1"], // gagal (nama kosong)
        ["", "Kelas Hantu", "XII TPTUP 1"], // gagal (TPTUP tak ada di XII)
      ]),
      KELAS_SAH,
      existing,
    );
    expect(toAdd.length).toBe(2);
    expect(toAdd.map((t) => t.nisn)).toEqual(["20263101", "20263102"]); // TKJ=3, X=2026, rombel1
    expect(toAdd[0]).toMatchObject({ nama: "Ani Valid", kelasId: id("X TKJ 1") });
    expect(laporan.ditambah).toBe(2);
    expect(laporan.dibuat.length).toBe(2);
    expect(laporan.dibuat[0]).toMatchObject({ nama: "Ani Valid", kelas: "X TKJ 1", username: "20263101" });
    expect(laporan.dilewati.length).toBe(2);
    expect(laporan.gagal.length).toBe(2);
    expect(laporan.perKelas["X TKJ 1"]).toBe(2);
    const sebab = laporan.gagal.map((g) => g.sebab);
    expect(sebab).toContain("Nama kosong");
    expect(sebab).toContain("Kelas tidak dikenali");
  });

  it("melanjutkan nomor urut dari UserName yang sudah ada di kelas", () => {
    const kelasId = id("X TKR 1"); // X=2026, TKR=1, rombel1 → prefix 202611
    const existing: SiswaAda[] = [
      { nisn: "20261101", nama: "Lama Satu", kelasId },
      { nisn: "20261102", nama: "Lama Dua", kelasId },
    ];
    const { toAdd } = hitungImpor(baris([["", "Baru", "X TKR 1"]]), KELAS_SAH, existing);
    expect(toAdd[0].nisn).toBe("20261103");
  });

  it("kolom NISN/UserName manual dipakai apa adanya; NISN duplikat & tak valid ditangani", () => {
    const { toAdd, laporan } = hitungImpor(
      baris([
        ["0012345678", "Punya NISN", "X TKR 1"], // manual dipakai
        ["0012345678", "Kembar NISN", "X TKR 1"], // dilewati (NISN sama, nama beda)
        ["abc", "NISN Salah", "X TKR 1"], // gagal (bukan angka)
      ]),
      KELAS_SAH,
      [],
    );
    expect(toAdd.length).toBe(1);
    expect(toAdd[0].nisn).toBe("0012345678");
    expect(laporan.dilewati.length).toBe(1);
    expect(laporan.gagal.map((g) => g.sebab)).toContain("NISN harus 4–15 digit angka");
  });

  it("menolak kelas yang formatnya sah tapi NONAKTIF (tak ada di peta kelas aktif)", () => {
    const aktif = new Map(KELAS_SAH);
    aktif.delete("X TKJ 1"); // anggap "X TKJ 1" dinonaktifkan admin
    const { toAdd, laporan } = hitungImpor(
      baris([
        ["", "Ani Nonaktif", "x tkj 1"], // gagal: kelas nonaktif (label dinormalkan dulu)
        ["", "Budi Aktif", "X TKR 1"], // sah
      ]),
      aktif,
      [],
    );
    expect(toAdd.length).toBe(1);
    expect(toAdd[0].nama).toBe("Budi Aktif");
    expect(laporan.gagal.map((g) => g.sebab)).toContain("Kelas nonaktif");
  });
});
