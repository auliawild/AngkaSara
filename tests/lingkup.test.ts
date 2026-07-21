import { describe, expect, it } from "vitest";
import { lingkupDari, bolehKelas, whereLabel, dibatasiKe } from "@/lib/lingkup";

describe("lingkup kelas staf", () => {
  it("daftar kosong = akses SEMUA kelas (admin utama & guru lama tak berubah)", () => {
    const l = lingkupDari([]);
    expect(l.dibatasi).toBe(false);
    expect(bolehKelas(l, "X TKJ 1")).toBe(true);
    expect(bolehKelas(l, "XII TKR 3")).toBe(true);
    // Tanpa batas → tak ada filter yang ditambahkan ke query.
    expect(whereLabel(l)).toBeUndefined();
    expect(dibatasiKe(l)).toBeNull();
  });

  it("daftar terisi membatasi tepat ke kelas itu", () => {
    const l = lingkupDari(["X TKJ 1", "X TKR 2"]);
    expect(l.dibatasi).toBe(true);
    expect(bolehKelas(l, "X TKJ 1")).toBe(true);
    expect(bolehKelas(l, "X TKR 2")).toBe(true);
    expect(bolehKelas(l, "XI TKR 2")).toBe(false);
    expect(whereLabel(l)).toEqual({ in: ["X TKJ 1", "X TKR 2"] });
    expect(dibatasiKe(l)).toEqual(["X TKJ 1", "X TKR 2"]);
  });

  it("cocok persis, bukan awalan — 'X TKJ 1' tak membuka 'X TKJ 10'", () => {
    const l = lingkupDari(["X TKJ 1"]);
    expect(bolehKelas(l, "X TKJ 10")).toBe(false);
    expect(bolehKelas(l, "x tkj 1")).toBe(false); // peka huruf besar/kecil
  });
});
