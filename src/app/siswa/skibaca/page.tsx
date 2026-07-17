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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-8 sm:py-10">
      <header className="as-pop relative flex items-center justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-5 text-white shadow-lg shadow-orange-500/20">
        <div aria-hidden className="absolute -right-3 -top-4 text-7xl opacity-20 as-float select-none">📖</div>
        <div className="relative">
          <h1 className="text-2xl font-black">SKIBACA</h1>
          <p className="text-sm text-white/80">Latihan membaca · {sesi.nama.split(" ")[0]} 📚</p>
        </div>
        <Link
          href="/siswa"
          className="relative rounded-full bg-white/20 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/30 backdrop-blur transition-colors hover:bg-white/30"
        >
          ← Beranda
        </Link>
      </header>
      <SkibacaClient jurusanAwal={jurusan} />
    </main>
  );
}
