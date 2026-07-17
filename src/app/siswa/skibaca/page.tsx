import { redirect } from "next/navigation";
import Link from "next/link";
import { sesiSiswa } from "@/server/student-auth";
import { muatRingkasanJurusan } from "@/server/skibaca";
import SkibacaClient from "./skibaca-client";

export const metadata = { title: "SKIBACA — AngkaSara" };

export default async function SkibacaPage() {
  const sesi = await sesiSiswa();
  if (!sesi) redirect("/masuk?next=/siswa/skibaca");
  const jurusan = await muatRingkasanJurusan();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📖 SKIBACA</h1>
          <p className="text-sm text-zinc-500">Latihan membaca · {sesi.nama.split(" ")[0]}</p>
        </div>
        <Link
          href="/siswa"
          className="rounded-lg border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          ← Beranda
        </Link>
      </header>
      <SkibacaClient jurusanAwal={jurusan} />
    </main>
  );
}
