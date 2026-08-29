import { describe, it, expect } from "vitest";
import {
  semuaKelas,
  normalKelas,
  klasifikasi,
  TINGKAT,
  jumlahRombel,
  bucketTerakhir,
  bucketKey,
  periodKey,
  labelPeriode,
  periodeLampau,
  daftarPeriodeLampau,
} from "@/lib/kelas";

describe("kelas: konfigurasi 46 kelas", () => {
  it("total 46 kelas, sebaran X16 / XI15 / XII15", () => {
    const all = semuaKelas();
    expect(all.length).toBe(46);
    const per = (t: string) => all.filter((k) => k.split(" ")[0] === t).length;
    expect(per("X")).toBe(16);
    expect(per("XI")).toBe(15);
    expect(per("XII")).toBe(15);
    expect(new Set(all).size).toBe(46); // semua label unik
  });

  it("TPTUP hanya ada di kelas X", () => {
    expect(jumlahRombel("TPTUP", "X")).toBe(1);
    expect(jumlahRombel("TPTUP", "XI")).toBe(0);
    expect(jumlahRombel("TPTUP", "XII")).toBe(0);
    expect(TINGKAT).toEqual(["X", "XI", "XII"]);
  });
});

describe("kelas: normalKelas (validasi impor)", () => {
  it("menormalkan yang sah & menolak yang tak ada", () => {
    expect(normalKelas("xi tkj 2")).toBe("XI TKJ 2");
    expect(normalKelas("  X   tkr   1 ")).toBe("X TKR 1");
    expect(normalKelas("XII TKR 5")).toBe("XII TKR 5"); // TKR XII = 5 rombel → sah
    expect(normalKelas("XII TPTUP 1")).toBeNull(); // TPTUP tak ada di XII
    expect(normalKelas("XI TPTUP 1")).toBeNull();
    expect(normalKelas("XII Kuliner 3")).toBeNull(); // Kuliner cuma 1-2
    expect(normalKelas("X RPL 1")).toBeNull(); // jurusan asing
    expect(normalKelas("X TKR")).toBeNull(); // kurang bagian
  });
});

describe("kelas: klasifikasi", () => {
  it("ambang ≥90/≥75/≥60", () => {
    expect(klasifikasi(90).label).toBe("Mahir");
    expect(klasifikasi(89).label).toBe("Baik");
    expect(klasifikasi(75).label).toBe("Baik");
    expect(klasifikasi(60).label).toBe("Cukup");
    expect(klasifikasi(59).label).toBe("Perlu Bimbingan");
    expect(klasifikasi(0).label).toBe("Perlu Bimbingan");
  });
});

describe("kelas: periode & bucket", () => {
  it("periodKey & bucket harian konsisten", () => {
    const d = new Date(2026, 6, 17); // 17 Jul 2026
    expect(periodKey(d)).toBe("2026-07");
    expect(bucketKey(d, "hari")).toBe("2026-07-17");
    expect(bucketKey(d, "bulan")).toBe("2026-07");
    expect(bucketKey(d, "tahun")).toBe("2026");
  });
  it("bucketTerakhir menghasilkan deret berurutan lengkap", () => {
    const now = new Date(2026, 6, 17);
    const hari = bucketTerakhir("hari", 14, now);
    expect(hari.length).toBe(14);
    expect(hari[13]).toBe("2026-07-17");
    expect(hari[0]).toBe("2026-07-04");
    expect(bucketTerakhir("bulan", 12, now).length).toBe(12);
  });
});

describe("periode lampau (Check Point susulan)", () => {
  const now = new Date(2026, 7, 15); // Agustus 2026 → periode berjalan 2026-08
  it("labelPeriode format panjang", () => {
    expect(labelPeriode("2026-07")).toBe("Juli 2026");
    expect(labelPeriode("2026-11")).toBe("November 2026");
  });
  it("periodeLampau: hanya bulan sebelum berjalan", () => {
    expect(periodeLampau("2026-07", now)).toBe(true);
    expect(periodeLampau("2026-08", now)).toBe(false); // bulan berjalan
    expect(periodeLampau("2026-09", now)).toBe(false); // masa depan
    expect(periodeLampau("bukan-periode", now)).toBe(false);
  });
  it("daftarPeriodeLampau: n bulan sebelum berjalan, lintas tahun", () => {
    expect(daftarPeriodeLampau(now, 3)).toEqual(["2026-07", "2026-06", "2026-05"]);
    const jan = new Date(2026, 0, 10); // Januari 2026 → mundur lintas tahun
    expect(daftarPeriodeLampau(jan, 2)).toEqual(["2025-12", "2025-11"]);
  });
});
