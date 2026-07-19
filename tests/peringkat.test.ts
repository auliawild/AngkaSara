import { describe, it, expect } from "vitest";
import {
  nilaiModul,
  hitungNilai,
  susunPeringkat,
  susunPeringkatKelas,
  potongTeratas,
  medali,
  SKIBACA_TOTAL_KUIS,
  type DataPeringkat,
} from "@/lib/peringkat";
import { SKIBA_TOTAL_LEVEL } from "@/lib/laporan";

function siswa(p: Partial<DataPeringkat> & { nama: string }): DataPeringkat {
  return {
    siswaId: p.siswaId ?? p.nama.toLowerCase(),
    nama: p.nama,
    nisn: p.nisn ?? "000",
    kelasLabel: p.kelasLabel ?? "X TKR 1",
    skibaLevel: p.skibaLevel ?? 0,
    skibaMutu: p.skibaMutu ?? null,
    skibacaBacaan: p.skibacaBacaan ?? 0,
    skibacaMutu: p.skibacaMutu ?? null,
    aktivitas: p.aktivitas ?? 0,
  };
}

describe("nilaiModul", () => {
  it("50% capaian + 50% mutu", () => {
    expect(nilaiModul(0, 200, null)).toBe(0);
    expect(nilaiModul(200, 200, 100)).toBe(100); // tuntas & sempurna
    expect(nilaiModul(100, 200, 0)).toBe(25); // separuh capaian, mutu 0
    expect(nilaiModul(0, 200, 100)).toBe(50); // mutu sempurna tanpa capaian
    expect(nilaiModul(50, 200, 80)).toBe(52.5); // 12.5 + 40
  });

  it("capaian melebihi maks & mutu di luar 0..100 dijepit", () => {
    expect(nilaiModul(500, 200, 100)).toBe(100);
    expect(nilaiModul(0, 200, 150)).toBe(50);
    expect(nilaiModul(0, 200, -10)).toBe(0);
    expect(nilaiModul(10, 0, 100)).toBe(50); // maks 0 → porsi capaian 0
  });
});

describe("hitungNilai", () => {
  it("gabungan = rata nilai kedua modul", () => {
    const r = hitungNilai(
      siswa({ nama: "A", skibaLevel: SKIBA_TOTAL_LEVEL, skibaMutu: 100, skibacaBacaan: 0, skibacaMutu: null }),
    );
    expect(r.nilaiSkiba).toBe(100);
    expect(r.nilaiSkibaca).toBe(0);
    expect(r.nilai).toBe(50); // kuat numerasi saja tak bisa juara mutlak
  });

  it("SKIBACA memakai denominator 75 bacaan kuis per jurusan", () => {
    expect(SKIBACA_TOTAL_KUIS).toBe(75);
    const r = hitungNilai(siswa({ nama: "B", skibacaBacaan: 75, skibacaMutu: 100 }));
    expect(r.nilaiSkibaca).toBe(100);
  });
});

describe("susunPeringkat", () => {
  it("urut menurun & nomor peringkat 1-based", () => {
    const rows = susunPeringkat([
      siswa({ nama: "Rendah", skibaLevel: 10 }),
      siswa({ nama: "Tinggi", skibaLevel: 200, skibaMutu: 100, skibacaBacaan: 75, skibacaMutu: 100 }),
      siswa({ nama: "Sedang", skibaLevel: 100, skibaMutu: 60 }),
    ]);
    expect(rows.map((r) => r.nama)).toEqual(["Tinggi", "Sedang", "Rendah"]);
    expect(rows.map((r) => r.peringkat)).toEqual([1, 2, 3]);
    expect(rows[0].nilai).toBe(100);
  });

  it("nilai seri berbagi peringkat sama, nomor berikutnya melompat", () => {
    const rows = susunPeringkat([
      siswa({ nama: "Ani", skibaLevel: 100, skibaMutu: 50, aktivitas: 3 }),
      siswa({ nama: "Budi", skibaLevel: 100, skibaMutu: 50, aktivitas: 9 }),
      siswa({ nama: "Cici" }),
    ]);
    expect(rows.map((r) => r.nama)).toEqual(["Budi", "Ani", "Cici"]); // seri → aktivitas lebih banyak dulu
    expect(rows.map((r) => r.peringkat)).toEqual([1, 1, 3]);
  });

  it("seri penuh (nilai & aktivitas) diurutkan menurut nama supaya stabil", () => {
    const rows = susunPeringkat([siswa({ nama: "Zaki" }), siswa({ nama: "Adi" })]);
    expect(rows.map((r) => r.nama)).toEqual(["Adi", "Zaki"]);
    expect(rows.map((r) => r.peringkat)).toEqual([1, 1]);
  });

  it("daftar kosong aman", () => {
    expect(susunPeringkat([])).toEqual([]);
  });
});

describe("susunPeringkatKelas", () => {
  it("rata memakai seluruh siswa kelas (yang belum main ikut menekan rata)", () => {
    const rows = susunPeringkat([
      siswa({ nama: "A1", kelasLabel: "X TKR 1", skibaLevel: 200, skibaMutu: 100, skibacaBacaan: 75, skibacaMutu: 100 }),
      siswa({ nama: "A2", kelasLabel: "X TKR 1" }), // belum pernah main → 0
      siswa({ nama: "B1", kelasLabel: "X TKJ 1", skibaLevel: 100, skibaMutu: 100, skibacaBacaan: 75, skibacaMutu: 100 }),
    ]);
    const kelas = susunPeringkatKelas(rows);
    expect(kelas.map((k) => k.kelasLabel)).toEqual(["X TKJ 1", "X TKR 1"]);
    expect(kelas[0].rataNilai).toBe(87.5); // (75+100)/2
    expect(kelas[1].rataNilai).toBe(50); // (100+0)/2
    expect(kelas[1].jumlahSiswa).toBe(2);
    expect(kelas[1].jumlahAktif).toBe(1);
    expect(kelas.map((k) => k.peringkat)).toEqual([1, 2]);
  });
});

describe("medali", () => {
  it("hanya 3 besar, dan tidak untuk yang bernilai 0", () => {
    expect(medali(1, 30)).toBe("🥇");
    expect(medali(2, 10)).toBe("🥈");
    expect(medali(3, 1)).toBe("🥉");
    expect(medali(4, 50)).toBe("");
    expect(medali(2, 0)).toBe(""); // seri massal siswa yang belum berlatih
  });
});

describe("potongTeratas", () => {
  it("ambil N teratas + baris siswa tertentu meski di luar N", () => {
    const rows = susunPeringkat([
      siswa({ nama: "A", siswaId: "a", skibaLevel: 200, skibaMutu: 100 }),
      siswa({ nama: "B", siswaId: "b", skibaLevel: 100 }),
      siswa({ nama: "C", siswaId: "c" }),
    ]);
    const { teratas, saya } = potongTeratas(rows, 2, "c");
    expect(teratas.map((r) => r.nama)).toEqual(["A", "B"]);
    expect(saya?.peringkat).toBe(3);
    expect(potongTeratas(rows, 2).saya).toBeNull();
  });
});
