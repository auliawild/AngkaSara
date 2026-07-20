import { describe, it, expect } from "vitest";
import {
  rata,
  agregatCheckpoint,
  agregatSkiba,
  agregatSkibaca,
  agregatDiagNumerasi,
  agregatDiagLiterasi,
  bangunPerkembangan,
  bangunRaport,
  barisDariRaport,
  type CpRow,
} from "@/lib/laporan";

describe("agregatCheckpoint", () => {
  it("rata numerasi/literasi/total + klasifikasi + perBulan terurut naik", () => {
    const rows: CpRow[] = [
      { period: "2026-09", numerasi: 70, literasi: 60, total: 65 },
      { period: "2026-07", numerasi: 90, literasi: 80, total: 85 },
    ];
    const a = agregatCheckpoint(rows);
    expect(a.ikut).toBe(2);
    expect(a.numerasi).toBe(80); // (70+90)/2
    expect(a.literasi).toBe(70);
    expect(a.total).toBe(75);
    expect(a.klas?.label).toBe("Baik"); // 75
    expect(a.perBulan.map((r) => r.period)).toEqual(["2026-07", "2026-09"]);
  });
  it("kosong → null semua", () => {
    const a = agregatCheckpoint([]);
    expect(a).toMatchObject({ ikut: 0, numerasi: null, literasi: null, total: null, klas: null });
  });
});

describe("agregatSkiba", () => {
  it("hitung topik main/tuntas, level selesai (dibatasi 20), total poin", () => {
    const a = agregatSkiba([
      { topicId: "tambah", score: 120, progress: Array.from({ length: 20 }, (_, i) => i + 1) }, // tuntas
      { topicId: "kali", score: 30, progress: [1, 2, 3] },
      { topicId: "bagi", score: 0, progress: [] }, // belum main
    ]);
    expect(a).toEqual({ topikMain: 2, levelSelesai: 23, totalPoin: 150, topikTuntas: 1 });
  });
});

describe("agregatSkibaca", () => {
  it("bacaan selesai + rata persen/wpm; ringkasan dinilai saja yang dirata", () => {
    const a = agregatSkibaca(
      [
        { percent: 100, wpm: 60 },
        { percent: 80, wpm: 40 },
      ],
      [{ score: 90 }, { score: null }, { score: 70 }],
    );
    expect(a.bacaanSelesai).toBe(2);
    expect(a.rataPersen).toBe(90);
    expect(a.rataWpm).toBe(50);
    expect(a.ringkasanKirim).toBe(3);
    expect(a.ringkasanDinilai).toBe(2);
    expect(a.rataRingkasan).toBe(80); // (90+70)/2
  });
  it("kosong → null", () => {
    const a = agregatSkibaca([], []);
    expect(a).toMatchObject({ bacaanSelesai: 0, rataPersen: null, rataWpm: null, rataRingkasan: null });
  });
});

describe("bangunRaport / barisDariRaport", () => {
  it("gabungkan identitas + agregat; baris ringkas ambil angka kunci", () => {
    const r = bangunRaport({
      identitas: { nama: "Budi", nisn: "123", kelasLabel: "XI TKR 2" },
      cpRows: [{ period: "2026-07", numerasi: 90, literasi: 80, total: 85 }],
      skibaStates: [{ topicId: "tambah", score: 50, progress: [1, 2, 3] }],
      skibacaProgress: [{ percent: 100, wpm: 60 }],
      skibacaSummaries: [{ score: 88 }],
      diagNum: { score: 60, levelRata: 12, at: null },
      diagLit: { jurusanKode: "TKR", recommended: 2, rataScore: 70, at: null },
      aktivitasNumerasi: 4,
      aktivitasLiterasi: 2,
    });
    expect(r.cp.total).toBe(85);
    expect(r.skiba.levelSelesai).toBe(3);
    expect(r.skibaca.bacaanSelesai).toBe(1);
    // perkembangan: titik awal (diagnostik) + 1 bulan Check Point
    expect(r.perkembangan).toEqual([
      { label: "Awal", numerasi: 60, literasi: 70 },
      { label: "Jul 2026", numerasi: 90, literasi: 80 },
    ]);

    const b = barisDariRaport("s1", r);
    expect(b).toMatchObject({
      siswaId: "s1",
      nama: "Budi",
      cpIkut: 1,
      cpTotal: 85,
      skibaLevel: 3,
      skibacaBacaan: 1,
      aktivitas: 6,
    });
    expect(b.klas?.label).toBe("Baik");
  });
});

describe("agregatDiagNumerasi", () => {
  it("rata recLevel; null bila skor tak ada", () => {
    const a = agregatDiagNumerasi({ score: 55, at: "2026-07-01T00:00:00.000Z", recLevels: [10, 12, 14] });
    expect(a).toEqual({ score: 55, levelRata: 12, at: "2026-07-01T00:00:00.000Z" });
    expect(agregatDiagNumerasi({ score: null, at: null, recLevels: [] })).toBeNull();
  });
  it("tanpa recLevels → levelRata diturunkan dari skor", () => {
    // skor 50 → round(50/100*19)+1 = 11
    expect(agregatDiagNumerasi({ score: 50, at: null, recLevels: [] })?.levelRata).toBe(11);
  });
});

describe("agregatDiagLiterasi", () => {
  it("rata skor antar level; null bila input null", () => {
    const a = agregatDiagLiterasi({ jurusanKode: "TKR", recommended: 3, scores: { "1": 80, "2": 60 }, at: null });
    expect(a).toEqual({ jurusanKode: "TKR", recommended: 3, rataScore: 70, at: null });
    expect(agregatDiagLiterasi(null)).toBeNull();
  });
});

describe("bangunPerkembangan", () => {
  it("titik Awal (diagnostik) lalu Check Point terurut; label bulan singkat", () => {
    const t = bangunPerkembangan({
      diagNumerasi: 40,
      diagLiterasi: 55,
      cpRows: [
        { period: "2026-09", numerasi: 70, literasi: 65, total: 68 },
        { period: "2026-07", numerasi: 60, literasi: 60, total: 60 },
      ],
    });
    expect(t).toEqual([
      { label: "Awal", numerasi: 40, literasi: 55 },
      { label: "Jul 2026", numerasi: 60, literasi: 60 },
      { label: "Sep 2026", numerasi: 70, literasi: 65 },
    ]);
  });
  it("tanpa diagnostik → tak ada titik Awal; satu domain null tetap muncul", () => {
    const t = bangunPerkembangan({
      diagNumerasi: null,
      diagLiterasi: 50,
      cpRows: [],
    });
    expect(t).toEqual([{ label: "Awal", numerasi: null, literasi: 50 }]);
  });
  it("kosong total → array kosong", () => {
    expect(bangunPerkembangan({ diagNumerasi: null, diagLiterasi: null, cpRows: [] })).toEqual([]);
  });
});

describe("rata", () => {
  it("membulatkan; kosong → 0", () => {
    expect(rata([80, 81])).toBe(81);
    expect(rata([])).toBe(0);
  });
});
