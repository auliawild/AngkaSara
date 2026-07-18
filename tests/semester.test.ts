import { describe, it, expect } from "vitest";
import {
  semesterDari,
  semesterDariPeriode,
  rentangSemester,
  tahunAjaran,
  labelSemester,
  semesterId,
  parseSemester,
  periodeDalamSemester,
  daftarSemester,
} from "@/lib/semester";

describe("semesterDari / semesterDariPeriode", () => {
  it("Juli–Des → Ganjil; Jan–Jun → Genap", () => {
    expect(semesterDari(new Date(2026, 6, 18))).toEqual({ tahun: 2026, ganjil: true }); // Juli
    expect(semesterDari(new Date(2026, 11, 31))).toEqual({ tahun: 2026, ganjil: true }); // Des
    expect(semesterDari(new Date(2026, 0, 1))).toEqual({ tahun: 2026, ganjil: false }); // Jan
    expect(semesterDari(new Date(2026, 5, 30))).toEqual({ tahun: 2026, ganjil: false }); // Jun
  });
  it("dari periode 'YYYY-MM'; format salah → null", () => {
    expect(semesterDariPeriode("2026-07")).toEqual({ tahun: 2026, ganjil: true });
    expect(semesterDariPeriode("2026-03")).toEqual({ tahun: 2026, ganjil: false });
    expect(semesterDariPeriode("2026-13")).toBeNull();
    expect(semesterDariPeriode("bukan")).toBeNull();
  });
});

describe("rentangSemester", () => {
  it("Ganjil 2026 = Jul–Des, 6 periode, selesai = 1 Jan 2027", () => {
    const r = rentangSemester({ tahun: 2026, ganjil: true });
    expect(r.mulai).toEqual(new Date(2026, 6, 1));
    expect(r.selesai).toEqual(new Date(2026, 12, 1)); // = 1 Jan 2027
    expect(r.periods).toEqual(["2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"]);
  });
  it("Genap 2026 = Jan–Jun, selesai = 1 Jul 2026", () => {
    const r = rentangSemester({ tahun: 2026, ganjil: false });
    expect(r.mulai).toEqual(new Date(2026, 0, 1));
    expect(r.selesai).toEqual(new Date(2026, 6, 1));
    expect(r.periods).toEqual(["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"]);
  });
});

describe("label & id", () => {
  it("tahun ajaran & label", () => {
    expect(tahunAjaran({ tahun: 2026, ganjil: true })).toBe("2026/2027");
    expect(tahunAjaran({ tahun: 2026, ganjil: false })).toBe("2025/2026");
    expect(labelSemester({ tahun: 2026, ganjil: true })).toBe("Ganjil 2026/2027");
    expect(labelSemester({ tahun: 2026, ganjil: false })).toBe("Genap 2025/2026");
  });
  it("id ↔ parse pulang-pergi", () => {
    expect(semesterId({ tahun: 2026, ganjil: true })).toBe("2026-1");
    expect(semesterId({ tahun: 2026, ganjil: false })).toBe("2026-2");
    expect(parseSemester("2026-1")).toEqual({ tahun: 2026, ganjil: true });
    expect(parseSemester("2026-2")).toEqual({ tahun: 2026, ganjil: false });
    expect(parseSemester("2026-3")).toBeNull();
    expect(parseSemester("x")).toBeNull();
  });
});

describe("periodeDalamSemester", () => {
  it("hanya periode di rentang semester", () => {
    const s = { tahun: 2026, ganjil: true };
    expect(periodeDalamSemester("2026-07", s)).toBe(true);
    expect(periodeDalamSemester("2026-12", s)).toBe(true);
    expect(periodeDalamSemester("2026-06", s)).toBe(false); // Genap
    expect(periodeDalamSemester("2027-01", s)).toBe(false);
  });
});

describe("daftarSemester", () => {
  it("turunkan dari periode, terbaru dulu, selalu sertakan semester sekarang", () => {
    const now = new Date(2026, 6, 18); // Ganjil 2026
    const list = daftarSemester(["2026-03", "2025-09"], now);
    expect(list.map(semesterId)).toEqual(["2026-1", "2026-2", "2025-1"]); // 2026-1 (kini) di depan
  });
  it("periode kosong → hanya semester sekarang", () => {
    const now = new Date(2026, 1, 10); // Genap 2026
    expect(daftarSemester([], now).map(semesterId)).toEqual(["2026-2"]);
  });
});
