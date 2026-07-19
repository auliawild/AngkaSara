import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { ikonJurusan } from "@/lib/kelas";
import { muatPeringkatSekolah } from "@/server/peringkat";
import { susunPeringkat, medali } from "@/lib/peringkat";
import FilterPeringkat from "./filter";
import TabelPeringkat from "./tabel";

export const metadata = { title: "Peringkat — AngkaSara" };

type Lingkup = "sekolah" | "kelas" | "antarkelas";

export default async function PeringkatPage({
  searchParams,
}: {
  searchParams: Promise<{ lingkup?: string; kelas?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/masuk?tab=guru&next=/guru/peringkat");

  const sp = await searchParams;
  const lingkup: Lingkup =
    sp.lingkup === "kelas" || sp.lingkup === "antarkelas" ? sp.lingkup : "sekolah";
  const kelas = sp.kelas ?? "";

  const d = await muatPeringkatSekolah();
  // Peringkat kelas dinomori ulang dalam lingkupnya sendiri (bukan potongan nomor sekolah).
  const barisKelas = kelas ? susunPeringkat(d.siswa.filter((s) => s.kelasLabel === kelas)) : [];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/guru" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              ← Dasbor
            </Link>
            <h1 className="text-2xl font-bold">Peringkat Gabungan</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            SKIBA Math + SKIBACA · {d.siswa.length} siswa · capaian kumulatif
          </p>
        </div>
        <FilterPeringkat kelasOpsi={d.kelasOpsi} lingkup={lingkup} kelas={kelas} />
      </header>

      <p className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
        <b>Cara nilai dihitung:</b> tiap modul bernilai 0–100 dari <b>50% capaian</b> (level SKIBA
        selesai dari 200 · bacaan SKIBACA selesai dari 75) + <b>50% mutu</b> (rata-rata persen benar).
        Nilai akhir = rata-rata kedua modul, jadi numerasi & literasi berbobot sama. Nilai seri
        berbagi peringkat yang sama; yang lebih banyak beraktivitas ditempatkan lebih dulu.
      </p>

      {lingkup === "antarkelas" ? (
        <section className="rounded-xl border border-black/10 dark:border-white/15">
          <div className="border-b border-black/10 px-5 py-3 dark:border-white/15">
            <h2 className="font-semibold">🏆 Peringkat Antar Kelas · {d.kelas.length} kelas</h2>
            <p className="text-xs text-zinc-500">
              Rata-rata memakai <b>seluruh</b> siswa kelas (yang belum pernah berlatih dihitung 0).
            </p>
          </div>
          {/* HP: kartu per kelas (tabel 6 kolom tak terbaca di layar sempit) */}
          <ul className="divide-y divide-black/5 sm:hidden dark:divide-white/5">
            {d.kelas.map((k) => (
              <li key={k.kelasLabel} className="flex items-center gap-3 px-4 py-3">
                <span className="w-9 shrink-0 text-center font-black tabular-nums">
                  {medali(k.peringkat, k.rataNilai) || k.peringkat}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/guru/peringkat?lingkup=kelas&kelas=${encodeURIComponent(k.kelasLabel)}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {ikonJurusan(k.kelasLabel)} {k.kelasLabel}
                  </Link>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    🧮 {k.rataSkiba} · 📖 {k.rataSkibaca} · aktif {k.jumlahAktif}/{k.jumlahSiswa}
                  </div>
                </div>
                <span className="shrink-0 text-lg font-bold tabular-nums">{k.rataNilai}</span>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr className="border-b border-black/10 dark:border-white/10">
                  <th className="px-4 py-2 text-center font-medium">#</th>
                  <th className="px-4 py-2 font-medium">Kelas</th>
                  <th className="px-4 py-2 text-center font-medium">Rata Nilai</th>
                  <th className="px-4 py-2 text-center font-medium">SKIBA</th>
                  <th className="px-4 py-2 text-center font-medium">SKIBACA</th>
                  <th className="px-4 py-2 text-center font-medium" title="Siswa yang sudah pernah berlatih">
                    Aktif
                  </th>
                </tr>
              </thead>
              <tbody>
                {d.kelas.map((k) => (
                  <tr key={k.kelasLabel} className="border-b border-black/5 dark:border-white/5">
                    <td className="px-4 py-2 text-center font-semibold tabular-nums">
                      {medali(k.peringkat, k.rataNilai)} {k.peringkat}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap font-medium">
                      <Link
                        href={`/guru/peringkat?lingkup=kelas&kelas=${encodeURIComponent(k.kelasLabel)}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {ikonJurusan(k.kelasLabel)} {k.kelasLabel}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-center text-base font-bold tabular-nums">{k.rataNilai}</td>
                    <td className="px-4 py-2 text-center tabular-nums">{k.rataSkiba}</td>
                    <td className="px-4 py-2 text-center tabular-nums">{k.rataSkibaca}</td>
                    <td className="px-4 py-2 text-center tabular-nums text-zinc-500">
                      {k.jumlahAktif}/{k.jumlahSiswa}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : lingkup === "kelas" && !kelas ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
          👆 Pilih kelas di atas untuk melihat peringkat siswa di dalam kelas tersebut.
        </div>
      ) : lingkup === "kelas" && barisKelas.length === 0 ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          Belum ada siswa di kelas {kelas}.
        </div>
      ) : (
        <section className="rounded-xl border border-black/10 dark:border-white/15">
          <div className="border-b border-black/10 px-5 py-3 dark:border-white/15">
            <h2 className="font-semibold">
              {lingkup === "kelas" ? (
                <>
                  <span className="mr-1">{ikonJurusan(kelas)}</span>
                  {kelas} · {barisKelas.length} siswa
                </>
              ) : (
                <>🏫 Seluruh Siswa · {d.siswa.length} siswa</>
              )}
            </h2>
          </div>
          <TabelPeringkat
            rows={lingkup === "kelas" ? barisKelas : d.siswa}
            tampilkanKelas={lingkup === "sekolah"}
          />
        </section>
      )}
    </main>
  );
}
