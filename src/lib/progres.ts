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

/* ══════════ Ringkasan progres SATU BULAN kalender ══════════
 * Untuk rekap sekelas per bulan (tabel cetak): total pengerjaan & mutu tiap siswa
 * dibatasi ke bulan (tahun, bulan) tertentu — bukan jendela bergulir.
 */
export interface RingkasBulan {
  totalNum: number; // jumlah pengerjaan numerasi bulan itu
  totalLit: number; // jumlah pengerjaan literasi bulan itu
  totalPoin: number;
  rataNum: number | null; // mutu: rata skor numerasi (0..100)
  rataLit: number | null;
}

/** Ringkas aktivitas satu siswa untuk bulan kalender (tahun, bulan 1..12). */
export function agregatBulan(aktivitas: AktivitasRingkas[], tahun: number, bulan: number): RingkasBulan {
  let sumNum = 0;
  let cntNum = 0;
  let sumLit = 0;
  let cntLit = 0;
  let poin = 0;
  for (const a of aktivitas) {
    const d = new Date(a.ts);
    if (d.getFullYear() !== tahun || d.getMonth() + 1 !== bulan) continue;
    poin += a.points || 0;
    if (a.domain === "NUMERASI") {
      sumNum += a.score;
      cntNum++;
    } else if (a.domain === "LITERASI") {
      sumLit += a.score;
      cntLit++;
    }
  }
  return {
    totalNum: cntNum,
    totalLit: cntLit,
    totalPoin: poin,
    rataNum: cntNum ? Math.round(sumNum / cntNum) : null,
    rataLit: cntLit ? Math.round(sumLit / cntLit) : null,
  };
}

/* ══════════ Kalender latihan HARIAN dalam satu bulan ══════════
 * Menampilkan tiap tanggal: mengerjakan atau tidak & berapa banyak (numerasi/literasi).
 */
export interface HariKalender {
  tanggal: number; // 1..jumlahHari
  iso: string; // "YYYY-MM-DD"
  dow: number; // 0..6 (0 = Minggu), utk tata letak kalender
  num: number; // jumlah pengerjaan numerasi hari itu
  lit: number; // jumlah pengerjaan literasi hari itu
  total: number; // num + lit
  ada: boolean; // total > 0 (mengerjakan hari itu)
}

export interface KalenderData {
  tahun: number;
  bulan: number; // 1..12
  jumlahHari: number;
  dowAwal: number; // hari-dalam-minggu tanggal 1 (0 = Minggu) — untuk sel kosong di awal grid
  hari: HariKalender[]; // urut tanggal 1..jumlahHari
  hariAktif: number; // banyak hari mengerjakan
  totalNum: number;
  totalLit: number;
  total: number;
  maxHarian: number; // pengerjaan terbanyak dalam satu hari (skala warna)
  streakTerpanjang: number; // rentetan hari aktif berturut terpanjang
  rataNum: number | null; // mutu: rata skor numerasi sebulan
  rataLit: number | null;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Agregasi aktivitas menjadi kalender harian untuk bulan (tahun, bulan 1..12). */
export function agregatKalender(aktivitas: AktivitasRingkas[], tahun: number, bulan: number): KalenderData {
  const jumlahHari = new Date(tahun, bulan, 0).getDate(); // bulan 1-based → 0 hari bulan berikut = hari terakhir
  const num = new Array<number>(jumlahHari + 1).fill(0);
  const lit = new Array<number>(jumlahHari + 1).fill(0);
  let sumNum = 0;
  let cntNum = 0;
  let sumLit = 0;
  let cntLit = 0;

  for (const a of aktivitas) {
    const d = new Date(a.ts);
    if (d.getFullYear() !== tahun || d.getMonth() + 1 !== bulan) continue;
    const t = d.getDate();
    if (a.domain === "NUMERASI") {
      num[t]++;
      sumNum += a.score;
      cntNum++;
    } else if (a.domain === "LITERASI") {
      lit[t]++;
      sumLit += a.score;
      cntLit++;
    }
  }

  const hari: HariKalender[] = [];
  let hariAktif = 0;
  let maxHarian = 0;
  let streak = 0;
  let streakMax = 0;
  for (let t = 1; t <= jumlahHari; t++) {
    const total = num[t] + lit[t];
    const ada = total > 0;
    if (ada) {
      hariAktif++;
      if (total > maxHarian) maxHarian = total;
      streak++;
      if (streak > streakMax) streakMax = streak;
    } else {
      streak = 0;
    }
    hari.push({
      tanggal: t,
      iso: `${tahun}-${pad2(bulan)}-${pad2(t)}`,
      dow: new Date(tahun, bulan - 1, t).getDay(),
      num: num[t],
      lit: lit[t],
      total,
      ada,
    });
  }

  return {
    tahun,
    bulan,
    jumlahHari,
    dowAwal: new Date(tahun, bulan - 1, 1).getDay(),
    hari,
    hariAktif,
    totalNum: cntNum,
    totalLit: cntLit,
    total: cntNum + cntLit,
    maxHarian,
    streakTerpanjang: streakMax,
    rataNum: cntNum ? Math.round(sumNum / cntNum) : null,
    rataLit: cntLit ? Math.round(sumLit / cntLit) : null,
  };
}
