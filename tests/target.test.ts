import { describe, it, expect } from "vitest";
import {
  hitungTarget,
  barisKini,
  persenTarget,
  TARGET_SKIBA_PER_BULAN,
  TARGET_SKIBACA_PER_BULAN,
  type AktivitasTarget,
} from "@/lib/target";

/** Pembangun aktivitas ringkas. */
const num = (d: Date, category: string, level: number, stars: number | null): AktivitasTarget => ({
  domain: "NUMERASI",
  category,
  level: `Level ${level}`,
  activity: `${category} Lv${level}`,
  stars,
  createdAt: d,
});
const lit = (d: Date, jurusan: string, level: number, judul: string): AktivitasTarget => ({
  domain: "LITERASI",
  category: jurusan,
  level: `Level ${level}`,
  activity: judul,
  stars: null,
  createdAt: d,
});

const AGU = (day: number) => new Date(2026, 7, day, 10, 0, 0);
const SEP = (day: number) => new Date(2026, 8, day, 10, 0, 0);

describe("hitungTarget — struktur & target kumulatif", () => {
  const r = hitungTarget([], new Date(2026, 7, 15));
  it("empat baris bulan Agustus..November", () => {
    expect(r.baris.map((b) => b.label)).toEqual(["Agustus", "September", "Oktober", "November"]);
  });
  it("target menumpuk per bulan", () => {
    expect(r.baris.map((b) => b.targetSkiba)).toEqual([50, 100, 150, 200]);
    expect(r.baris.map((b) => b.targetSkibaca)).toEqual([25, 50, 75, 100]);
  });
  it("tanpa aktivitas → semua nol & belum tercapai", () => {
    expect(r.baris.every((b) => b.skiba === 0 && b.skibaca === 0)).toBe(true);
    expect(r.baris.every((b) => !b.skibaTercapai && !b.skibacaTercapai)).toBe(true);
  });
});

describe("hitungTarget — SKIBA butuh lulus >=2 bintang & distinct", () => {
  const akt: AktivitasTarget[] = [
    num(AGU(2), "Perkalian", 1, 3), // lulus
    num(AGU(3), "Perkalian", 2, 2), // lulus
    num(AGU(4), "Perkalian", 3, 1), // GAGAL (1 bintang) → tak dihitung
    num(AGU(5), "Perkalian", 1, 3), // ulang level 1 → tetap distinct 1×
    num(AGU(6), "Pecahan", 1, null), // bintang null → tak dihitung
  ];
  const r = hitungTarget(akt, AGU(20));
  it("hanya level lulus distinct yang dihitung", () => {
    expect(r.baris[0].skiba).toBe(2); // Perkalian Lv1 & Lv2
  });
});

describe("hitungTarget — SKIBACA distinct per judul, skor bebas", () => {
  const akt: AktivitasTarget[] = [
    lit(AGU(2), "TKJ", 1, "Mobil Ayah"),
    lit(AGU(3), "TKJ", 1, "Mobil Ayah"), // ulang → distinct 1×
    lit(AGU(4), "TKJ", 1, "Kebun Nenek"),
    lit(AGU(5), "TKR", 1, "Mobil Ayah"), // jurusan beda → dihitung terpisah
  ];
  const r = hitungTarget(akt, AGU(20));
  it("bacaan distinct oleh jurusan+level+judul", () => {
    expect(r.baris[0].skibaca).toBe(3);
  });
});

describe("hitungTarget — kumulatif lintas bulan", () => {
  const akt: AktivitasTarget[] = [
    num(AGU(10), "Perkalian", 1, 3),
    num(AGU(11), "Perkalian", 2, 3),
    num(SEP(5), "Perkalian", 3, 3), // level baru di September
    lit(AGU(10), "TKJ", 1, "A"),
    lit(SEP(6), "TKJ", 1, "B"),
  ];
  const r = hitungTarget(akt, SEP(20));
  it("Agustus hanya hitung sampai akhir Agustus", () => {
    expect(r.baris[0].skiba).toBe(2);
    expect(r.baris[0].skibaca).toBe(1);
  });
  it("September menumpuk capaian Agustus + baru", () => {
    expect(r.baris[1].skiba).toBe(3); // 2 + 1
    expect(r.baris[1].skibaca).toBe(2);
  });
});

describe("hitungTarget — flag tercapai & bulan berjalan", () => {
  // 50 level lulus distinct di Agustus → target Agustus (50) tercapai.
  const akt: AktivitasTarget[] = [];
  for (let lv = 1; lv <= 20; lv++) akt.push(num(AGU(2), "A", lv, 3));
  for (let lv = 1; lv <= 20; lv++) akt.push(num(AGU(2), "B", lv, 3));
  for (let lv = 1; lv <= 10; lv++) akt.push(num(AGU(2), "C", lv, 3));
  const r = hitungTarget(akt, AGU(20));
  it("Agustus tercapai (50/50), September belum (50/100)", () => {
    expect(r.baris[0].skiba).toBe(50);
    expect(r.baris[0].skibaTercapai).toBe(true);
    expect(r.baris[1].skibaTercapai).toBe(false);
  });
  it("bulan berjalan = Agustus saat now di Agustus", () => {
    expect(r.idxKini).toBe(0);
    expect(r.baris[0].berjalan).toBe(true);
    expect(r.baris[1].berjalan).toBe(false);
    expect(barisKini(r).label).toBe("Agustus");
  });
  it("baris sebelum berjalan ditandai lewat", () => {
    const r2 = hitungTarget(akt, SEP(15));
    expect(r2.baris[0].lewat).toBe(true);
    expect(r2.idxKini).toBe(1);
  });
});

describe("indexKini di-clamp ke rentang program", () => {
  it("sebelum Agustus → baris pertama", () => {
    expect(hitungTarget([], new Date(2026, 5, 1)).idxKini).toBe(0);
  });
  it("sesudah November → baris terakhir", () => {
    expect(hitungTarget([], new Date(2027, 0, 1)).idxKini).toBe(3);
  });
});

describe("persenTarget", () => {
  it("clamp 0..100", () => {
    expect(persenTarget(25, 50)).toBe(50);
    expect(persenTarget(80, 50)).toBe(100);
    expect(persenTarget(0, 50)).toBe(0);
    expect(persenTarget(5, 0)).toBe(0);
  });
});

describe("konstanta target", () => {
  it("50 level & 25 bacaan per bulan", () => {
    expect(TARGET_SKIBA_PER_BULAN).toBe(50);
    expect(TARGET_SKIBACA_PER_BULAN).toBe(25);
  });
});
