import { describe, it, expect } from "vitest";
import { rataAda, agregat, rekapPenelitian, deretSekolah, labelPeriode, bandSkor, type SiswaMetrik } from "@/lib/penelitian";

/** Pembangun metrik siswa ringkas — default "kosong", override sesuai kebutuhan. */
function siswa(over: Partial<SiswaMetrik> = {}): SiswaMetrik {
  return {
    kelasLabel: "X TKJ 1",
    diagSkibaSkor: null,
    diagSkibaLevel: null,
    diagBacaSkor: null,
    diagBacaRec: null,
    cpNumerasi: null,
    cpLiterasi: null,
    cpTotal: null,
    cpBulan: 0,
    skibaLevel: 0,
    skibaPoin: 0,
    skibaTuntas: 0,
    bacaSelesai: 0,
    bacaPersen: null,
    bacaWpm: null,
    aktivitasNum: 0,
    aktivitasLit: 0,
    ...over,
  };
}

describe("rataAda", () => {
  it("mengabaikan null dan melaporkan cacah pengikut", () => {
    expect(rataAda([80, null, 60, undefined])).toEqual({ n: 2, rata: 70 });
  });
  it("kosong → n 0, rata null", () => {
    expect(rataAda([null, null])).toEqual({ n: 0, rata: null });
  });
});

describe("agregat", () => {
  it("diagnostik & check point dirata atas PENGIKUT saja (bukan seluruh siswa)", () => {
    const rows = [
      siswa({ diagSkibaSkor: 80, cpTotal: 90, cpNumerasi: 88, cpLiterasi: 92 }),
      siswa({ diagSkibaSkor: 40, cpTotal: 70, cpNumerasi: 72, cpLiterasi: 68 }),
      siswa(), // belum diagnostik / belum Check Point → tak ikut rata
    ];
    const a = agregat(rows);
    expect(a.jumlahSiswa).toBe(3);
    expect(a.diagSkibaN).toBe(2);
    expect(a.diagSkibaSkor).toBe(60); // (80+40)/2
    expect(a.cpN).toBe(2);
    expect(a.cpTotal).toBe(80); // (90+70)/2
    expect(a.cpNumerasi).toBe(80);
    expect(a.cpLiterasi).toBe(80);
  });

  it("progres dirata atas SELURUH siswa (0 ikut menekan)", () => {
    const rows = [siswa({ skibaLevel: 10, skibaPoin: 100 }), siswa({ skibaLevel: 0 })];
    const a = agregat(rows);
    expect(a.skibaLevelTotal).toBe(10);
    expect(a.skibaLevelRata).toBe(5); // (10+0)/2
    expect(a.skibaPoinRata).toBe(50);
  });

  it("mutu SKIBACA (persen/wpm) hanya atas siswa yang sudah membaca", () => {
    const rows = [
      siswa({ bacaSelesai: 4, bacaPersen: 90, bacaWpm: 120 }),
      siswa({ bacaSelesai: 0, bacaPersen: null, bacaWpm: null }),
    ];
    const a = agregat(rows);
    expect(a.bacaN).toBe(1);
    expect(a.bacaSelesaiRata).toBe(2); // (4+0)/2 atas semua
    expect(a.bacaSelesaiTotal).toBe(4);
    expect(a.bacaPersen).toBe(90); // hanya pembaca
    expect(a.bacaWpm).toBe(120);
  });

  it("rata cacahan memakai 1 desimal", () => {
    const rows = [siswa({ skibaLevel: 1 }), siswa({ skibaLevel: 0 }), siswa({ skibaLevel: 0 })];
    expect(agregat(rows).skibaLevelRata).toBe(0.3); // 1/3 → 0.3
  });

  it("sekolah kosong → semua rata null / 0", () => {
    const a = agregat([]);
    expect(a.jumlahSiswa).toBe(0);
    expect(a.diagSkibaSkor).toBeNull();
    expect(a.cpTotal).toBeNull();
    expect(a.skibaLevelRata).toBe(0);
  });
});

