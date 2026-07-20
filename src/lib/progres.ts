/**
 * Agregasi PROGRES per bucket waktu (MURNI, tanpa IO) — untuk tampilan progres harian/
 * mingguan/bulanan per siswa (guru/admin). Sumber: baris PracticeActivity (tiap sesi latihan
 * SKIBA/SKIBACA). Memakai helper bucket dari [[kelas]] (bucketKey/bucketLabel/bucketTerakhir)
 * supaya penanggalan konsisten dengan app lama. Rata skor pakai Math.round (konsisten Evaluasi).
 */
import { bucketKey, bucketLabel, bucketTerakhir, BUCKET_JUMLAH, type BucketMode } from "./kelas";

export interface AktivitasRingkas {
  ts: number | Date; // createdAt
  domain: string; // "NUMERASI" | "LITERASI"
  score: number; // 0..100
  points: number; // poin (combo) — 0 bila tak ada
}

export interface TitikProgres {
  key: string;
  label: string;
  total: number; // jumlah aktivitas (num + lit)
  jumlahNum: number;
  jumlahLit: number;
  num: number | null; // rata skor numerasi
  lit: number | null; // rata skor literasi
  poin: number;
}

export interface ProgresData {
  mode: BucketMode;
  titik: TitikProgres[]; // urut lama → baru
  totalAktivitas: number;
  totalNum: number; // jumlah pengerjaan numerasi (kuantitas)
  totalLit: number; // jumlah pengerjaan literasi (kuantitas)
  totalPoin: number;
  bucketAktif: number; // jumlah bucket yang ada aktivitas
  rataNum: number | null; // rata skor numerasi seluruh jendela (mutu capaian)
  rataLit: number | null;
}

/** Agregasi aktivitas ke deret bucket terakhir untuk `mode` (14 hari / 12 minggu / 12 bulan). */
export function agregatProgres(
  aktivitas: AktivitasRingkas[],
  mode: BucketMode,
  now: Date = new Date(),
): ProgresData {
  const keys = bucketTerakhir(mode, BUCKET_JUMLAH[mode], now);
  const idx = new Map(keys.map((k, i) => [k, i]));
  const sumNum = keys.map(() => 0);
  const cntNum = keys.map(() => 0);
  const sumLit = keys.map(() => 0);
  const cntLit = keys.map(() => 0);
  const poin = keys.map(() => 0);

  let sumNumAll = 0;
  let cntNumAll = 0;
  let sumLitAll = 0;
  let cntLitAll = 0;

  for (const a of aktivitas) {
    const i = idx.get(bucketKey(a.ts, mode));
    if (i == null) continue;
    poin[i] += a.points || 0;
    if (a.domain === "NUMERASI") {
      sumNum[i] += a.score;
      cntNum[i]++;
      sumNumAll += a.score;
      cntNumAll++;
    } else if (a.domain === "LITERASI") {
      sumLit[i] += a.score;
      cntLit[i]++;
      sumLitAll += a.score;
      cntLitAll++;
    }
  }

  const titik: TitikProgres[] = keys.map((k, i) => ({
    key: k,
    label: bucketLabel(k, mode),
    jumlahNum: cntNum[i],
    jumlahLit: cntLit[i],
    total: cntNum[i] + cntLit[i],
    num: cntNum[i] ? Math.round(sumNum[i] / cntNum[i]) : null,
    lit: cntLit[i] ? Math.round(sumLit[i] / cntLit[i]) : null,
    poin: poin[i],
  }));

  return {
    mode,
    titik,
    totalAktivitas: titik.reduce((s, t) => s + t.total, 0),
    totalNum: cntNumAll,
    totalLit: cntLitAll,
    totalPoin: titik.reduce((s, t) => s + t.poin, 0),
    bucketAktif: titik.filter((t) => t.total > 0).length,
    rataNum: cntNumAll ? Math.round(sumNumAll / cntNumAll) : null,
    rataLit: cntLitAll ? Math.round(sumLitAll / cntLitAll) : null,
  };
}
