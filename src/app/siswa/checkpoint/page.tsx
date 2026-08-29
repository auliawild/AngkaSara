import { redirect } from "next/navigation";
import Link from "next/link";
import { sesiSiswa } from "@/server/student-auth";
import { prisma } from "@/lib/db";
import { periodKey, klasifikasi, BULAN_PANJANG } from "@/lib/kelas";
import CheckpointClient from "./checkpoint-client";

export const metadata = { title: "Check Point — AngkaSara" };

function namaBulan(period: string): string {
  const [th, bl] = period.split("-");
  return `${BULAN_PANJANG[Number(bl) - 1]} ${th}`;
}

export default async function CheckpointPage({
  searchParams,
}: {
  searchParams: Promise<{ susulan?: string }>;
}) {
  const sesi = await sesiSiswa();
  if (!sesi) redirect("/masuk?next=/siswa/checkpoint");
  const sp = await searchParams;

  const period = periodKey();

  // Check Point SUSULAN yang dibuka admin: baris in_progress untuk bulan yang sudah lewat.
  const susulanRows = await prisma.checkpointResult.findMany({
    where: { studentId: sesi.studentId, status: "in_progress", period: { lt: period } },
    orderBy: { period: "asc" },
    select: { period: true },
  });
  const susulanPeriods = susulanRows.map((r) => r.period);

  // Mode kerjakan susulan aktif (?susulan=YYYY-MM), hanya bila benar-benar terbuka.
  if (sp.susulan && susulanPeriods.includes(sp.susulan)) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-10">
        <Link href="/siswa/checkpoint" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          ← Check Point
        </Link>
        <CheckpointClient namaBulan={namaBulan(sp.susulan)} sedangKerja period={sp.susulan} susulan />
      </main>
    );
  }

  const row = await prisma.checkpointResult.findUnique({
    where: { studentId_period: { studentId: sesi.studentId, period } },
  });

  // Sudah dikumpulkan → layar hasil (dirender dari DB, tak bisa diulang bulan ini).
  if (row?.status === "submitted") {
    const prev = await prisma.checkpointResult.findFirst({
      where: { studentId: sesi.studentId, status: "submitted", period: { lt: period } },
      orderBy: { period: "desc" },
    });
    return <Hasil period={period} row={row} prev={prev} susulanPeriods={susulanPeriods} />;
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <CheckpointClient namaBulan={namaBulan(period)} sedangKerja={row?.status === "in_progress"} />
      <SusulanList periods={susulanPeriods} />
    </main>
  );
}

/** Daftar Check Point susulan (bulan terlewat) yang dibuka admin. */
function SusulanList({ periods }: { periods: string[] }) {
  if (periods.length === 0) return null;
  return (
    <section className="rounded-2xl border border-amber-300/60 bg-amber-50/70 p-4 dark:border-amber-800/50 dark:bg-amber-950/20">
      <h2 className="flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-200">
        📅 Check Point Susulan
      </h2>
      <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/80">
        Kamu diberi kesempatan mengerjakan Check Point bulan yang terlewat. Nilai tersimpan di bulan itu.
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {periods.map((p) => (
          <Link
            key={p}
            href={`/siswa/checkpoint?susulan=${p}`}
            className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm font-semibold text-amber-800 shadow-sm ring-1 ring-amber-200 hover:bg-amber-50 dark:bg-white/10 dark:text-amber-100 dark:ring-amber-800"
          >
            <span>Check Point {namaBulan(p)}</span>
            <span className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-bold text-white">Kerjakan →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── Layar hasil (server component, presentasi murni) ── */
function Hasil({
  period,
  row,
  prev,
  susulanPeriods = [],
}: {
  period: string;
  row: {
    numerasi: number;
    literasi: number;
    total: number;
    benarNum: number;
    totalNum: number;
    benarLit: number;
    totalLit: number;
    durasiDetik: number;
    waktuHabis: boolean;
  };
  prev: { total: number; period: string } | null;
  susulanPeriods?: string[];
}) {
  const k = klasifikasi(row.total);
  const delta = prev ? row.total - prev.total : null;
  const menit = Math.floor(row.durasiDetik / 60);
  const detik = row.durasiDetik % 60;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 py-8 sm:py-10">
      {/* hero hasil — warna mengikuti klasifikasi */}
      <div
        className="as-pop relative overflow-hidden rounded-3xl p-7 text-center text-white shadow-xl"
        style={{ background: `linear-gradient(140deg, ${k.color}, ${k.color}cc)` }}
      >
        <div aria-hidden className="absolute -right-4 -top-5 text-8xl opacity-20 as-float select-none">{k.ic}</div>
        <p className="relative text-sm font-medium text-white/80">Check Point {namaBulan(period)}</p>
        <h1 className="relative mt-1 text-2xl font-black">Selesai! 🎉</h1>
        <div className="relative mt-3 text-7xl font-black leading-none as-float">{row.total}</div>
        <div className="relative mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1 text-sm font-bold ring-1 ring-white/30 backdrop-blur">
          {k.ic} {k.label}
        </div>
        {delta != null && (
          <p className="relative mt-3 text-sm font-medium text-white/85">
            {delta > 0 ? `▲ Naik ${delta}` : delta < 0 ? `▼ Turun ${Math.abs(delta)}` : "Sama"} dibanding{" "}
            {namaBulan(prev!.period)} ({prev!.total})
          </p>
        )}
        {row.waktuHabis && <p className="relative mt-2 text-xs text-white/80">⏱️ Waktu habis — jawaban otomatis terkumpul.</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Kartu judul="🔢 Numerasi" nilai={row.numerasi} benar={row.benarNum} total={row.totalNum} />
        <Kartu judul="📖 Literasi" nilai={row.literasi} benar={row.benarLit} total={row.totalLit} />
      </div>

      <p className="text-center text-sm text-zinc-500">
        Durasi pengerjaan {menit}m {detik}d · Check Point berikutnya tersedia bulan depan. 🌟
      </p>

      <SusulanList periods={susulanPeriods} />

      <Link
        href="/siswa"
        className="mx-auto rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-2.5 font-bold text-white shadow-lg shadow-violet-600/25 transition-transform hover:scale-105"
      >
        Kembali ke Beranda
      </Link>
    </main>
  );
}

function Kartu({ judul, nilai, benar, total }: { judul: string; nilai: number; benar: number; total: number }) {
  return (
    <div className="as-pop rounded-2xl border border-black/5 bg-white/70 p-4 text-center shadow-sm dark:border-white/10 dark:bg-white/10">
      <div className="text-sm text-zinc-500">{judul}</div>
      <div className="mt-1 text-3xl font-black">{nilai}</div>
      <div className="text-xs text-zinc-400">
        {benar}/{total} benar
      </div>
    </div>
  );
}
