import { redirect } from "next/navigation";
import Link from "next/link";
import { sesiSiswa } from "@/server/student-auth";
import { prisma } from "@/lib/db";
import { periodKey, klasifikasi, BULAN_PANJANG } from "@/lib/kelas";
import KeluarSiswa from "./keluar-siswa";

export const metadata = { title: "Beranda Siswa — AngkaSara" };

export default async function SiswaPage() {
  const sesi = await sesiSiswa();
  if (!sesi) redirect("/masuk?next=/siswa");

  const period = periodKey();
  const cp = await prisma.checkpointResult.findUnique({
    where: { studentId_period: { studentId: sesi.studentId, period } },
    select: { status: true, total: true },
  });
  const bulan = BULAN_PANJANG[Number(period.split("-")[1]) - 1];
  const sudah = cp?.status === "submitted";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Halo, {sesi.nama.split(" ")[0]}!</h1>
          <p className="text-sm text-zinc-500">
            {sesi.kelasLabel} · NISN {sesi.nisn}
          </p>
        </div>
      </header>

      <Link
        href="/siswa/checkpoint"
        className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 p-6 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-white/15 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
      >
        <div>
          <h2 className="text-lg font-semibold">📋 Check Point {bulan}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {sudah
              ? "Sudah dikerjakan bulan ini — lihat hasilmu."
              : cp?.status === "in_progress"
                ? "Sedang berlangsung — lanjutkan pengerjaan."
                : "20 soal numerasi + 15 literasi · 30 menit."}
          </p>
        </div>
        {sudah ? (
          <span
            className="shrink-0 rounded-full px-3 py-1 text-sm font-bold text-white"
            style={{ backgroundColor: klasifikasi(cp!.total).color }}
          >
            {cp!.total}
          </span>
        ) : (
          <span className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
            {cp?.status === "in_progress" ? "Lanjutkan" : "Mulai"}
          </span>
        )}
      </Link>

      <Link
        href="/siswa/skiba"
        className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 p-6 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-white/15 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
      >
        <div>
          <h2 className="text-lg font-semibold">🧮 SKIBA Math</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Latihan numerasi: tes diagnostik, arena 10 topik × 20 level, papan peringkat.
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
          Berlatih
        </span>
      </Link>

      <KeluarSiswa />
    </main>
  );
}
