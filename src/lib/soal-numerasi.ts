/**
 * Mesin soal numerasi — port TypeScript dari D:\LitNum\assets\soal-numerasi.js.
 *
 * Perbedaan dari versi lama (WAJIB dijaga):
 *  - Semua kerandoman lewat RNG ber-seed yang di-INJECT (createNumerasiEngine(rng)),
 *    bukan Math.random() global. Reproducible & aman di server.
 *  - questionHistory jadi state PER-ENGINE (bukan module-global).
 *  - Logika/formula matematika & distraktor DIPERTAHANKAN persis (kontrak scoring).
 *
 * Kontrak scoring: answer numerik diformat fmtNum (koma desimal Indonesia, mis "2,41");
 * pecahan sebagai "n/d". Option.value = string kanonik itu → scoring bandingkan STRING.
 * Option.label boleh berisi markup (fracHTML) untuk render; UI yang menafsirkan.
 */

export type Rng = () => number;

export interface Topic {
  id: string;
  name: string;
  icon: string;
}
export interface Option {
  label: string;
  value: string;
}
export interface Generated {
  q: string;
  ctx?: string;
  answer: string;
  options: Option[];
}
export interface Question {
  topic: string;
  level: number;
  qHTML: string;
  ctx: string;
  answer: string;
  options: Option[];
}

/* ---------- data & util murni (tanpa rng) ---------- */

export const TOPICS: Topic[] = [
  { id: "tambah", name: "Penjumlahan", icon: "➕" },
  { id: "kurang", name: "Pengurangan", icon: "➖" },
  { id: "kali", name: "Perkalian", icon: "✖️" },
  { id: "bagi", name: "Pembagian", icon: "➗" },
  { id: "campuran", name: "Soal Campuran", icon: "🔀" },
  { id: "desimal", name: "Desimal", icon: "🔢" },
  { id: "pecahan", name: "Pecahan", icon: "🍕" },
  { id: "akar", name: "Akar Kuadrat", icon: "√" },
  { id: "aljabar", name: "Aljabar", icon: "𝑥" },
  { id: "konversi", name: "Konversi Satuan", icon: "📏" },
];

export const KONTEKS: Record<string, string[]> = {
  tkr: ["bengkel otomotif TKR", "servis motor TSM", "ganti oli mesin", "ukur tekanan ban"],
  tkj: ["praktik jaringan TKJ", "instalasi kabel LAN", "konfigurasi server", "lab komputer"],
  boga: ["dapur Kuliner", "praktik memasak", "resep kue", "penyajian menu"],
};

export const KONV_TABLE: { label: [string, string]; factor: number }[] = [
  { label: ["km", "m"], factor: 1000 },
  { label: ["m", "cm"], factor: 100 },
  { label: ["kg", "g"], factor: 1000 },
  { label: ["g", "mg"], factor: 1000 },
  { label: ["jam", "menit"], factor: 60 },
  { label: ["menit", "detik"], factor: 60 },
  { label: ["liter", "ml"], factor: 1000 },
  { label: ["ton", "kg"], factor: 1000 },
];

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

export function fracHTML(num: number | string, den: number | string): string {
  return `<span class="fraction"><span class="num">${num}</span><span class="den">${den}</span></span>`;
}

/** Integer → string; desimal dibulatkan 2 dan pakai KOMA (Indonesia). Load-bearing utk scoring. */
export function fmtNum(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  return (Math.round(n * 100) / 100).toString().replace(".", ",");
}

/** Interpolasi level 1..20 → [lo,hi] (integer). Level 1→lo, level 20→hi. */
export function li(L: number, lo: number, hi: number): number {
  return Math.round(lo + ((hi - lo) * (L - 1)) / 19);
}
export function lf(L: number, lo: number, hi: number): number {
  return lo + ((hi - lo) * (L - 1)) / 19;
}
export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Batas BAWAH yang naik seiring level (loAt) — cegah soal sepele di level tinggi. */
export function loAt(L: number, hi: number, frac?: number, base?: number): number {
  frac = frac == null ? 0.4 : frac;
  base = base == null ? 2 : base;
  return Math.max(base, Math.min(hi, Math.round((hi * frac * (L - 1)) / 19)));
}

type Formatter = (v: number) => string;

