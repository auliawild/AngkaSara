import { describe, it, expect } from "vitest";
import {
  rata,
  agregatCheckpoint,
  agregatSkiba,
  agregatSkibaca,
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
      aktivitasNumerasi: 4,
      aktivitasLiterasi: 2,
    });
    expect(r.cp.total).toBe(85);
    expect(r.skiba.levelSelesai).toBe(3);
    expect(r.skibaca.bacaanSelesai).toBe(1);

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

describe("rata", () => {
  it("membulatkan; kosong → 0", () => {
    expect(rata([80, 81])).toBe(81);
    expect(rata([])).toBe(0);
  });
});
