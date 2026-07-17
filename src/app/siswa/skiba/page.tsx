import { redirect } from "next/navigation";
import Link from "next/link";
import { sesiSiswa } from "@/server/student-auth";
import { muatSkiba } from "@/server/skiba";
import SkibaClient from "./skiba-client";

export const metadata = { title: "SKIBA Math — AngkaSara" };

export default async function SkibaPage() {
  const sesi = await sesiSiswa();
  if (!sesi) redirect("/masuk?next=/siswa/skiba");
  const data = await muatSkiba();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🧮 SKIBA Math</h1>
          <p className="text-sm text-zinc-500">Latihan numerasi · {sesi.nama.split(" ")[0]}</p>
        </div>
        <Link
          href="/siswa"
          className="rounded-lg border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          ← Beranda
        </Link>
      </header>
      <SkibaClient awal={data} />
    </main>
  );
}