/* ============================================================
   ENGINE — semua yang butuh rng ada di sini (tak ada state global)
============================================================ */
export function createNumerasiEngine(rng: Rng) {
  const randInt = (min: number, max: number): number =>
    Math.floor(rng() * (max - min + 1)) + min;
  const pick = <T>(arr: readonly T[]): T => arr[randInt(0, arr.length - 1)];
  const shuffle = <T>(arr: readonly T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const coin = (): boolean => rng() < 0.5; // pengganti (Math.random()<0.5)

  function buildOptions(
    correct: number,
    misconceptions: number[],
    formatter?: Formatter,
  ): Option[] {
    const fmt = formatter || fmtNum;
    const correctLabel = fmt(correct);
    const set = new Set<string>([correctLabel]);
    for (const v of misconceptions) {
      if (set.size >= 4) break;
      const f = fmt(v);
      if (f !== correctLabel && !isNaN(parseFloat(String(v).replace(",", ".")))) set.add(f);
    }
    let guard = 0;
    while (set.size < 4 && guard < 40) {
      guard++;
      const jitter = correct + (coin() ? -1 : 1) * (1 + Math.floor(rng() * 6));
      const f = fmt(jitter);
      if (f !== correctLabel) set.add(f);
    }
    return shuffle([...set]).map((v) => ({ label: v, value: v }));
  }

  function buildFracOptions(n: number, d: number, misconceptions: [number, number][]): Option[] {
    const correctLabel = `${n}/${d}`;
    const set = new Set<string>([correctLabel]);
    for (const [mn, md] of misconceptions) {
      if (set.size >= 4) break;
      if (md > 0 && mn >= 0) {
        const g = gcd(mn || 1, md);
        const label = `${mn / g || 0}/${md / g}`;
        if (label !== correctLabel) set.add(label);
      }
    }
    let guard = 0;
    while (set.size < 4 && guard < 30) {
      guard++;
      const dn = n + randInt(-2, 3),
        dd = d + randInt(-2, 3);
      if (dd > 0 && dn >= 0) {
        const g = gcd(dn || 1, dd);
        const label = `${dn / g || 0}/${dd / g}`;
        if (label !== correctLabel) set.add(label);
      }
    }
    return shuffle([...set]).map((v) => {
      const [a, b] = v.split("/");
      return { label: fracHTML(a, b), value: v };
    });
  }

  function ctxLine(): string {
    const k = pick(["tkr", "tkj", "boga"]);
    return `Konteks: ${pick(KONTEKS[k])}`;
  }

  const GEN: Record<string, (L: number) => Generated> = {
    tambah: (L) => {
      const maxVal = li(L, 8, 400);
      const count = L <= 8 ? 2 : L <= 15 ? 3 : 4;
      const nums: number[] = [];
      const termMax = Math.max(3, Math.round(maxVal / (count - 1)));
      for (let i = 0; i < count; i++) nums.push(randInt(loAt(L, termMax), termMax));
      const correct = nums.reduce((s, v) => s + v, 0);
      const qtext = nums.join(" + ") + " = ?";
      const swapMinus = nums[0] - nums.slice(1).reduce((s, v) => s + v, 0);
      const partial = nums.slice(0, -1).reduce((s, v) => s + v, 0);
      const carryErr = correct + (coin() ? -10 : 10);
      return { q: qtext, answer: fmtNum(correct), options: buildOptions(correct, [swapMinus, partial, carryErr]) };
    },

    kurang: (L) => {
      const maxVal = li(L, 10, 500);
      const threeTerm = L >= 13;
      let a: number, b: number, c: number | null = null, correct: number;
      if (threeTerm) {
        a = randInt(Math.round(maxVal * 0.5), maxVal);
        b = randInt(2, Math.round(a * 0.4));
        c = randInt(2, Math.round((a - b) * 0.5));
        correct = a - b - c;
      } else {
        a = randInt(Math.round(maxVal * 0.4), maxVal);
        b = randInt(loAt(L, a - 1, 0.3, 1), Math.max(2, Math.round(a * 0.75)));
        correct = a - b;
      }
      const qtext = threeTerm ? `${a} - ${b} - ${c} = ?` : `${a} - ${b} = ?`;
      const addInstead = threeTerm ? a + b + (c as number) : a + b;
      const reversed = threeTerm ? Math.abs(b + (c as number) - a) : Math.abs(b - a);
      const borrowErr = correct + (coin() ? -10 : 10);
      return { q: qtext, answer: fmtNum(correct), options: buildOptions(correct, [addInstead, reversed, borrowErr]) };
    },

    kali: (L) => {
      const f1max = li(L, 6, 70);
      const f2max = li(L, 4, 30);
      const a = randInt(loAt(L, f1max), f1max),
        b = randInt(loAt(L, f2max), f2max);
      const correct = a * b;
      const addInstead = a + b;
      const offA = (a - 1) * b;
      const offB = a * (b + 1);
      return { q: `${a} × ${b} = ?`, answer: fmtNum(correct), options: buildOptions(correct, [addInstead, offA, offB]) };
    },

    bagi: (L) => {
      const divMax = li(L, 3, 30);
      const qMax = li(L, 4, 50);
      const b = randInt(loAt(L, divMax), divMax),
        q = randInt(loAt(L, qMax), qMax);
      const a = b * q;
      const mulInstead = a * b;
      const offQ1 = q + 1,
        offQ2 = q - 1;
      return { q: `${a} ÷ ${b} = ?`, answer: fmtNum(q), options: buildOptions(q, [mulInstead, offQ1, offQ2]) };
    },

    campuran: (L) => {
      if (L <= 5) {
        const a = randInt(2, li(L, 4, 15)),
          b = randInt(2, li(L, 4, 12)),
          c = randInt(2, li(L, 4, 10));
        const correct = a + b * c;
        const leftToRight = (a + b) * c;
        const wrongOp = a * b + c;
        return { q: `${a} + ${b} × ${c} = ?`, answer: fmtNum(correct), options: buildOptions(correct, [leftToRight, wrongOp, correct + b]) };
      } else if (L <= 10) {
        const aM = li(L, 5, 20), bM = li(L, 5, 15), cM = li(L, 3, 10);
        const a = randInt(loAt(L, aM), aM), b = randInt(loAt(L, bM), bM), c = randInt(loAt(L, cM), cM);
        const correct = (a + b) * c;
        const noParen = a + b * c;
        const wrongOp = (a - b) * c;
        return { q: `(${a} + ${b}) × ${c} = ?`, answer: fmtNum(correct), options: buildOptions(correct, [noParen, wrongOp, correct - c]) };
      } else if (L <= 15) {
        const bM = li(L, 3, 12), cM = li(L, 3, 10), dM = li(L, 3, 12);
        const a = randInt(li(L, 20, 50), li(L, 40, 90)), b = randInt(loAt(L, bM), bM), c = randInt(loAt(L, cM), cM), d = randInt(loAt(L, dM), dM);
        const correct = a - b * c + d;
        const leftToRight = (a - b) * c + d;
        const signErr = a - b * c - d;
        return { q: `${a} - ${b} × ${c} + ${d} = ?`, answer: fmtNum(correct), options: buildOptions(correct, [leftToRight, signErr, correct + c]) };
      } else {
        const bM = li(L, 3, 10), dM = li(L, 3, 12);
        const a = randInt(li(L, 3, 10), li(L, 8, 20)), b = randInt(loAt(L, bM), bM), c = randInt(li(L, 10, 25), li(L, 20, 40)), d = randInt(loAt(L, dM), dM);
        const correct = (a + b) * (c - d);
        const noParen = a + b * c - d;
        const oneParen = a + b * (c - d);
        return { q: `(${a} + ${b}) × (${c} - ${d}) = ?`, answer: fmtNum(correct), options: buildOptions(correct, [noParen, oneParen, correct - d]) };
      }
    },

    desimal: (L) => {
      const decPlaces = L <= 7 ? 1 : L <= 14 ? 2 : 2;
      const scale = Math.pow(10, decPlaces);
      const maxVal = li(L, 20, 900);
      const bMax = Math.round(maxVal * 0.7);
      const a = randInt(loAt(L, maxVal, 0.4, 10), maxVal) / scale;
      const b = randInt(loAt(L, bMax, 0.4, 10), bMax) / scale;
      if (L <= 16) {
        const op = pick(["+", "-"]);
        let x = a, y = b;
        if (op === "-") {
          x = Math.max(a, b);
          y = Math.min(a, b);
        }
        const correct = Math.round((op === "+" ? x + y : x - y) * 100) / 100;
        const shiftErr = Math.round(correct * 10 * 100) / 100;
        const intOnlyErr = Math.round(op === "+" ? Math.floor(x) + Math.floor(y) : Math.floor(x) - Math.floor(y));
        const roundErr = Math.round(correct) + (coin() ? -0.1 : 0.1);
        return { q: `${fmtNum(x)} ${op} ${fmtNum(y)} = ?`, answer: fmtNum(correct), options: buildOptions(correct, [shiftErr, intOnlyErr, roundErr]) };
      } else {
        const x = Math.round(randInt(15, 90)) / 10, y = Math.round(randInt(12, 45)) / 10;
        const correct = Math.round(x * y * 100) / 100;
        const shiftErr = Math.round(correct * 10 * 100) / 100;
        const noDecErr = Math.round(x) * Math.round(y);
        return { q: `${fmtNum(x)} × ${fmtNum(y)} = ?`, answer: fmtNum(correct), options: buildOptions(correct, [shiftErr, noDecErr, correct / 10]) };
      }
    },

    pecahan: (L) => {
      if (L <= 5) {
        const d = randInt(4, li(L, 5, 10));
        let n1 = randInt(1, d - 1), n2 = randInt(1, d - 1);
        if (n1 + n2 >= d) n2 = Math.max(1, d - n1 - 1);
        const sumN = n1 + n2;
        const g = gcd(sumN, d);
        const sN = sumN / g, sD = d / g;
        return { q: `${fracHTML(n1, d)} + ${fracHTML(n2, d)} = ?`, answer: `${sN}/${sD}`, options: buildFracOptions(sN, sD, [[n1 + n2, d + d], [n1 + n2, d], [sN + 1, sD]]) };
      } else if (L <= 10) {
        const d1 = randInt(2, li(L, 4, 8)), d2 = randInt(2, li(L, 4, 9));
        const D = d1 * d2;
        const n1 = randInt(1, d1 - 1), n2 = randInt(1, d2 - 1);
        const num = n1 * (D / d1) + n2 * (D / d2);
        const g = gcd(num, D);
        const sN = num / g, sD = D / g;
        return { q: `${fracHTML(n1, d1)} + ${fracHTML(n2, d2)} = ?`, answer: `${sN}/${sD}`, options: buildFracOptions(sN, sD, [[n1 + n2, d1 + d2], [n1 + n2, d1], [sN, sD + d2]]) };
      } else if (L <= 15) {
        const n1 = randInt(1, li(L, 4, 8)), d1 = randInt(n1 + 1, li(L, 6, 12)), n2 = randInt(1, li(L, 4, 8)), d2 = randInt(n2 + 1, li(L, 6, 12));
        const num = n1 * n2, den = d1 * d2;
        const g = gcd(num, den);
        const sN = num / g, sD = den / g;
        return { q: `${fracHTML(n1, d1)} × ${fracHTML(n2, d2)} = ?`, answer: `${sN}/${sD}`, options: buildFracOptions(sN, sD, [[n1 * d2 + n2 * d1, d1 * d2], [num, den], [sN + 1, sD]]) };
      } else {
        const n1 = randInt(1, li(L, 4, 9)), d1 = randInt(n1 + 1, li(L, 6, 13)), n2 = randInt(1, li(L, 4, 9)), d2 = randInt(n2 + 1, li(L, 6, 13));
        const num = n1 * d2, den = d1 * n2;
        const g = gcd(num, den);
        const sN = num / g, sD = den / g;
        return { q: `${fracHTML(n1, d1)} ÷ ${fracHTML(n2, d2)} = ?`, answer: `${sN}/${sD}`, options: buildFracOptions(sN, sD, [[n1 * n2, d1 * d2], [d1 * n2, n1 * d2], [sN, sD + 1]]) };
      }
    },

    akar: (L) => {
      if (L <= 6) {
        const r = randInt(2, li(L, 6, 15));
        const val = r * r;
        return { q: `√${val} = ?`, answer: fmtNum(r), options: buildOptions(r, [Math.round(val / 2), r + 1, r - 1]) };
      } else if (L <= 12) {
        const r = randInt(li(L, 10, 18), li(L, 15, 25));
        const val = r * r;
        return { q: `√${val} = ?`, answer: fmtNum(r), options: buildOptions(r, [Math.round(val / 2), r + 1, r - 2]) };
      } else if (L <= 16) {
        const rM = li(L, 8, 16);
        const r1 = randInt(loAt(L, rM, 0.4, 3), rM), r2 = randInt(loAt(L, rM, 0.4, 3), rM);
        const correct = r1 + r2;
        const wrongCombine = Math.round(Math.sqrt(r1 * r1 + r2 * r2));
        return { q: `√${r1 * r1} + √${r2 * r2} = ?`, answer: fmtNum(correct), options: buildOptions(correct, [wrongCombine, correct + 1, correct - 1]) };
      } else {
        const r1M = li(L, 10, 20);
        const r1 = randInt(loAt(L, r1M, 0.4, 4), r1M);
        const r2M = Math.max(4, r1 - 2), r2 = randInt(loAt(L, r2M, 0.4, 3), r2M);
        const correct = r1 * r2;
        const addInstead = r1 + r2;
        const offBy = correct + r2;
        return { q: `√${r1 * r1} × √${r2 * r2} = ?`, answer: fmtNum(correct), options: buildOptions(correct, [addInstead, offBy, correct - r1]) };
      }
    },

    aljabar: (L) => {
      if (L <= 5) {
        const x = randInt(1, li(L, 8, 25)), a = randInt(1, li(L, 5, 20));
        const b = x + a;
        return { q: `x + ${a} = ${b}, maka x = ?`, answer: fmtNum(x), options: buildOptions(x, [b, -x, x + a]) };
      } else if (L <= 10) {
        const x = randInt(1, li(L, 6, 18)), koef = randInt(2, li(L, 3, 9)), b = randInt(1, li(L, 5, 25));
        const c = koef * x + b;
        return { q: `${koef}x + ${b} = ${c}, maka x = ?`, answer: fmtNum(x), options: buildOptions(x, [c - b, -x, x + 1]) };
      } else if (L <= 15) {
        const x = randInt(1, li(L, 5, 15)), k1 = randInt(3, li(L, 4, 10)), b1 = randInt(1, li(L, 3, 15));
        const k2 = randInt(1, Math.max(1, k1 - 1));
        const b2 = k1 * x + b1 - k2 * x;
        const wrongMove = x + (b1 - b2);
        const swappedCoef = Math.round((b2 - b1) / (k1 + k2));
        return { q: `${k1}x + ${b1} = ${k2}x + ${b2}, maka x = ?`, answer: fmtNum(x), options: buildOptions(x, [wrongMove, swappedCoef, x - 1]) };
      } else {
        const x = randInt(1, li(L, 4, 12)), a = randInt(2, li(L, 3, 10)), b = randInt(1, li(L, 3, 12));
        const c = a * (x + b);
        const forgotDistribute = c - a - b;
        const wrongDivideFirst = Math.round(c / a);
        return { q: `${a}(x + ${b}) = ${c}, maka x = ?`, answer: fmtNum(x), options: buildOptions(x, [forgotDistribute, wrongDivideFirst, x + b]) };
      }
    },

    konversi: (L) => {
      const item = pick(KONV_TABLE);
      const [big, small] = item.label;
      const reverse = L >= 6 && L % 2 === 0;
      const chainStep = L >= 16;
      if (!chainStep) {
        if (!reverse) {
          const v = randInt(1, li(L, 20, 80));
          const correct = v * item.factor;
          const divInstead = Math.round((v / item.factor) * 1000) / 1000;
          const shiftErr1 = correct * 10, shiftErr2 = Math.round(correct / 10);
          return { q: `${v} ${big} = ? ${small}`, ctx: ctxLine(), answer: fmtNum(correct), options: buildOptions(correct, [divInstead, shiftErr1, shiftErr2]) };
        } else {
          const v = randInt(li(L, 50, 300), li(L, 300, 2000));
          const correct = Math.round((v / item.factor) * 1000) / 1000;
          const mulInstead = v * item.factor;
          const shiftErr1 = correct * 10, shiftErr2 = correct / 10;
          return { q: `${v} ${small} = ? ${big}`, ctx: ctxLine(), answer: fmtNum(correct), options: buildOptions(correct, [mulInstead, shiftErr1, shiftErr2]) };
        }
      } else {
        const v = randInt(2, li(L, 10, 40));
        const extra = randInt(10, item.factor - 1);
        const correct = v * item.factor + extra;
        const forgotExtra = v * item.factor;
        const wrongFactor = v * (item.factor / 10 || 1) + extra;
        return { q: `${v} ${big} ${extra} ${small} = ? ${small}`, ctx: ctxLine() + ` (gabungan satuan)`, answer: fmtNum(correct), options: buildOptions(correct, [forgotExtra, wrongFactor, correct - extra]) };
      }
    },
  };

  function generateQuestion(topicId: string, level: number): Question {
    const g = GEN[topicId](level);
    return { topic: topicId, level, qHTML: g.q, ctx: g.ctx || "", answer: g.answer, options: g.options };
  }

  // Anti-ulang: soal identik tak muncul lebih dari 2x (state per-engine, bukan global).
  const questionHistory = new Map<string, number>();
  function generateUniqueQuestion(topicId: string, level: number): Question {
    let q: Question, key: string, attempt = 0;
    do {
      q = generateQuestion(topicId, level);
      key = topicId + "|" + level + "|" + q.qHTML;
      attempt++;
    } while ((questionHistory.get(key) || 0) >= 2 && attempt < 25);
    questionHistory.set(key, (questionHistory.get(key) || 0) + 1);
    return q;
  }

  return { randInt, pick, shuffle, buildOptions, buildFracOptions, ctxLine, GEN, generateQuestion, generateUniqueQuestion };
}

export type NumerasiEngine = ReturnType<typeof createNumerasiEngine>;
