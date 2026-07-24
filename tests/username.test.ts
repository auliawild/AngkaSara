import { describe, expect, it } from "vitest";
import { TAHUN_ANGKATAN, nomorJurusan, prefixUsername, buatUsername, urutanBerikut } from "@/lib/username";

describe("generator UserName siswa tanpa NISN", () => {
  it("angkatan turun 1 tiap tingkat naik", () => {
    expect(TAHUN_ANGKATAN.X).toBe(2026);
    expect(TAHUN_ANGKATAN.XI).toBe(2025);
    expect(TAHUN_ANGKATAN.XII).toBe(2024);
  });

  it("nomor jurusan 1-based dari urutan JURUSAN_LIST", () => {
    expect(nomorJurusan("TKR")).toBe(1);
    expect(nomorJurusan("TSM")).toBe(2);
    expect(nomorJurusan("TKJ")).toBe(3);
    expect(nomorJurusan("Kuliner")).toBe(4);
    expect(nomorJurusan("TPTUP")).toBe(5);
    expect(nomorJurusan("ENTAH")).toBe(0);
  });

  it("prefix = [angkatan][jurusan][rombel]", () => {
    expect(prefixUsername("X", "TKJ", 1)).toBe("202631");
    expect(prefixUsername("XI", "TKR", 2)).toBe("202512");
    expect(prefixUsername("XII", "TPTUP", 1)).toBe("202451");
  });

  it("prefix null bila jurusan tak dikenal atau rombel di luar 1..9", () => {
    expect(prefixUsername("X", "ENTAH", 1)).toBeNull();
    expect(prefixUsername("X", "TKJ", 0)).toBeNull();
    expect(prefixUsername("X", "TKJ", 10)).toBeNull();
  });

  it("UserName lengkap: contoh X TKJ 1 siswa ke-3 = 20263103", () => {
    const p = prefixUsername("X", "TKJ", 1)!;
    expect(buatUsername(p, 3)).toBe("20263103");
    expect(buatUsername(p, 1)).toBe("20263101");
    expect(buatUsername(p, 40)).toBe("20263140");
  });

  it("urutanBerikut = tertinggi yang cocok pola + 1 (lubang hapus tak dipakai ulang)", () => {
    const p = "202631";
    expect(urutanBerikut(p, [])).toBe(1);
    // ada 01 & 03 (02 terhapus) → berikutnya 04, bukan 02
    expect(urutanBerikut(p, ["20263101", "20263103"])).toBe(4);
    // abaikan NISN nyata / kelas lain yang tak cocok prefix
    expect(urutanBerikut(p, ["20263101", "1234567890", "202512" + "05"])).toBe(2);
  });
});
