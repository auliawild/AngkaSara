import { describe, it, expect } from "vitest";
import { createNumerasiEngine, TOPICS, KONV_TABLE, type Question } from "@/lib/soal-numerasi";
import { mulberry32 } from "@/lib/rng";

/* ============================================================
   Evaluator INDEPENDEN — menghitung ulang jawaban dari teks soal,
   lepas dari kode generator. Ini menegakkan invarian "kunci selalu benar"
   (dulu pernah jadi bug di aplikasi lama). Target: 0 kunci salah.
============================================================ */

function toExpr(qHTML: string): string {
  let s = qHTML.replace(/\s*=\s*\?\s*$/, "");
  s = s.replace(
    /<span class="fraction"><span class="num">([^<]*)<\/span><span class="den">([^<]*)<\/span><\/span>/g,
    "($1/$2)",
  );
  s = s.replace(/×/g, "*").replace(/÷/g, "/");
  s = s.replace(/√(\d+(?:\.\d+)?)/g, "Math.sqrt($1)");
  s = s.replace(/(\d),(\d)/g, "$1.$2");
  return s;
}
function evalExpr(expr: string): number {
  // input hanya string yang KITA hasilkan sendiri → aman
  return Function(`"use strict";return (${expr});`)() as number;
}
function parseAnswer(ans: string): number {
  if (ans.includes("/")) {
    const [a, b] = ans.split("/").map(Number);
    return a / b;
  }
  return parseFloat(ans.replace(",", "."));
}

const bigToSmall = new Map<string, number>();
KONV_TABLE.forEach((it) => bigToSmall.set(`${it.label[0]}|${it.label[1]}`, it.factor));

function expectedKonversi(qHTML: string): number {
  const chain = qHTML.match(/^(\d+) (\S+) (\d+) (\S+) = \? \S+$/);
  if (chain) {
    const v = +chain[1], big = chain[2], extra = +chain[3], small = chain[4];
    const f = bigToSmall.get(`${big}|${small}`)!;
    return v * f + extra;
  }
  const m = qHTML.match(/^(\d+) (\S+) = \? (\S+)$/)!;
  const v = +m[1], u1 = m[2], u2 = m[3];
  const fwd = bigToSmall.get(`${u1}|${u2}`);
  if (fwd != null) return v * fwd; // forward big→small
  const f = bigToSmall.get(`${u2}|${u1}`)!; // reverse small→big
  return Math.round((v / f) * 1000) / 1000;
}

function aljabarBenar(qHTML: string, ans: string): boolean {
  const eq = qHTML.split(",")[0]; // buang ", maka x = ?"
  const [lhs, rhs] = eq.split("=").map((s) => s.trim());
  const sub = (side: string) =>
    side
      .replace(/×/g, "*")
      .replace(/(\d)x/g, "$1*x")
      .replace(/(\d)\(/g, "$1*(")
      .replace(/x/g, `(${parseAnswer(ans)})`);
  return Math.abs(evalExpr(sub(lhs)) - evalExpr(sub(rhs))) < 1e-6;
}

/** true jika kunci soal cocok dengan perhitungan independen */
function kunciBenar(q: Question): boolean {
  const ans = parseAnswer(q.answer);
  if (q.topic === "aljabar") return aljabarBenar(q.qHTML, q.answer);
  if (q.topic === "konversi") return Math.abs(expectedKonversi(q.qHTML) - ans) < 0.006;
  const val = evalExpr(toExpr(q.qHTML));
  return Math.abs(val - ans) < 0.006;
}

describe("soal-numerasi: kunci jawaban benar (lintas 10 topik × 20 level)", () => {
  it("0 kunci salah pada ribuan sampel", () => {
    const gagal: string[] = [];
    let diuji = 0;
    for (let s = 0; s < 6; s++) {
      const eng = createNumerasiEngine(mulberry32(1000 + s * 7));
      for (const t of TOPICS) {
        for (let L = 1; L <= 20; L++) {
          const q = eng.generateQuestion(t.id, L);
          diuji++;
          if (!kunciBenar(q)) gagal.push(`${t.id} L${L}: "${q.qHTML}" -> kunci ${q.answer}`);
        }
      }
    }
    expect({ diuji, gagal: gagal.slice(0, 10), jumlahGagal: gagal.length }).toEqual({
      diuji,
      gagal: [],
      jumlahGagal: 0,
    });
    expect(diuji).toBe(6 * 10 * 20);
  });
});

describe("soal-numerasi: integritas opsi", () => {
  it("tiap soal punya 4 opsi unik & kunci ada di antaranya", () => {
    const eng = createNumerasiEngine(mulberry32(42));
    const gagal: string[] = [];
    for (const t of TOPICS) {
      for (let L = 1; L <= 20; L++) {
        for (let n = 0; n < 3; n++) {
          const q = eng.generateQuestion(t.id, L);
          const values = q.options.map((o) => o.value);
          if (q.options.length !== 4) gagal.push(`${t.id} L${L}: ${q.options.length} opsi`);
          if (new Set(values).size !== values.length) gagal.push(`${t.id} L${L}: opsi kembar`);
          if (!values.includes(q.answer)) gagal.push(`${t.id} L${L}: kunci tak ada di opsi`);
        }
      }
    }
    expect(gagal).toEqual([]);
  });
});

describe("soal-numerasi: determinisme (seed → hasil sama)", () => {
  it("seed sama menghasilkan soal identik; seed beda berbeda", () => {
    const script: [string, number][] = [
      ["tambah", 5], ["kali", 12], ["pecahan", 18], ["aljabar", 20], ["konversi", 16],
    ];
    const run = (seed: number) => {
      const e = createNumerasiEngine(mulberry32(seed));
      return script.map(([t, L]) => e.generateQuestion(t, L).qHTML);
    };
    expect(run(777)).toEqual(run(777)); // reproducible
    expect(run(777)).not.toEqual(run(778)); // seed beda → beda
  });

  it("generateUniqueQuestion: history per-engine, tidak bocor antar-instance", () => {
    const a = createNumerasiEngine(mulberry32(1));
    const b = createNumerasiEngine(mulberry32(1));
    // dua engine seed sama → urutan unique-question identik (state tak dibagi global)
    const seqA = Array.from({ length: 5 }, () => a.generateUniqueQuestion("tambah", 10).qHTML);
    const seqB = Array.from({ length: 5 }, () => b.generateUniqueQuestion("tambah", 10).qHTML);
    expect(seqA).toEqual(seqB);
  });
});
