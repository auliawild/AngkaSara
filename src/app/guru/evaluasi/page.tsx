import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { muatEvaluasi } from "@/server/evaluasi";
import LingkupBanner from "../lingkup-banner";
import { ikonJurusan } from "@/lib/kelas";
import FilterEvaluasi from "./filter";
import Grafik from "./grafik";

export const metadata = { title: "Evaluasi — AngkaSara" };

const CHIP_MAKS = 60;

export default async function EvaluasiPage({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string; period?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/masuk?tab=staf&next=/guru/evaluasi");

  const sp = await searchParams;
  const d = await muatEvaluasi({ kelas: sp.kelas, period: sp.period });
  const eksporQS = `?kelas=${encodeURIComponent(d.kelas)}&period=${d.period}`;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/guru" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              ← Dasbor
            </Link>
            <h1 className="text-2xl font-bold">Evaluasi</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Data terpusat dari server —{" "}
            {d.kelas === "all" ? (d.dibatasiKe ? "kelas yang ditugaskan" : "seluruh kelas") : d.kelas} · {d.namaBulan}
          </p>
        </div>
        <div className="print:hidden">
          <FilterEvaluasi kelasOpsi={d.kelasOpsi} periodeOpsi={d.periodeOpsi} kelas={d.kelas} period={d.period} />
        </div>
      </header>

      <LingkupBanner kelas={d.dibatasiKe} />

      {!d.adaData && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          Belum ada Check Point yang dikumpulkan. Angka akan muncul setelah siswa mengerjakan.
        </div>
      )}

      {/* Ringkasan */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Siswa" nilai={d.ringkas.jumlah} />
        <Tile label="Sudah Check Point" nilai={d.ringkas.ikut} warna="#4f9c6a" />
        <Tile label="Belum" nilai={d.ringkas.belum} warna={d.ringkas.belum > 0 ? "#d1704f" : undefined} />
        <Tile
          label={d.ringkas.klas ? d.ringkas.klas.label : "Rata Nilai"}
          nilai={d.ringkas.total ?? "—"}
          warna={d.ringkas.klas?.color}
        />
      </section>
      <section className="grid grid-cols-2 gap-3">
        <Tile label="Rata Numerasi" nilai={d.ringkas.numerasi ?? "—"} warna="#2563eb" />
        <Tile label="Rata Literasi" nilai={d.ringkas.literasi ?? "—"} warna="#e8935f" />
      </section>

      {/* Grafik perkembangan */}
      <section className="rounded-xl border border-black/10 p-5 dark:border-white/15">
        <h2 className="font-semibold">📈 Perkembangan Nilai Check Point</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {d.kelas === "all" ? "Rata-rata seluruh siswa" : `Kelas ${d.kelas}`} per bulan. Kesulitan soal antar bulan
          setara — grafik naik berarti kemajuan nyata.
        </p>
        <div className="mt-3">
          <Grafik data={d.perkembangan} />
        </div>
      </section>

      {/* Notifikasi belum Check Point */}
      <section className="rounded-xl border border-black/10 p-5 dark:border-white/15">
        <h2 className="font-semibold">🔔 Belum Check Point — {d.namaBulan}</h2>
        {d.belum.length === 0 ? (
          <p className="mt-2 text-sm text-green-600">
            🎉 Semua {d.ringkas.jumlah} siswa {d.kelas === "all" ? "" : `di ${d.kelas} `}sudah mengerjakan bulan ini.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-zinc-500">
              {d.belum.length} siswa belum mengerjakan
              {d.kelas === "all" ? (d.dibatasiKe ? " (kelas yang ditugaskan)" : " (semua kelas)") : ""}.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {d.belum.slice(0, CHIP_MAKS).map((s, i) => (
                <span
                  key={i}
                  className="rounded-full bg-black/5 px-2.5 py-1 text-xs dark:bg-white/10"
                  title={s.kelasLabel}
                >
                  {s.nama}
                  {d.kelas === "all" && <span className="text-zinc-400"> · {s.kelasLabel}</span>}
                </span>
              ))}
              {d.belum.length > CHIP_MAKS && (
                <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs text-zinc-500 dark:bg-white/10">
                  +{d.belum.length - CHIP_MAKS} lagi
                </span>
              )}
            </div>
          </>
        )}
      </section>

      {/* Rekap semua kelas */}
      <section className="rounded-xl border border-black/10 dark:border-white/15">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 px-5 py-3 dark:border-white/15">
          <h2 className="font-semibold">
            🗂️ Rekap {d.dibatasiKe ? "Kelas Anda" : "Semua Kelas"} — {d.namaBulan}
          </h2>
          <div className="flex gap-2 text-sm print:hidden">
            <a href={`/guru/evaluasi/export${eksporQS}&format=csv`} className="rounded-lg border border-black/15 px-3 py-1.5 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
              ⬇ CSV
            </a>
            <a href={`/guru/evaluasi/export${eksporQS}&format=xlsx`} className="rounded-lg border border-black/15 px-3 py-1.5 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
              ⬇ Excel
            </a>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr className="border-b border-black/10 dark:border-white/10">
                <th className="px-4 py-2 font-medium">Kelas</th>
                <th className="px-4 py-2 text-center font-medium">Ikut / Siswa</th>
                <th className="px-4 py-2 text-center font-medium">Numerasi</th>
                <th className="px-4 py-2 text-center font-medium">Literasi</th>
                <th className="px-4 py-2 text-center font-medium">Nilai Akhir</th>
                <th className="px-4 py-2 font-medium">Klasifikasi</th>
              </tr>
            </thead>
            <tbody>
              {d.rekap.map((r) => (
                <tr key={r.kelasLabel} className="border-b border-black/5 dark:border-white/5">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className="mr-1">{ikonJurusan(r.kelasLabel)}</span>
                    {r.kelasLabel}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {r.ikut}/{r.jumlah}
                    {r.belum > 0 && <span className="text-xs text-amber-600"> ({r.belum} belum)</span>}
                  </td>
                  <td className="px-4 py-2 text-center font-semibold text-blue-600">{r.numerasi ?? "—"}</td>
                  <td className="px-4 py-2 text-center font-semibold" style={{ color: "#c9723f" }}>
                    {r.literasi ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-center font-bold" style={{ color: r.klas?.color }}>
                    {r.total ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    {r.klas ? (
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: r.klas.color + "22", color: r.klas.color }}
                      >
                        {r.klas.ic} {r.klas.label}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Tile({ label, nilai, warna }: { label: string; nilai: number | string; warna?: string }) {
  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/15">
      <div className="text-2xl font-bold" style={warna ? { color: warna } : undefined}>
        {nilai}
      </div>
      <div className="mt-0.5 text-xs text-zinc-500">{label}</div>
    </div>
  );
}
