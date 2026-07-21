import Link from "next/link";
import { ikonJurusan } from "@/lib/kelas";
import { medali, type BarisPeringkat } from "@/lib/peringkat";

/** Warna medali per peringkat (emas/perak/perunggu) — dipakai bingkai avatar & tiang. */
function tone(peringkat: number): string {
  return peringkat === 1 ? "#eab308" : peringkat === 2 ? "#94a3b8" : "#f97316";
}

/** Inisial 1–2 huruf dari nama (tanpa emoji gender — netral). */
function inisial(nama: string): string {
  const kata = nama.trim().split(/\s+/);
  const a = kata[0]?.[0] ?? "";
  const b = kata.length > 1 ? (kata[1][0] ?? "") : "";
  return (a + b).toUpperCase();
}

/** Satu kolom podium (avatar + nama + nilai + tiang). `tinggi` = tinggi tiang (posisi). */
function Kolom({
  r,
  besar,
  tinggi,
}: {
  r: BarisPeringkat;
  besar: boolean;
  tinggi: number;
}) {
  const t = tone(r.peringkat);
  const sisi = besar ? 66 : 54;
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex items-center justify-center rounded-full bg-white font-black text-zinc-800 shadow-[0_10px_24px_-12px_rgba(30,20,60,.5)] dark:bg-zinc-800 dark:text-zinc-100"
        style={{ width: sisi, height: sisi, border: `3px solid ${t}`, fontSize: besar ? 22 : 18 }}
      >
        {inisial(r.nama)}
        <span className="absolute -bottom-1.5 -right-1 text-lg leading-none">
          {medali(r.peringkat, r.nilai)}
        </span>
      </div>
      <Link
        href={`/guru/laporan/${r.siswaId}`}
        className="mt-2 max-w-[92px] text-center text-[11.5px] font-extrabold leading-tight text-zinc-900 hover:underline dark:text-zinc-50"
      >
        {r.nama}
      </Link>
      <p className="mt-0.5 text-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
        {r.nilai} · {ikonJurusan(r.kelasLabel)} {r.kelasLabel}
      </p>
      <div
        className="mt-2 flex items-start justify-center pt-1.5 font-black text-white"
        style={{
          width: 74,
          height: tinggi,
          borderRadius: "14px 14px 0 0",
          background: `linear-gradient(180deg,${t},${t}22)`,
          fontSize: 15,
          textShadow: "0 1px 2px rgba(0,0,0,.2)",
        }}
      >
        {r.peringkat}
      </div>
    </div>
  );
}

/**
 * Podium 3 besar sekolah (juara di tengah, tertinggi). Hanya siswa bernilai > 0 yang tampil —
 * kalau belum ada yang berlatih, komponen tidak merender apa pun (tanpa penjaga ini seluruh
 * siswa nilai 0 akan seri di puncak; sejalan dengan `medali()`).
 */
export default function Podium({ rows }: { rows: BarisPeringkat[] }) {
  const top = rows.filter((r) => r.nilai > 0).slice(0, 3);
  if (top.length === 0) return null;

  // Susunan podium: [kiri = #2, tengah = #1, kanan = #3] — hanya slot yang ada.
  const kiri = top[1];
  const tengah = top[0];
  const kanan = top[2];

  return (
    <section className="rounded-xl border border-black/10 px-5 py-6 dark:border-white/15">
      <h2 className="mb-4 text-center text-sm font-extrabold text-zinc-800 dark:text-zinc-100">
        🏆 Tiga Teratas Sekolah
      </h2>
      <div className="flex items-end justify-center gap-3">
        {kiri && <Kolom r={kiri} besar={false} tinggi={58} />}
        <Kolom r={tengah} besar tinggi={80} />
        {kanan && <Kolom r={kanan} besar={false} tinggi={44} />}
      </div>
    </section>
  );
}
