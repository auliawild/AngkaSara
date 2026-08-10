import { redirect } from "next/navigation";
import Link from "next/link";
import { sesiSiswa } from "@/server/student-auth";
import { muatTargetSiswa } from "@/server/target";
import { persenTarget, type BarisTarget } from "@/lib/target";

export const metadata = { title: "Target Bulanan — AngkaSara" };

export default async function TargetSiswaPage() {
  const sesi = await sesiSiswa();
  if (!sesi) redirect("/masuk?next=/siswa/target");

  const { rekap } = await muatTargetSiswa();
  const kini = rekap.baris[rekap.idxKini];

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="as-blob absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl dark:bg-emerald-600/15" />
        <div className="as-blob absolute -right-20 top-40 h-72 w-72 rounded-full bg-amber-400/25 blur-3xl dark:bg-amber-600/15" style={{ animationDelay: "3s" }} />
      </div>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 py-8 sm:py-10">
        <div className="flex items-center gap-3">
          <Link href="/siswa" className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
            ← Beranda
          </Link>
        </div>

        {/* HERO — bulan berjalan */}
        <section className="as-pop relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl shadow-violet-600/20">
          <div aria-hidden className="absolute -right-6 -top-8 text-8xl opacity-20 as-float select-none">🎯</div>
          <div className="relative">
            <p className="text-sm font-medium text-white/80">Target Bulanan · {kini.label} 2026</p>
            <h1 className="mt-0.5 text-2xl font-black tracking-tight">Ayo capai targetmu!</h1>
            <p className="mt-1 text-xs text-white/70">
              Target kumulatif: kumpulkan hingga akhir {kini.label}. Boleh lebih — yang penting tercapai. 💪
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <HeroStat emoji="🧮" judul="SKIBA Math" nilai={kini.skiba} target={kini.targetSkiba} satuan="level" tercapai={kini.skibaTercapai} />
              <HeroStat emoji="📖" judul="SKIBACA" nilai={kini.skibaca} target={kini.targetSkibaca} satuan="bacaan" tercapai={kini.skibacaTercapai} />
            </div>
          </div>
        </section>

        {/* RINCIAN 4 BULAN */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100">Rincian per bulan</h2>
          {rekap.baris.map((b) => (
            <BulanKartu key={b.bulan} b={b} />
          ))}
        </section>

        <p className="text-center text-[11px] text-zinc-400">
          Level SKIBA dihitung bila kamu menang minimal ⭐⭐ (2 bintang). Bacaan SKIBACA dihitung setelah kuis dikerjakan.
        </p>
      </main>
    </div>
  );
}

function HeroStat({
  emoji,
  judul,
  nilai,
  target,
  satuan,
  tercapai,
}: {
  emoji: string;
  judul: string;
  nilai: number;
  target: number;
  satuan: string;
  tercapai: boolean;
}) {
  const pct = persenTarget(nilai, target);
  return (
    <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white/90">
          {emoji} {judul}
        </span>
        {tercapai && <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-black">✅ Tercapai</span>}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-2xl font-black leading-none">{nilai}</span>
        <span className="text-xs font-semibold text-white/70">/ {target} {satuan}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
        <div className="h-full rounded-full bg-white/90" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function BulanKartu({ b }: { b: BulanTarget }) {
  const tanda = b.berjalan ? { teks: "Bulan ini", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" }
    : b.lewat ? { teks: "Selesai", cls: "bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400" }
    : { teks: "Mendatang", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" };
  return (
    <div className={`as-pop rounded-2xl border p-4 shadow-sm backdrop-blur ${b.berjalan ? "border-indigo-300 bg-white/80 dark:border-indigo-500/40 dark:bg-white/10" : "border-black/5 bg-white/60 dark:border-white/10 dark:bg-white/5"}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black text-zinc-800 dark:text-zinc-100">{b.label} 2026</h3>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tanda.cls}`}>{tanda.teks}</span>
      </div>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
        <Bar emoji="🧮" nilai={b.skiba} target={b.targetSkiba} satuan="level" tercapai={b.skibaTercapai} warna="from-emerald-500 to-teal-600" />
        <Bar emoji="📖" nilai={b.skibaca} target={b.targetSkibaca} satuan="bacaan" tercapai={b.skibacaTercapai} warna="from-amber-500 to-orange-600" />
      </div>
    </div>
  );
}

function Bar({
  emoji,
  nilai,
  target,
  satuan,
  tercapai,
  warna,
}: {
  emoji: string;
  nilai: number;
  target: number;
  satuan: string;
  tercapai: boolean;
  warna: string;
}) {
  const pct = persenTarget(nilai, target);
  return (
    <div className="rounded-xl bg-black/[0.03] p-2.5 dark:bg-white/5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-zinc-600 dark:text-zinc-300">{emoji}</span>
        <span className="font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="font-black text-zinc-800 dark:text-zinc-100">{nilai}</span> / {target} {satuan}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div className={`h-full rounded-full bg-gradient-to-r ${warna}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-right text-[10px] font-bold">
        {tercapai ? <span className="text-emerald-600 dark:text-emerald-400">✅ Tercapai</span> : <span className="text-zinc-400">belum ({pct}%)</span>}
      </div>
    </div>
  );
}

type BulanTarget = BarisTarget;
