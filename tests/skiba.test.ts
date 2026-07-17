import { describe, it, expect } from "vitest";
import {
  buildArena,
  buildDiagnostik,
  sanitasi,
  nilaiArena,
  nilaiDiagnostik,
  bintangDari,
  levelPoints,
  levelTime,
  levelBand,
  TOTAL_ARENA,
  TOTAL_DIAG,
  type SoalPenuh,
} from "@/lib/skiba";
import { TOPICS } from "@/lib/soal-numerasi";

describe("skiba — determinisme build (server-generated)", () => {
  it("buildArena identik untuk seed sama → grading server bisa rebuild", () => {
    const a = buildArena(12345, "tambah", 7);
    const b = buildArena(12345, "tambah", 7);
    expect(a).toHaveLength(TOTAL_ARENA);
    expect(a.map((s) => s.qHTML + "|" + s.answer)).toEqual(b.map((s) => s.qHTML + "|" + s.answer));
  });
  it("seed berbeda → soal berbeda (setidaknya sebagian)", () => {
    const a = buildArena(1, "kali", 10);
    const b = buildArena(2, "kali", 10);
    expect(a.map((s) => s.qHTML)).not.toEqual(b.map((s) => s.qHTML));
  });
  it("buildDiagnostik identik untuk seed sama & berukuran 30", () => {
    const a = buildDiagnostik(999);
    const b = buildDiagnostik(999);
    expect(a).toHaveLength(TOTAL_DIAG);
    expect(a.map((s) => s.topicId + s.level + s.qHTML + s.answer)).toEqual(
      b.map((s) => s.topicId + s.level + s.qHTML + s.answer),
    );
  });
});

describe("skiba — sanitasi tak membocorkan kunci", () => {
  it("SoalKlien tak memuat properti answer", () => {
    const soal = buildArena(42, "kurang", 5);
    const klien = sanitasi(soal);
    for (const s of klien) {
      expect((s as Record<string, unknown>).answer).toBeUndefined();
    }
    // opsi tetap ada agar bisa dirender
    expect(klien[0].options.length).toBeGreaterThanOrEqual(2);
  });
});

describe("skiba — nilaiArena (replay combo)", () => {
  const soal = buildArena(7, "tambah", 8);

  it("semua benar → 100%, 3 bintang, combo penuh, unlock next", () => {
    const jawab = soal.map((s) => s.answer);
    const h = nilaiArena(soal, jawab, 8, 8); // cap=8, level=8 → unlock 9
    expect(h.benar).toBe(10);
    expect(h.skor).toBe(100);
    expect(h.bintang).toBe(3);
    expect(h.bestCombo).toBe(5);
    expect(h.unlockNext).toBe(9);
  });

  it("semua salah/kosong → 0%, 1 bintang, tak unlock", () => {
    const jawab = soal.map(() => null);
    const h = nilaiArena(soal, jawab, 8, 8);
    expect(h.benar).toBe(0);
    expect(h.points).toBe(0);
    expect(h.bintang).toBe(1);
    expect(h.unlockNext).toBeNull();
  });

  it("points = replay combo berurutan (2 benar beruntun di level 8)", () => {
    // hanya 2 soal pertama benar → combo: 1x lalu 2x
    const jawab = soal.map((s, i) => (i < 2 ? s.answer : null));
    const h = nilaiArena(soal, jawab, 8, 8);
    const base = levelPoints(8); // 10 + 8*4 = 42
    expect(h.points).toBe(base * 1 + base * 2);
    expect(h.benar).toBe(2);
    expect(h.bintang).toBe(1); // 20%
    expect(h.unlockNext).toBeNull();
  });

  it("2 bintang membuka level berikut hanya jika level>=cap & <20", () => {
    const jawab = soal.map((s, i) => (i < 6 ? s.answer : null)); // 60% → 2 bintang
    expect(nilaiArena(soal, jawab, 8, 8).unlockNext).toBe(9); // main di cap → unlock
    expect(nilaiArena(soal, jawab, 8, 12).unlockNext).toBeNull(); // main di bawah cap → tak unlock
    const soal20 = buildArena(7, "tambah", 20);
    const jwb20 = soal20.map((s) => s.answer);
    expect(nilaiArena(soal20, jwb20, 20, 20).unlockNext).toBeNull(); // level 20 mentok
  });
});

describe("skiba — nilaiDiagnostik (recLevel per-topik)", () => {
  it("semua benar → recLevel tinggi per topik yang muncul, 100%", () => {
    const soal = buildDiagnostik(555);
    const jawab = soal.map((s) => s.answer);
    const h = nilaiDiagnostik(soal, jawab);
    expect(h.benar).toBe(30);
    expect(h.pct).toBe(100);
    expect(h.levelRata).toBe(20);
    // setiap topik yang punya soal → recLevel 20 (topicPct=1)
    for (const r of h.rincian) {
      if (r.total > 0) expect(r.recLevel).toBe(20);
    }
    // total soal per-topik terjumlah = 30
    expect(h.rincian.reduce((s, r) => s + r.total, 0)).toBe(30);
  });

  it("semua salah → recLevel minimal 1, 0%", () => {
    const soal = buildDiagnostik(555);
    const jawab = soal.map(() => "___salah___");
    const h = nilaiDiagnostik(soal, jawab);
    expect(h.benar).toBe(0);
    expect(h.pct).toBe(0);
    for (const r of h.rincian) expect(r.recLevel).toBe(1);
  });

  it("rincian mencakup semua 10 topik (yang tak muncul pun ada barisnya)", () => {
    const soal = buildDiagnostik(1);
    const h = nilaiDiagnostik(soal, soal.map((s) => s.answer));
    expect(h.rincian).toHaveLength(TOPICS.length);
  });
});

describe("skiba — helper level", () => {
  it("levelTime mengecil & minimal 6", () => {
    expect(levelTime(1)).toBeGreaterThan(levelTime(20));
    expect(levelTime(20)).toBeGreaterThanOrEqual(6);
  });
  it("levelPoints naik per level", () => {
    expect(levelPoints(20)).toBeGreaterThan(levelPoints(1));
  });
  it("bintang & band", () => {
    expect(bintangDari(9)).toBe(3);
    expect(bintangDari(6)).toBe(2);
    expect(bintangDari(5)).toBe(1);
    expect(levelBand(1)).toBe("Pemula");
    expect(levelBand(20)).toBe("Master");
  });
});
