import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { muatRingkasanUntukGuru } from "@/server/skibaca-guru";
import NilaiRingkasanClient from "./nilai-ringkasan-client";

export const metadata = { title: "Nilai Ringkasan SKIBACA — AngkaSara" };

export default async function GuruSkibacaPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/masuk?tab=staf&next=/guru/skibaca");

  const awal = await muatRingkasanUntukGuru("belum");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">✍️ Nilai Ringkasan SKIBACA</h1>
          <p className="text-sm text-zinc-500">
            Bacaan 16–20: siswa menulis parafrase, Anda menilai (skor 0–100 + catatan).
          </p>
        </div>
        <Link
          href="/guru"
          className="shrink-0 rounded-full border border-black/15 px-3 py-1.5 text-sm font-semibold hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          ← Dasbor
        </Link>
      </header>

      <NilaiRingkasanClient awal={awal} />
    </main>
  );
}
