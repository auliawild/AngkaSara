import { describe, it, expect } from "vitest";
import { agregatProgres, type AktivitasRingkas } from "@/lib/progres";

const NOW = new Date(2026, 6, 18); // 18 Juli 2026 (Sabtu)
const A = (d: Date, domain: string, score: number, points = 0): AktivitasRingkas => ({ ts: d, domain, score, points });

describe("agregatProgres — harian", () => {
  const akt: AktivitasRingkas[] = [
    A(new Date(2026, 6, 18), "NUMERASI", 80, 10),
    A(new Date(2026, 6, 18), "LITERASI", 60, 0),
    A(new Date(2026, 6, 17), "NUMERASI", 100, 5),
    A(new Date(2026, 5, 1), "NUMERASI", 40, 99), // di luar jendela 14 hari → diabaikan
  ];
  const d = agregatProgres(akt, "hari", NOW);

  it("14 bucket harian, urut lama→baru, terakhir = hari ini", () => {
    expect(d.titik).toHaveLength(14);
    expect(d.titik[13].key).toBe("2026-07-18");
    expect(d.titik[12].key).toBe("2026-07-17");
  });
  it("hitung & rata per hari; aktivitas di luar jendela diabaikan", () => {
    const hariIni = d.titik[13];
    expect(hariIni).toMatchObject({ total: 2, jumlahNum: 1, jumlahLit: 1, num: 80, lit: 60, poin: 10 });
    expect(d.titik[12]).toMatchObject({ total: 1, num: 100, lit: null });
    expect(d.totalAktivitas).toBe(3); // yang 1 Juni diabaikan
    expect(d.totalNum).toBe(2); // 2 pengerjaan numerasi
    expect(d.totalLit).toBe(1); // 1 pengerjaan literasi
    expect(d.totalPoin).toBe(15);
    expect(d.bucketAktif).toBe(2);
    expect(d.rataNum).toBe(90); // (80+100)/2
    expect(d.rataLit).toBe(60);
  });
});

describe("agregatProgres — bulanan", () => {
  const akt: AktivitasRingkas[] = [
    A(new Date(2026, 6, 3), "NUMERASI", 70, 0),
    A(new Date(2026, 6, 20), "LITERASI", 90, 0),
    A(new Date(2026, 5, 15), "NUMERASI", 50, 0),
  ];
  const d = agregatProgres(akt, "bulan", NOW);

  it("12 bucket bulanan; Juli & Juni terisi", () => {
    expect(d.titik).toHaveLength(12);
    const juli = d.titik.find((t) => t.key === "2026-07")!;
    const juni = d.titik.find((t) => t.key === "2026-06")!;
    expect(juli).toMatchObject({ total: 2, num: 70, lit: 90 });
    expect(juni).toMatchObject({ total: 1, num: 50, lit: null });
    expect(d.bucketAktif).toBe(2);
  });
});

describe("agregatProgres — kosong", () => {
  it("tanpa aktivitas → semua null/0", () => {
    const d = agregatProgres([], "minggu", NOW);
    expect(d.titik).toHaveLength(12);
    expect(d).toMatchObject({ totalAktivitas: 0, totalPoin: 0, bucketAktif: 0, rataNum: null, rataLit: null });
    expect(d.titik.every((t) => t.total === 0 && t.num === null)).toBe(true);
  });
});
