import { describe, it, expect } from "vitest";
import { rata, ringkasan, rekapPerKelas, perkembangan, type ResultRow } from "@/lib/evaluasi";

/* Agregasi Evaluasi (#9): rata-rata, ikut/belum, rekap per kelas, deret perkembangan. */

const R = (studentId: string, kelasLabel: string, period: string, n: number, l: number): ResultRow => ({
  studentId,
  kelasLabel,
  period,
  numerasi: n,
  literasi: l,
  total: Math.round((n + l) / 2),
});

describe("rata", () => {
  it("membulatkan seperti app lama; kosong → 0", () => {
    expect(rata([80, 90])).toBe(85);
    expect(rata([80, 81])).toBe(81); // 80.5 → 81
    expect(rata([])).toBe(0);
  });
});

describe("ringkasan", () => {
  it("ikut/belum & rata + klasifikasi", () => {
    const res = [R("s1", "X TKJ 1", "2026-07", 90, 80), R("s2", "X TKJ 1", "2026-07", 70, 60)];
    const r = ringkasan(3, res); // 3 target, 2 ikut
    expect(r).toMatchObject({ jumlah: 3, ikut: 2, belum: 1 });
    expect(r.numerasi).toBe(80); // (90+70)/2
    expect(r.literasi).toBe(70);
    expect(r.total).toBe(75); // (85+65)/2
    expect(r.klas?.label).toBe("Baik"); // 75 → Baik
  });

  it("tanpa hasil → semua null, belum = jumlah", () => {
    const r = ringkasan(40, []);
    expect(r).toMatchObject({ jumlah: 40, ikut: 0, belum: 40, numerasi: null, literasi: null, total: null, klas: null });
  });
});

describe("rekapPerKelas", () => {
  it("satu baris per kelas; kelas tanpa hasil tetap muncul (ikut 0)", () => {
    const kelasJumlah = [
      { label: "X TKJ 1", jumlah: 2 },
      { label: "X TKR 1", jumlah: 3 },
    ];
    const res = [R("s1", "X TKJ 1", "2026-07", 100, 80), R("s2", "X TKJ 1", "2026-07", 80, 80)];
    const rekap = rekapPerKelas(kelasJumlah, res);
    expect(rekap).toHaveLength(2);
    const tkj = rekap.find((r) => r.kelasLabel === "X TKJ 1")!;
    expect(tkj).toMatchObject({ jumlah: 2, ikut: 2, belum: 0, numerasi: 90, literasi: 80 });
    const tkr = rekap.find((r) => r.kelasLabel === "X TKR 1")!;
    expect(tkr).toMatchObject({ jumlah: 3, ikut: 0, belum: 3, numerasi: null, total: null, klas: null });
  });
});

describe("perkembangan", () => {
  it("rata per periode; periode kosong → null (jeda garis)", () => {
    const res = [
      R("s1", "X TKJ 1", "2026-05", 60, 60),
      R("s2", "X TKJ 1", "2026-05", 80, 80),
      R("s1", "X TKJ 1", "2026-07", 90, 90),
    ];
    const deret = perkembangan(["2026-05", "2026-06", "2026-07"], res);
    expect(deret.map((d) => d.total)).toEqual([70, null, 90]);
    expect(deret[0].numerasi).toBe(70);
    expect(deret[1]).toMatchObject({ numerasi: null, literasi: null, total: null });
  });
});
