import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { TOPICS } from "@/lib/soal-numerasi";
import { simContohBacaan } from "@/server/simulasi";
import SimulasiClient from "./simulasi-client";

export const metadata = { title: "Simulasi Modul — AngkaSara" };

export default async function SimulasiPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/masuk?tab=staf&next=/guru/simulasi");

  const bacaan = await simContohBacaan(4);
  const topik = TOPICS.map((t) => ({ id: t.id, name: t.name, icon: t.icon }));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-5 py-10">
      <header>
        <div className="flex items-center gap-3">
          <Link href="/guru" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            ← Dasbor
          </Link>
          <h1 className="text-2xl font-bold">🧪 Simulasi Modul</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Coba SKIBA Math &amp; SKIBACA seperti siswa — untuk mengenal modul. Hasil tidak tersimpan ke basis
          data dan tidak masuk peringkat siswa.
        </p>
      </header>

      <SimulasiClient topik={topik} bacaan={bacaan} />
    </main>
  );
}
