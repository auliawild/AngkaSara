import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { muatLaporanKelas } from "@/server/laporan";
import { ikonJurusan } from "@/lib/kelas";
import FilterLaporan from "./filter";
import LingkupBanner from "../lingkup-banner";

export const metadata = { title: "Laporan Progres — AngkaSara" };

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string; semester?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/masuk?tab=staf&next=/guru/laporan");
  const isAdmin = ((session.user as { role?: string }).role ?? "GURU") === "ADMIN";

  const sp = await searchParams;
  const d = await muatLaporanKelas({ kelas: sp.kelas, semester: sp.semester });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/guru" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              ← Dasbor
            </Link>
            <h1 className="text-2xl font-bold">Laporan Progres</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Rekap progres pengerjaan siswa & raport siap cetak · {d.semesterLabel}
          </p>
        </div>
        <FilterLaporan
          kelasOpsi={d.kelasOpsi}
          semesterOpsi={d.semesterOpsi}
          kelas={d.kelas}
          semester={d.semesterId}
        />
      </header>

      <LingkupBanner kelas={d.dibatasiKe} />

      {!d.kelas ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
          👆 Pilih kelas di atas untuk melihat progres tiap siswa. Nilai akhir memakai <b>Check Point</b> (asesmen
          formal bulanan); SKIBA Math & SKIBACA ditampilkan sebagai capaian latihan mandiri.
        </div>
      ) : !d.adaSiswa ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          Belum ada siswa aktif di kelas {d.kelas}.
        </div>
      ) : (
        <section className="rounded-xl border border-black/10 dark:border-white/15">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 px-5 py-3 dark:border-white/15">
            <h2 className="font-semibold">
              <span className="mr-1">{ikonJurusan(d.kelas)}</span>
              {d.kelas} · {d.baris.length} siswa
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/guru/laporan/cetak-progres-kelas?kelas=${encodeURIComponent(d.kelas)}`}
                className="rounded-lg border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40"
              >
                🖨️ Cetak Progres Sekelas
              </Link>
              {isAdmin && (
                <Link
                  href={`/guru/laporan/cetak-kelas?kelas=${encodeURIComponent(d.kelas)}&semester=${d.semesterId}`}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  🖨️ Cetak Raport Sekelas
                </Link>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr className="border-b border-black/10 dark:border-white/10">
                  <th className="px-4 py-2 font-medium">Nama</th>
                  <th className="px-4 py-2 text-center font-medium">Check Point</th>
                  <th className="px-4 py-2 text-center font-medium">Nilai Akhir</th>
                  <th className="px-4 py-2 font-medium">Klasifikasi</th>
                  <th className="px-4 py-2 text-center font-medium" title="Level SKIBA Math selesai (kumulatif)">
                    SKIBA
                  </th>
                  <th className="px-4 py-2 text-center font-medium" title="Bacaan SKIBACA selesai (kumulatif)">
                    SKIBACA
                  </th>
                  <th className="px-4 py-2 text-center font-medium" title="Aktivitas latihan semester ini">
                    Aktivitas
                  </th>
                </tr>
              </thead>
              <tbody>
                {d.baris.map((b) => (
                  <tr key={b.siswaId} className="border-b border-black/5 dark:border-white/5">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Link
                        href={`/guru/laporan/${b.siswaId}?semester=${d.semesterId}`}
                        className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {b.nama}
                      </Link>
                      <div className="text-xs text-zinc-400">{b.nisn}</div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      {b.cpIkut > 0 ? (
                        <span>
                          {b.cpIkut}/6 <span className="text-xs text-zinc-400">bln</span>
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600">belum</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center font-bold" style={{ color: b.klas?.color }}>
                      {b.cpTotal ?? "—"}
                    </td>
                    <td className="px-4 py-2">
                      {b.klas ? (
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: b.klas.color + "22", color: b.klas.color }}
                        >
                          {b.klas.ic} {b.klas.label}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">{b.skibaLevel}</td>
                    <td className="px-4 py-2 text-center">{b.skibacaBacaan}</td>
                    <td className="px-4 py-2 text-center">{b.aktivitas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
