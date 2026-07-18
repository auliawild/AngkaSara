import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { muatRaportKelas } from "@/server/laporan";
import { ikonJurusan } from "@/lib/kelas";
import CetakTombol from "../cetak-tombol";
import RaportSheet from "../raport-sheet";
import { TandaTanganProvider, PanelTandaTangan } from "../tanda-tangan";

export const metadata = { title: "Cetak Raport Sekelas — AngkaSara" };

export default async function CetakKelasPage({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string; semester?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/masuk?tab=admin&next=/guru/laporan");
  const isAdmin = ((session.user as { role?: string }).role ?? "GURU") === "ADMIN";
  if (!isAdmin) redirect("/guru/laporan");

  const sp = await searchParams;
  if (!sp.kelas) redirect("/guru/laporan");
  const d = await muatRaportKelas({ kelas: sp.kelas, semester: sp.semester });
  if (!d) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-6 py-8">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/guru/laporan?kelas=${encodeURIComponent(d.kelas)}&semester=${d.semesterId}`}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Daftar {d.kelas}
          </Link>
          <h1 className="mt-1 text-xl font-bold">
            <span className="mr-1">{ikonJurusan(d.kelas)}</span>
            Cetak Raport Sekelas — {d.kelas}
          </h1>
          <p className="text-sm text-zinc-500">
            {d.daftar.length} siswa · {d.semesterLabel} · tiap siswa 1 halaman
          </p>
        </div>
        <CetakTombol />
      </div>

      {d.daftar.length === 0 ? (
        <p className="no-print rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          Belum ada siswa aktif di kelas {d.kelas}.
        </p>
      ) : (
        <TandaTanganProvider>
          <PanelTandaTangan />
          {d.daftar.map((x) => (
            <RaportSheet key={x.id} r={x.raport} semesterLabel={d.semesterLabel} />
          ))}
        </TandaTanganProvider>
      )}
    </main>
  );
}
