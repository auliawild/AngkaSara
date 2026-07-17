/**
 * RNG deterministik & ber-seed untuk AngkaSara.
 *
 * Kenapa ada: mesin soal numerasi lama (soal-numerasi.js) memakai Math.random()
 * global + state module-global (questionHistory Map). Di server multi-request itu
 * tidak aman & tidak reproducible. Di sini semua kerandoman berasal dari seed,
 * sehingga Check Point tiap siswa bisa dibangun ulang & dinilai ulang di server.
 *
 * mulberry32: PRNG 32-bit cepat, kualitas cukup untuk kuis (bukan kripto).
 */

export type Rng = () => number; // menghasilkan float [0,1)

/** PRNG mulberry32 dari sebuah seed integer. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function (): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash string/angka → seed 32-bit (FNV-1a). Deterministik & stabil lintas platform. */
export function hashSeed(...parts: Array<string | number>): number {
  const str = parts.join("|");
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Rng dari daftar bagian seed (mis. studentId, period). */
export function rngFrom(...parts: Array<string | number>): Rng {
  return mulberry32(hashSeed(...parts));
}

/** Integer inklusif [min,max] memakai rng. */
export function randIntWith(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Ambil satu elemen acak. */
export function pickWith<T>(rng: Rng, arr: readonly T[]): T {
  return arr[randIntWith(rng, 0, arr.length - 1)];
}

/** Fisher-Yates pada SALINAN array (tidak memutasi input). */
export function shuffleWith<T>(rng: Rng, arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randIntWith(rng, 0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
