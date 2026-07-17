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
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="text-center">
        <p className="text-sm text-zinc-500">Check Point {namaBulan(period)}</p>
        <h1 className="mt-1 text-3xl font-bold">Selesai! 🎉</h1>
        {row.waktuHabis && <p className="mt-1 text-sm text-amber-600">Waktu habis — jawaban otomatis terkumpul.</p>}
      </header>

      <div className="rounded-2xl border border-black/10 p-6 text-center dark:border-white/15">
        <div className="text-6xl font-black" style={{ color: k.color }}>
          {row.total}
        </div>
        <div className="mt-1 text-lg font-semibold" style={{ color: k.color }}>
          {k.ic} {k.label}
        </div>
        {delta != null && (
          <p className="mt-2 text-sm text-zinc-500">
            {delta > 0 ? `▲ Naik ${delta}` : delta < 0 ? `▼ Turun ${Math.abs(delta)}` : "Sama"} dibanding{" "}
            {namaBulan(prev!.period)} ({prev!.total})
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Kartu judul="Numerasi" nilai={row.numerasi} benar={row.benarNum} total={row.totalNum} />
        <Kartu judul="Literasi" nilai={row.literasi} benar={row.benarLit} total={row.totalLit} />
      </div>

      <p className="text-center text-sm text-zinc-500">
        Durasi pengerjaan {menit}m {detik}d · Check Point berikutnya tersedia bulan depan.
      </p>

      <Link
        href="/siswa"
        className="mx-auto rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
      >
        Kembali ke Beranda
      </Link>
    </main>
  );
}

function Kartu({ judul, nilai, benar, total }: { judul: string; nilai: number; benar: number; total: number }) {
  return (
    <div className="rounded-xl border border-black/10 p-4 text-center dark:border-white/15">
      <div className="text-sm text-zinc-500">{judul}</div>
      <div className="mt-1 text-3xl font-bold">{nilai}</div>
      <div className="text-xs text-zinc-400">
        {benar}/{total} benar
      </div>
    </div>
  );
}
