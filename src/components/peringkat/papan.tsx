import Link from "next/link";
import type { ReactNode } from "react";
import { ikonJurusan } from "@/lib/kelas";
import { medali, type BarisPeringkat } from "@/lib/peringkat";

export interface OpsiPapan {
  rows: BarisPeringkat[];
  /** Sorot baris "kamu" (tampilan siswa). */
  sayaId?: string;
  /** Tampilkan kelas di bawah nama (lingkup sekolah). */
  tampilkanKelas?: boolean;
  /** Baris rincian tambahan (aktivitas · NISN) untuk guru/admin. */
  detail?: boolean;
  /** Tautan per baris (guru → raport siswa). Tanpa ini nama tidak jadi tautan. */
  href?: (r: BarisPeringkat) => string;
}

/** Daftar baris peringkat — bentuk & gaya baris identik untuk semua peran. */
export function DaftarPapan({ rows, sayaId, tampilkanKelas, detail, href }: OpsiPapan) {
  return (
    <ol>
      {rows.map((r) => {
        const aku = sayaId != null && r.siswaId === sayaId;
        const nama: ReactNode = href ? (
          <Link href={href(r)} className="hover:underline">
            {r.nama}
          </Link>
        ) : (
          r.nama
        );
        return (
          <li
            key={r.siswaId}
            className={`flex items-center gap-3 border-b border-black/5 px-5 py-2.5 text-sm last:border-0 dark:border-white/5 ${
              aku ? "bg-violet-500/15 font-bold" : ""
            }`}
          >
            {/* Yang belum berlatih (nilai 0) seri di puncak — tampilkan "–" saja supaya tak terbaca juara. */}
            <span
              className={`w-10 shrink-0 text-center font-black tabular-nums ${r.nilai > 0 ? "" : "text-zinc-400"}`}
            >
              {r.nilai > 0 ? medali(r.peringkat, r.nilai) || r.peringkat : "–"}
            </span>
            <span className="min-w-0 flex-1 truncate">
              {nama}
              {aku && <span className="ml-1 text-xs text-violet-600 dark:text-violet-300">(kamu)</span>}
              {tampilkanKelas && (
                <span className="block text-[11px] font-medium text-zinc-500">
                  {ikonJurusan(r.kelasLabel)} {r.kelasLabel}
                </span>
              )}
              {detail && (
                <span className="block text-[11px] font-medium tabular-nums text-zinc-400">
                  {r.aktivitas} aktivitas · {r.nisn}
                </span>
              )}
            </span>
            <span className="shrink-0 text-right">
              <span className="text-base font-black tabular-nums">{r.nilai}</span>
              <span className="block text-[11px] font-medium tabular-nums text-zinc-500">
                🧮 {r.nilaiSkiba} · 📖 {r.nilaiSkibaca}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Papan peringkat lengkap (kartu + judul + daftar), dipakai langsung oleh tampilan siswa. */
export default function Papan({
  judul,
  ikon,
  kosong,
  ...opsi
}: OpsiPapan & { judul: string; ikon?: string; kosong: string }) {
  return (
    <section className="as-pop overflow-hidden rounded-3xl border border-black/5 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <h2 className="border-b border-black/5 px-5 py-3 font-black dark:border-white/10">
        {ikon && <span className="mr-1">{ikon}</span>}
        {judul}
      </h2>
      {opsi.rows.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-zinc-500">{kosong}</p>
      ) : (
        <DaftarPapan {...opsi} />
      )}
    </section>
  );
}
