import { describe, it, expect } from "vitest";
import { buildCheckpoint, CHECKPOINT_CONFIG, type RawPassage } from "@/lib/checkpoint";
import { BACAAN_CHECKPOINT } from "../prisma/data/bacaan-checkpoint";

/* ============================================================
   Invarian seleksi bacaan diuji pada BANK ASLI (32 bacaan yang benar-benar
   di-seed ke DB), bukan bank sintetis. Distribusi tema NYATA timpang
   (10 "Umum", TPTUP hanya 2) — lebih menantang untuk anti-setema daripada
   kluster rata di checkpoint.test.ts. Kalau invarian di sini gagal, itu
   masalah pada URUTAN bank yang di-seed, bukan pada logika.
============================================================ */

// Map bentuk seed (kunci di options[0], answer:0) → RawPassage yang dipakai checkpoint.
const BANK: RawPassage[] = BACAAN_CHECKPOINT.map((b) => ({
  kode: b.id,
  tema: b.jurusan,
  title: b.title,
  text: b.text,
  questions: b.questions.map((q) => ({ q: q.q, options: q.options, answerIndex: q.answer })),
}));

const months = (y0: number, count: number) =>
  Array.from({ length: count }, (_, k) => {
    const y = y0 + Math.floor(k / 12);
    const m = (k % 12) + 1;
    return `${y}-${String(m).padStart(2, "0")}`;
  });

describe("checkpoint (bank asli): 32 bacaan tersedia & konsisten", () => {
  it("bank berisi tepat 32 bacaan × 5 soal, kode unik", () => {
    expect(BANK.length).toBe(32);
    expect(new Set(BANK.map((p) => p.kode)).size).toBe(32);
    for (const p of BANK) expect(p.questions.length).toBe(CHECKPOINT_CONFIG.SOAL_PER_BACAAN);
  });
});

describe("checkpoint (bank asli): seleksi anti-ulang & anti-setema selama 36 bulan", () => {
  it("0 tumpang-tindih antar bulan; 0 checkpoint setema-seragam; 3 bacaan berbeda", () => {
    let prev: Set<string> | null = null;
    let overlap = 0;
    let setemaSeragam = 0;
    for (const period of months(2026, 36)) {
      const b = buildCheckpoint({ period, studentKey: "S1", passages: BANK });
      const kodes = b.bacaan.map((p) => p.kode);
      expect(b.bacaan.length).toBe(CHECKPOINT_CONFIG.JML_BACAAN);
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

describe("checkpoint (bank asli): pengacakan opsi menjaga kunci", () => {
  it("answerIndex tetap menunjuk opsi kunci ASLI (options[0] bank), tersebar >1 posisi", () => {
    const posisi = [0, 0, 0, 0];
    let salahTunjuk = 0;
    // peta kode→daftar kunci asli (options[0] tiap soal) untuk cek independen
    const kunciAsli = new Map(BANK.map((p) => [p.kode, p.questions.map((q) => q.options[0])]));
    for (let s = 0; s < 50; s++) {
      const b = buildCheckpoint({ period: "2026-09", studentKey: `S${s}`, passages: BANK });
      b.bacaan.forEach((p) => {
        const asli = kunciAsli.get(p.kode)!;
        p.questions.forEach((q, qi) => {
          posisi[q.answerIndex]++;
          if (q.options[q.answerIndex] !== asli[qi]) salahTunjuk++;
        });
      });
    }
    expect(salahTunjuk).toBe(0);
    expect(posisi.filter((c) => c > 0).length).toBeGreaterThan(1); // bukan selalu index 0
  });
});
