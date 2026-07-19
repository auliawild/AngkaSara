import Link from "next/link";
import { ikonJurusan } from "@/lib/kelas";
import { medali, type BarisPeringkat } from "@/lib/peringkat";

/**
 * Tabel peringkat siswa (dipakai lingkup sekolah & per kelas).
 * Di layar sempit (HP) tabel 7 kolom tak terbaca — di bawah `sm` berubah jadi kartu per siswa.
 */
export default function TabelPeringkat({ rows, tampilkanKelas }: { rows: BarisPeringkat[]; tampilkanKelas: boolean }) {
  return (
    <>
      {/* HP: kartu per siswa */}
      <ul className="divide-y divide-black/5 sm:hidden dark:divide-white/5">
        {rows.map((r) => (
          <li key={r.siswaId} className="flex items-start gap-3 px-4 py-3">
            <span className="w-9 shrink-0 pt-0.5 text-center font-black tabular-nums">
              {medali(r.peringkat, r.nilai) || r.peringkat}
            </span>
            <div className="min-w-0 flex-1">
              <Link
                href={`/guru/laporan/${r.siswaId}`}
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {r.nama}
              </Link>
              <div className="text-xs text-zinc-400">
                {r.nisn}
                {tampilkanKelas && ` · ${ikonJurusan(r.kelasLabel)} ${r.kelasLabel}`}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                🧮 {r.nilaiSkiba} <span className="text-zinc-400">({r.skibaLevel} lv · {r.skibaMutu ?? "—"}%)</span>
                {" · "}
                📖 {r.nilaiSkibaca}{" "}
                <span className="text-zinc-400">({r.skibacaBacaan} bacaan · {r.skibacaMutu ?? "—"}%)</span>
              </div>
            </div>
            <span className="shrink-0 text-right">
              <span className="text-lg font-bold tabular-nums">{r.nilai}</span>
              <span className="block text-[11px] text-zinc-400 tabular-nums">{r.aktivitas} aktivitas</span>
            </span>
          </li>
        ))}
      </ul>

      {/* Layar lebar: tabel penuh */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr className="border-b border-black/10 dark:border-white/10">
              <th className="px-4 py-2 text-center font-medium">#</th>
              <th className="px-4 py-2 font-medium">Nama</th>
              {tampilkanKelas && <th className="px-4 py-2 font-medium">Kelas</th>}
              <th className="px-4 py-2 text-center font-medium" title="Nilai gabungan 50% SKIBA + 50% SKIBACA">
                Nilai
              </th>
              <th className="px-4 py-2 text-center font-medium" title="Level arena selesai · rata skor">
                SKIBA
              </th>
              <th className="px-4 py-2 text-center font-medium" title="Bacaan kuis selesai · rata skor">
                SKIBACA
              </th>
              <th className="px-4 py-2 text-center font-medium">Aktivitas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.siswaId} className="border-b border-black/5 dark:border-white/5">
                <td className="px-4 py-2 text-center font-semibold tabular-nums">
                  {medali(r.peringkat, r.nilai)} {r.peringkat}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <Link
                    href={`/guru/laporan/${r.siswaId}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {r.nama}
                  </Link>
                  <div className="text-xs text-zinc-400">{r.nisn}</div>
                </td>
                {tampilkanKelas && (
                  <td className="px-4 py-2 whitespace-nowrap text-zinc-600 dark:text-zinc-300">
                    {ikonJurusan(r.kelasLabel)} {r.kelasLabel}
                  </td>
                )}
                <td className="px-4 py-2 text-center text-base font-bold tabular-nums">{r.nilai}</td>
                <td className="px-4 py-2 text-center tabular-nums">
                  {r.nilaiSkiba}
                  <div className="text-xs text-zinc-400">
                    {r.skibaLevel} lv · {r.skibaMutu ?? "—"}%
                  </div>
                </td>
                <td className="px-4 py-2 text-center tabular-nums">
                  {r.nilaiSkibaca}
                  <div className="text-xs text-zinc-400">
                    {r.skibacaBacaan} bacaan · {r.skibacaMutu ?? "—"}%
                  </div>
                </td>
                <td className="px-4 py-2 text-center tabular-nums text-zinc-500">{r.aktivitas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
