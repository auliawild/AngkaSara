import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { muatKalenderSiswa } from "@/server/laporan";
import CetakTombol from "../cetak-tombol";
import CetakWatermark from "../cetak-watermark";
import ProgresSheet from "../progres-sheet";

export const metadata = { title: "Cetak Progres Latihan — AngkaSara" };

export default async function CetakProgresPage({
  searchParams,
}: {
  searchParams: Promise<{ siswaId?: string; bulan?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const sp = await searchParams;
  if (!session) redirect("/masuk?tab=staf&next=/guru/laporan");
  if (!sp.siswaId) redirect("/guru/laporan");

  const d = await muatKalenderSiswa({ siswaId: sp.siswaId, bulan: sp.bulan });
  if (!d) notFound();

  const base = `/guru/laporan/cetak-progres?siswaId=${sp.siswaId}`;

  return (
    <main className="mx-auto flex w-full max-w-[210mm] flex-1 flex-col gap-5 px-6 py-8">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href={`/guru/laporan/${sp.siswaId}`} className="text-blue-600 hover:underline dark:text-blue-400">
            ← {d.nama}
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`${base}&bulan=${d.prev}`}
              className="rounded-lg border border-black/15 px-2.5 py-1 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              ‹ Bln lalu
            </Link>
            <span className="min-w-[110px] text-center font-medium">{d.bulanLabel}</span>
            <Link
              href={`${base}&bulan=${d.next}`}
              className="rounded-lg border border-black/15 px-2.5 py-1 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Bln depan ›
            </Link>
          </div>
        </div>
        <CetakTombol label="🖨️ Cetak Progres" />
      </div>

      <CetakWatermark />
      <ProgresSheet nama={d.nama} nisn={d.nisn} kelasLabel={d.kelasLabel} bulanLabel={d.bulanLabel} kal={d.kal} />
    </main>
  );
}
