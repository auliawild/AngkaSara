import { describe, it, expect } from "vitest";
import {
  buildCheckpoint,
  nilaiCheckpoint,
  seedBulan,
  CHECKPOINT_CONFIG,
  type RawPassage,
} from "@/lib/checkpoint";

/* Bank bacaan sintetis (mirip struktur DB): 32 bacaan, tema mengelompok
   (kluster ~6) supaya menguji LOMPAT anti-setema; kunci selalu di index 0. */
const TEMAS = ["TKR", "TSM", "TKJ", "Kuliner", "TPTUP", "Umum"];
function fakeBank(n = 32): RawPassage[] {
  return Array.from({ length: n }, (_, i) => ({
    kode: `p${i}`,
    tema: TEMAS[Math.floor(i / 6) % TEMAS.length],
    title: `Bacaan ${i}`,
    text: `Teks bacaan ${i}.`,
    questions: Array.from({ length: 5 }, (_, qi) => ({
      q: `Soal ${qi} bacaan ${i}?`,
      options: ["BENAR", "salah1", "salah2", "salah3"], // index 0 = kunci (spt bank asli)
      answerIndex: 0,
    })),
  }));
}
const months = (y0: number, count: number) =>
  Array.from({ length: count }, (_, k) => {
    const y = y0 + Math.floor(k / 12);
    const m = (k % 12) + 1;
    return `${y}-${String(m).padStart(2, "0")}`;
  });

describe("checkpoint: numerasi (profil kesulitan invariant)", () => {
  it("20 soal; profil LEVELS identik tiap bulan; tiap topik 2 level BEDA; rata 15,2", () => {
    const bank = fakeBank();
    const profil = new Set<string>();
    const kembar: string[] = [];
    for (const period of months(2026, 24)) {
      const b = buildCheckpoint({ period, studentKey: "S1", passages: bank });
      expect(b.soalNum.length).toBe(CHECKPOINT_CONFIG.JML_NUM);
      const lv = b.soalNum.map((q) => q.lv);
      profil.add([...lv].sort((a, z) => a - z).join(","));
      const byTopic: Record<string, number[]> = {};
      b.soalNum.forEach((q) => (byTopic[q.topic] ??= []).push(q.lv));
      for (const t of Object.keys(byTopic)) {
        if (new Set(byTopic[t]).size !== byTopic[t].length) kembar.push(`${period} ${t}`);
      }
      const rata = lv.reduce((s, x) => s + x, 0) / lv.length;
      expect(rata).toBeCloseTo(15.2, 5);
    }
    expect(profil.size).toBe(1); // identik tiap bulan
    expect(kembar).toEqual([]); // tiap topik dua level berbeda
  });
});

describe("checkpoint: seleksi bacaan (anti-ulang & anti-setema)", () => {
  it("15 soal literasi; tanpa bacaan kembar; 0 tumpang-tindih antar bulan; tak setema seragam", () => {
    const bank = fakeBank();
    let prev: Set<string> | null = null;
    let overlap = 0;
    let setemaSeragam = 0;
    for (const period of months(2026, 24)) {
      const b = buildCheckpoint({ period, studentKey: "S1", passages: bank });
      expect(b.bacaan.length).toBe(CHECKPOINT_CONFIG.JML_BACAAN);
      const total = b.bacaan.reduce((s, p) => s + p.questions.length, 0);
      expect(total).toBe(CHECKPOINT_CONFIG.JML_BACAAN * CHECKPOINT_CONFIG.SOAL_PER_BACAAN);
      const kodes = b.bacaan.map((p) => p.kode);
      expect(new Set(kodes).size).toBe(kodes.length); // tak kembar dalam 1 checkpoint
      const cur = new Set(kodes);
      if (prev) for (const k of cur) if (prev.has(k)) overlap++;
      if (new Set(b.bacaan.map((p) => p.tema)).size === 1) setemaSeragam++;
      prev = cur;
    }
    expect(overlap).toBe(0);
    expect(setemaSeragam).toBe(0);
  });
});

