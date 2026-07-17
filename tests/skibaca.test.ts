import { describe, it, expect } from "vitest";
import {
  hitungKata,
  hitungWpm,
  persenSkor,
  badgeSkibaca,
  labelPanjang,
  rekomendasiLevel,
} from "@/lib/skibaca";

describe("skibaca — hitungKata & WPM", () => {
  it("hitungKata mengabaikan spasi ganda & tepi", () => {
    expect(hitungKata("  Ayah  punya   mobil biru ")).toBe(4);
    expect(hitungKata("Mobil.")).toBe(1);
  });
  it("hitungWpm = kata/detik*60, detik minimal 1", () => {
    expect(hitungWpm(120, 60)).toBe(120);
    expect(hitungWpm(50, 30)).toBe(100);
    expect(hitungWpm(10, 0)).toBe(600); // detik dipaksa 1
  });
});

describe("skibaca — persenSkor & badge", () => {
  it("persen dari benar/total", () => {
    expect(persenSkor(5, 5)).toBe(100);
    expect(persenSkor(3, 5)).toBe(60);
    expect(persenSkor(0, 5)).toBe(0);
    expect(persenSkor(0, 0)).toBe(0);
  });
  it("badge Mandiri/Instruksional/Perlu Bimbingan (display-only, ambang 90/70)", () => {
    expect(badgeSkibaca(100).label).toBe("Mandiri");
    expect(badgeSkibaca(90).label).toBe("Mandiri");
    expect(badgeSkibaca(80).label).toBe("Instruksional");
    expect(badgeSkibaca(70).label).toBe("Instruksional");
    expect(badgeSkibaca(60).label).toBe("Perlu Bimbingan");
  });
});

describe("skibaca — labelPanjang", () => {
  it("mengelompokkan panjang bacaan", () => {
    expect(labelPanjang(28)).toBe("Pendek");
    expect(labelPanjang(59)).toBe("Sedang");
    expect(labelPanjang(90)).toBe("Panjang");
    expect(labelPanjang(120)).toBe("Sangat panjang");
  });
});

describe("skibaca — rekomendasiLevel (diagnostik)", () => {
  it("level tertinggi berturut dari 1 dengan skor ≥ 70", () => {
    expect(rekomendasiLevel({ 1: 100, 2: 80, 3: 70, 4: 60, 5: 100 })).toBe(3);
    expect(rekomendasiLevel({ 1: 90, 2: 90, 3: 90, 4: 90, 5: 90 })).toBe(5);
  });
  it("gagal di level 1 → tetap rekomendasi Level 1 (minimal)", () => {
    expect(rekomendasiLevel({ 1: 40, 2: 100, 3: 100, 4: 100, 5: 100 })).toBe(1);
    expect(rekomendasiLevel({})).toBe(1);
  });
  it("berhenti pada celah/level tak diujikan meski level lebih tinggi lulus", () => {
    expect(rekomendasiLevel({ 1: 80, 3: 90, 4: 90 })).toBe(1); // level 2 tak ada → putus
    expect(rekomendasiLevel({ 1: 80, 2: 80 })).toBe(2); // 3..5 tak ada → berhenti di 2
  });
  it("ambang tepat 70 dianggap lulus, 69 gagal", () => {
    expect(rekomendasiLevel({ 1: 70 })).toBe(1);
    expect(rekomendasiLevel({ 1: 69, 2: 100 })).toBe(1);
  });
});
