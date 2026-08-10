import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { muatTargetKelas, type BarisTargetSiswa } from "@/server/target";
import { persenTarget } from "@/lib/target";
import LingkupBanner from "../lingkup-banner";
import PilihKelas from "./pilih-kelas";

export const metadata = { title: "Target Bulanan — AngkaSara" };

export default async function TargetGuruPage({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/masuk?tab=guru&next=/guru/target");

  const sp = await searchParams;
  const d = await muatTargetKelas({ kelas: sp.kelas });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 px-5 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/guru" className="text-sm text-violet-600 hover:underline dark:text-violet-400">
              ← Dasbor
            </Link>
            <h1 className="text-2xl font-bold">Target Bulanan</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Capaian kumulatif hingga <span className="font-semibold">{d.bulanLabel} 2026</span> · target{" "}
            <span className="font-semibold">{d.targetSkiba} level</span> SKIBA &{" "}
            <span className="font-semibold">{d.targetSkibaca} bacaan</span> SKIBACA.
          </p>
        </div>
        <PilihKelas kelasOpsi={d.kelasOpsi} terpilih={d.kelasTerpilih} />
      </header>

      <LingkupBanner kelas={d.dibatasiKe} />

      {/* Ringkasan */}
      <div className="grid grid-cols-3 gap-3">
        <RingkasKartu emoji="🧮" label={`SKIBA tuntas`} nilai={d.tuntasSkiba} dari={d.total} warna="text-emerald-600 dark:text-emerald-400" />
        <RingkasKartu emoji="📖" label={`SKIBACA tuntas`} nilai={d.tuntasSkibaca} dari={d.total} warna="text-amber-600 dark:text-amber-400" />
        <RingkasKartu emoji="👥" label="Total siswa" nilai={d.total} warna="text-zinc-700 dark:text-zinc-200" />
      </div>

      {d.siswa.length === 0 ? (
        <p className="rounded-2xl border border-black/5 bg-white/60 p-8 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
          Belum ada siswa dalam lingkup ini.
        </p>
      ) : (
        <>
          {/* Tabel (sm ke atas) */}
          <div className="hidden overflow-hidden rounded-2xl border border-black/5 shadow-sm dark:border-white/10 sm:block">
            <table className="w-full text-sm">
              <thead className="bg-black/[0.03] text-left text-xs font-bold uppercase tracking-wide text-zinc-500 dark:bg-white/5 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-2.5">Siswa</th>
                  <th className="px-4 py-2.5">Kelas</th>
                  <th className="px-4 py-2.5">🧮 SKIBA ({d.targetSkiba})</th>
                  <th className="px-4 py-2.5">📖 SKIBACA ({d.targetSkibaca})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/10">
                {d.siswa.map((s) => (
                  <tr key={s.siswaId} className="bg-white/60 dark:bg-white/[0.02]">
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-zinc-800 dark:text-zinc-100">{s.nama}</div>
                      <div className="text-[11px] text-zinc-400">{s.nisn}</div>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400">{s.kelasLabel}</td>
                    <td className="px-4 py-2.5">
                      <SelBar nilai={s.skiba} target={d.targetSkiba} tercapai={s.skibaTercapai} warna="from-emerald-500 to-teal-600" />
                    </td>
                    <td className="px-4 py-2.5">
                      <SelBar nilai={s.skibaca} target={d.targetSkibaca} tercapai={s.skibacaTercapai} warna="from-amber-500 to-orange-600" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Kartu (mobile) */}
          <div className="grid gap-3 sm:hidden">
            {d.siswa.map((s) => (
              <KartuSiswa key={s.siswaId} s={s} targetSkiba={d.targetSkiba} targetSkibaca={d.targetSkibaca} />
            ))}
          </div>
        </>
      )}

      <p className="text-center text-[11px] text-zinc-400">
        Level SKIBA dihitung bila siswa lulus ≥2 bintang; bacaan SKIBACA dihitung setelah kuis. Hitungan kumulatif sejak Agustus 2026.
      </p>
    </main>
  );
}

function RingkasKartu({
  emoji,
  label,
  nilai,
  dari,
  warna,
}: {
  emoji: string;
  label: string;
  nilai: number;
  dari?: number;
  warna: string;
}) {
  return (
    <div className="as-pop rounded-2xl border border-black/5 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="text-xl">{emoji}</div>
      <div className={`mt-1 text-2xl font-black leading-none ${warna}`}>
        {nilai}
        {dari != null && <span className="text-sm font-bold text-zinc-400"> / {dari}</span>}
      </div>
      <div className="mt-1 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">{label}</div>
    </div>
  );
}

function SelBar({ nilai, target, tercapai, warna }: { nilai: number; target: number; tercapai: boolean; warna: string }) {
  const pct = persenTarget(nilai, target);
  return (
    <div className="min-w-[130px]">
      <div className="flex items-center justify-between text-xs">
        <span className="font-black text-zinc-800 dark:text-zinc-100">
          {nilai}
          <span className="font-semibold text-zinc-400"> / {target}</span>
        </span>
        {tercapai ? (
          <span className="font-bold text-emerald-600 dark:text-emerald-400">✅</span>
        ) : (
          <span className="font-semibold text-zinc-400">{pct}%</span>
        )}
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div className={`h-full rounded-full bg-gradient-to-r ${warna}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function KartuSiswa({
  s,
  targetSkiba,
  targetSkibaca,
}: {
  s: BarisTargetSiswa;
  targetSkiba: number;
  targetSkibaca: number;
}) {
  return (
    <div className="as-pop rounded-2xl border border-black/5 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="truncate font-bold text-zinc-800 dark:text-zinc-100">{s.nama}</div>
          <div className="text-[11px] text-zinc-400">
            {s.nisn} · {s.kelasLabel}
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div>
          <div className="mb-1 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">🧮 SKIBA</div>
          <SelBar nilai={s.skiba} target={targetSkiba} tercapai={s.skibaTercapai} warna="from-emerald-500 to-teal-600" />
        </div>
        <div>
          <div className="mb-1 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">📖 SKIBACA</div>
          <SelBar nilai={s.skibaca} target={targetSkibaca} tercapai={s.skibacaTercapai} warna="from-amber-500 to-orange-600" />
        </div>
      </div>
    </div>
  );
}
