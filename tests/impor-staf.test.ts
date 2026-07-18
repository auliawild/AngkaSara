import { describe, it, expect } from "vitest";
import { hitungImporStaf, emailDariNip, tampakEmail, NIP_RE } from "@/lib/impor-staf";
import type { BarisStaf } from "@/lib/excel-staf";

const B = (baris: number, nama: string, nip: string): BarisStaf => ({ baris, nama, nip });

describe("NIP_RE", () => {
  it("terima 4–30 digit; tolak huruf/terlalu pendek", () => {
    expect(NIP_RE.test("198501012010011001")).toBe(true);
    expect(NIP_RE.test("1234")).toBe(true);
    expect(NIP_RE.test("123")).toBe(false);
    expect(NIP_RE.test("18A5")).toBe(false);
    expect(NIP_RE.test("")).toBe(false);
  });
});

describe("emailDariNip / tampakEmail", () => {
  it("email turunan deterministik", () => {
    expect(emailDariNip("123456")).toBe("123456@guru.smkn1badegan.sch.id");
  });
  it("deteksi email vs NIP", () => {
    expect(tampakEmail("admin@smkn1badegan.sch.id")).toBe(true);
    expect(tampakEmail("198501012010011001")).toBe(false);
  });
});

describe("hitungImporStaf", () => {
  it("tambah yang valid, petakan nama+nip", () => {
    const { laporan, toAdd } = hitungImporStaf(
      [B(2, "Budi Santoso", "198501012010011001"), B(3, "Siti Aminah", "199002022015012002")],
      new Set(),
    );
    expect(laporan.ditambah).toBe(2);
    expect(toAdd).toEqual([
      { nama: "Budi Santoso", nip: "198501012010011001" },
      { nama: "Siti Aminah", nip: "199002022015012002" },
    ]);
  });

  it("lewati NIP yang sudah ada di DB & duplikat dalam berkas (yang pertama menang)", () => {
    const existing = new Set(["111122223333"]);
    const { laporan, toAdd } = hitungImporStaf(
      [B(2, "A", "111122223333"), B(3, "B", "444455556666"), B(4, "C", "444455556666")],
      existing,
    );
    expect(toAdd).toEqual([{ nama: "B", nip: "444455556666" }]);
    expect(laporan.dilewati.map((d) => d.baris)).toEqual([2, 4]);
    expect(laporan.dilewati.every((d) => d.sebab === "NIP sudah terdaftar")).toBe(true);
  });

  it("gagalkan nama kosong, NIP kosong, dan NIP tak valid", () => {
    const { laporan, toAdd } = hitungImporStaf(
      [B(2, "", "123456"), B(3, "Tanpa NIP", ""), B(4, "Salah", "12AB")],
      new Set(),
    );
    expect(toAdd).toHaveLength(0);
    expect(laporan.gagal.map((g) => g.sebab)).toEqual([
      "Nama kosong",
      "NIP kosong",
      "NIP harus 4–30 digit angka",
    ]);
  });
});
