import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import KeluarStaf from "./keluar-staf";

export const metadata = { title: "Dasbor Guru — AngkaSara" };

export default async function GuruPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/masuk?tab=staf&next=/guru");

  const { user } = session;
  const role = (user as { role?: string }).role ?? "GURU";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dasbor Guru</h1>
          <p className="text-sm text-zinc-500">
            {user.name} · {user.email}
          </p>
        </div>
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          {role}
        </span>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {role === "ADMIN" && (
          <Link
            href="/guru/siswa"
            className="rounded-xl border border-black/10 p-6 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-white/15 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
          >
            <h2 className="font-semibold">👥 Kelola Siswa</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Tambah, edit, hapus, dan impor siswa dari Excel.
            </p>
          </Link>
        )}
        {role === "ADMIN" && (
          <Link
            href="/guru/staf"
            className="rounded-xl border border-black/10 p-6 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-white/15 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
          >
            <h2 className="font-semibold">🧑‍🏫 Kelola Guru &amp; Staf</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Impor guru/staf dari Excel (NIP), reset sandi, hapus akun.
            </p>
          </Link>
        )}
        <Link
          href="/guru/evaluasi"
          className="rounded-xl border border-black/10 p-6 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-white/15 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
        >
          <h2 className="font-semibold">📊 Evaluasi</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Nilai Check Point terpusat per kelas & periode, grafik, ekspor.
          </p>
        </Link>
        <Link
          href="/guru/laporan"
          className="rounded-xl border border-black/10 p-6 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-white/15 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
        >
          <h2 className="font-semibold">📄 Laporan Progres</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Progres pengerjaan siswa per kelas & semester, raport siap cetak.
          </p>
        </Link>
        <Link
          href="/guru/peringkat"
          className="rounded-xl border border-black/10 p-6 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-white/15 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
        >
          <h2 className="font-semibold">🏆 Peringkat Gabungan</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Ranking SKIBA Math + SKIBACA: seluruh siswa, per kelas, dan antar kelas.
          </p>
        </Link>
        <Link
          href="/guru/skibaca"
          className="rounded-xl border border-black/10 p-6 transition-colors hover:border-blue-400 hover:bg-blue-50/40 dark:border-white/15 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
        >
          <h2 className="font-semibold">✍️ Nilai Ringkasan SKIBACA</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Nilai ringkasan/parafrase siswa (bacaan 16–20) dengan skor & catatan.
          </p>
        </Link>
      </section>

      <KeluarStaf />
    </main>
  );
}
