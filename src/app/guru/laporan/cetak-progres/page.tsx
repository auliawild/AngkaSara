import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { muatProgresCetakSiswa, KET_MODE } from "@/server/laporan";
import { BUCKET_NAMA, type BucketMode } from "@/lib/kelas";
import CetakTombol from "../cetak-tombol";
import CetakWatermark from "../cetak-watermark";
import ProgresSheet from "../progres-sheet";

export const metadata = { title: "Cetak Progres Latihan — AngkaSara" };

const MODES: BucketMode[] = ["hari", "minggu", "bulan"];

export default async function CetakProgresPage({
  searchParams,
}: {
  searchParams: Promise<{ siswaId?: string; mode?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const sp = await searchParams;
  if (!session) redirect("/masuk?tab=staf&next=/guru/laporan");
  if (!sp.siswaId) redirect("/guru/laporan");

  const d = await muatProgresCetakSiswa({ siswaId: sp.siswaId, mode: sp.mode });
  if (!d) notFound();

  const base = `/guru/laporan/cetak-progres?siswaId=${sp.siswaId}`;

  return (
    <main className="mx-auto flex w-full max-w-[210mm] flex-1 flex-col gap-5 px-6 py-8">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/guru/laporan/${sp.siswaId}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            ← {d.nama}
          </Link>
          <div className="flex gap-1 rounded-lg bg-black/5 p-1 text-sm dark:bg-white/10">
            {MODES.map((m) => (
              <Link
                key={m}
                href={`${base}&mode=${m}`}
                className={
                  "rounded-md px-3 py-1 transition-colors " +
                  (d.mode === m
                    ? "bg-white font-medium shadow-sm dark:bg-zinc-700"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200")
                }
              >
                {BUCKET_NAMA[m]}
              </Link>
            ))}
          </div>
        </div>
        <CetakTombol label="🖨️ Cetak Progres" />
      </div>

      <CetakWatermark />
      <ProgresSheet
        nama={d.nama}
        nisn={d.nisn}
        kelasLabel={d.kelasLabel}
        prog={d.prog}
        modeLabel={BUCKET_NAMA[d.mode]}
        ket={KET_MODE[d.mode]}
      />
    </main>
  );
}
