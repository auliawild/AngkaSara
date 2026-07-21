import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { muatKelolaKelas } from "@/server/kelas";
import KelolaKelasClient from "./kelas-client";

export const metadata = { title: "Kelola Kelas — AngkaSara" };

export default async function KelolaKelasPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/masuk?tab=admin&next=/guru/kelas");
  const role = (session.user as { role?: string }).role ?? "GURU";
  if (role !== "ADMIN") redirect("/guru");

  const d = await muatKelolaKelas();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <header>
        <div className="flex items-center gap-3">
          <Link href="/guru" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            ← Dasbor
          </Link>
          <h1 className="text-2xl font-bold">Kelola Kelas</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Pilih kelas yang <b>aktif dikelola</b>. Kelas nonaktif disembunyikan dari dropdown Evaluasi &amp;
          Laporan, validasi impor siswa, dan hitungan di dasbor. {d.totalAktif} dari {d.totalKelas} kelas aktif.
        </p>
      </header>

      {d.totalSiswaNonaktif > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          ⚠️ Ada <b>{d.totalSiswaNonaktif} siswa</b> di kelas yang saat ini nonaktif. Datanya tetap tersimpan,
          tetapi kelasnya tak muncul di laporan/impor selama nonaktif.
        </div>
      )}

      <KelolaKelasClient items={d.items} />
    </main>
  );
}
