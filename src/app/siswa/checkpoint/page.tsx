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

export default async function CheckpointPage() {
  const sesi = await sesiSiswa();
  if (!sesi) redirect("/masuk?next=/siswa/checkpoint");

  const period = periodKey();
  const row = await prisma.checkpointResult.findUnique({
    where: { studentId_period: { studentId: sesi.studentId, period } },
  });

  // Sudah dikumpulkan → layar hasil (dirender dari DB, tak bisa diulang bulan ini).
  if (row?.status === "submitted") {
    const prev = await prisma.checkpointResult.findFirst({
      where: { studentId: sesi.studentId, status: "submitted", period: { lt: period } },
      orderBy: { period: "desc" },
    });
    return <Hasil period={period} row={row} prev={prev} />;
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <CheckpointClient namaBulan={namaBulan(period)} sedangKerja={row?.status === "in_progress"} />
    </main>
  );
}

/* ── Layar hasil (server component, presentasi murni) ── */
function Hasil({
  period,
  row,
  prev,
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