describe("rekapPenelitian", () => {
  const cmp = (a: string, b: string) => a.localeCompare(b);
  it("memisah per kelas dan tetap menghitung agregat sekolah", () => {
    const rows = [
      siswa({ kelasLabel: "X TKJ 1", diagSkibaSkor: 80 }),
      siswa({ kelasLabel: "X TKJ 1", diagSkibaSkor: 60 }),
      siswa({ kelasLabel: "X TKR 2", diagSkibaSkor: 40 }),
    ];
    const r = rekapPenelitian(rows, cmp);
    expect(r.sekolah.jumlahSiswa).toBe(3);
    expect(r.sekolah.diagSkibaSkor).toBe(60); // (80+60+40)/3
    expect(r.perKelas.map((k) => k.kelasLabel)).toEqual(["X TKJ 1", "X TKR 2"]);
    const tkj = r.perKelas.find((k) => k.kelasLabel === "X TKJ 1")!;
    expect(tkj.jumlahSiswa).toBe(2);
    expect(tkj.diagSkibaSkor).toBe(70); // (80+60)/2
  });

  it("urutan kelas mengikuti comparator", () => {
    const rows = [siswa({ kelasLabel: "B" }), siswa({ kelasLabel: "A" })];
    const r = rekapPenelitian(rows, cmp);
    expect(r.perKelas.map((k) => k.kelasLabel)).toEqual(["A", "B"]);
  });
});

describe("labelPeriode & bandSkor (skala bersama)", () => {
  it("format bulan", () => {
    expect(labelPeriode("2026-08")).toBe("Agu 2026");
  });
  it("band klasifikasi bersama 0..100", () => {
    expect(bandSkor(null)).toBeNull();
    expect(bandSkor(92)?.label).toBe("Mahir");
    expect(bandSkor(80)?.label).toBe("Baik");
    expect(bandSkor(65)?.label).toBe("Cukup");
    expect(bandSkor(40)?.label).toBe("Perlu Bimbingan");
  });
});

describe("deretSekolah", () => {
  it("baseline diagnostik dulu, lalu Check Point tiap bulan terurut + selisih", () => {
    const d = deretSekolah(
      { numerasi: 50, literasi: 45 },
      [
        { period: "2026-09", numerasi: 65, literasi: 55 },
        { period: "2026-08", numerasi: 60, literasi: 50 },
      ],
    );
    expect(d.map((t) => t.label)).toEqual(["Awal (Diagnostik)", "Agu 2026", "Sep 2026"]);
    expect(d[0].tipe).toBe("diagnostik");
    expect(d[0].selisihNum).toBeNull(); // baseline tak punya selisih
    expect(d[1]).toMatchObject({ tipe: "checkpoint", numerasi: 60, selisihNum: 10, selisihLit: 5 });
    expect(d[2]).toMatchObject({ numerasi: 65, selisihNum: 15, selisihLit: 10 });
  });

  it("tanpa baseline (diagnostik kosong) → mulai dari bulan Check Point", () => {
    const d = deretSekolah({ numerasi: null, literasi: null }, [{ period: "2026-08", numerasi: 60, literasi: 50 }]);
    expect(d).toHaveLength(1);
    expect(d[0].tipe).toBe("checkpoint");
    expect(d[0].selisihNum).toBeNull(); // baseline null → selisih tak terdefinisi
  });

  it("selisih null bila salah satu sisi kosong", () => {
    const d = deretSekolah({ numerasi: 50, literasi: null }, [{ period: "2026-08", numerasi: null, literasi: 55 }]);
    const cp = d.find((t) => t.tipe === "checkpoint")!;
    expect(cp.selisihNum).toBeNull(); // numerasi bulan kosong
    expect(cp.selisihLit).toBeNull(); // baseline literasi kosong
  });
});
