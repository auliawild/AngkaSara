import { describe, it, expect } from "vitest";
import {
  hitungKata,
  hitungWpm,
  persenSkor,
  badgeSkibaca,
  labelPanjang,
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