describe("checkpoint: opsi bacaan diacak (anti 'asal pilih A')", () => {
  it("kunci tak selalu di index 0; answerIndex tetap menunjuk opsi benar", () => {
    const bank = fakeBank();
    const posisi = [0, 0, 0, 0];
    let salahTunjuk = 0;
    let n = 0;
    for (let s = 0; s < 60; s++) {
      const b = buildCheckpoint({ period: "2026-07", studentKey: `S${s}`, passages: bank });
      b.bacaan.forEach((p) =>
        p.questions.forEach((q) => {
          posisi[q.answerIndex]++;
          n++;
          if (q.options[q.answerIndex] !== "BENAR") salahTunjuk++;
        }),
      );
    }
    expect(salahTunjuk).toBe(0); // kunci selalu menunjuk opsi yang benar
    // tersebar ke >1 posisi (bukan selalu index 0)
    expect(posisi.filter((c) => c > 0).length).toBeGreaterThan(1);
    expect(posisi[0]).toBeLessThan(n); // tidak semua di posisi 0

    // strategi "selalu pilih index 0" harus ~25%, bukan 100%
    let benar = 0,
      tot = 0;
    for (let s = 0; s < 100; s++) {
      const b = buildCheckpoint({ period: "2026-08", studentKey: `X${s}`, passages: bank });
      const jawabLit = b.bacaan.map((p) => p.questions.map(() => 0));
      const sc = nilaiCheckpoint(b, [], jawabLit);
      benar += sc.benarLit;
      tot += sc.totalLit;
    }
    const pct = (benar / tot) * 100;
    expect(pct).toBeGreaterThan(15);
    expect(pct).toBeLessThan(35); // jauh dari 100
  });
});

describe("checkpoint: scoring server", () => {
  it("semua benar → 100/100/100; sebagian benar dihitung tepat", () => {
    const bank = fakeBank();
    const b = buildCheckpoint({ period: "2026-07", studentKey: "S1", passages: bank });

    const jawabNumBenar = b.soalNum.map((q) => q.answer);
    const jawabLitBenar = b.bacaan.map((p) => p.questions.map((q) => q.answerIndex));
    expect(nilaiCheckpoint(b, jawabNumBenar, jawabLitBenar)).toMatchObject({
      numerasi: 100,
      literasi: 100,
      total: 100,
      benarNum: 20,
      totalNum: 20,
      benarLit: 15,
      totalLit: 15,
    });

    // 15 dari 20 numerasi benar, 9 dari 15 literasi benar
    const jn = b.soalNum.map((q, i) =>
      i < 15 ? q.answer : q.options.find((o) => o.value !== q.answer)!.value,
    );
    const jl = b.bacaan.map((p, pi) =>
      p.questions.map((q, qi) => {
        const idx = pi * 5 + qi;
        return idx < 9 ? q.answerIndex : (q.answerIndex + 1) % 4;
      }),
    );
    const sc = nilaiCheckpoint(b, jn, jl);
    expect(sc.numerasi).toBe(75); // 15/20
    expect(sc.literasi).toBe(60); // 9/15
    expect(sc.total).toBe(68); // round((75+60)/2)
  });
});

describe("checkpoint: determinisme & per-siswa", () => {
  it("studentKey+period sama → identik; siswa beda → bacaan/level sama, angka beda", () => {
    const bank = fakeBank();
    const a1 = buildCheckpoint({ period: "2026-07", studentKey: "S1", passages: bank });
    const a2 = buildCheckpoint({ period: "2026-07", studentKey: "S1", passages: bank });
    expect(a2).toEqual(a1); // reproducible

    const b = buildCheckpoint({ period: "2026-07", studentKey: "S2", passages: bank });
    // seleksi bacaan & profil level SAMA (pakai seed periode)
    expect(b.bacaan.map((p) => p.kode)).toEqual(a1.bacaan.map((p) => p.kode));
    expect(b.soalNum.map((q) => q.lv)).toEqual(a1.soalNum.map((q) => q.lv));
    // tapi ISI soal (angka) berbeda antar siswa (anti-nyontek)
    expect(b.soalNum.map((q) => q.qHTML)).not.toEqual(a1.soalNum.map((q) => q.qHTML));
  });

  it("seedBulan = tahun*12 + bulan", () => {
    expect(seedBulan("2026-07")).toBe(2026 * 12 + 7);
    expect(seedBulan("2026-01")).toBe(2026 * 12 + 1);
  });
});
