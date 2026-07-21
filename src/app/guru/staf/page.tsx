import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { urutkanKelas } from "@/lib/kelas";
import ImporStafPanel from "./impor-staf-panel";
import TambahAdmin from "./tambah-admin";
import StafTabel from "./staf-tabel";

export const metadata = { title: "Kelola Guru & Staf — AngkaSara" };

export default async function KelolaStafPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/masuk?tab=admin&next=/guru/staf");
  const role = (session.user as { role?: string }).role ?? "GURU";
  if (role !== "ADMIN") redirect("/guru");

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, nip: true, role: true, kelasDinilai: { select: { id: true } } },
  });
  const jumlahGuru = users.filter((u) => u.role !== "ADMIN").length;

  const kelasRows = await prisma.kelas.findMany({ select: { id: true, label: true, tingkat: true } });
  const kelasOpsi = kelasRows.sort((a, b) => urutkanKelas(a.label, b.label));

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <header>
        <div className="flex items-center gap-3">
          <Link href="/guru" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            ← Dasbor
          </Link>
          <h1 className="text-2xl font-bold">Kelola Guru &amp; Staf</h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          {jumlahGuru} guru · {users.length} akun total · khusus Admin
        </p>
      </header>

      <ImporStafPanel />

      <TambahAdmin kelasOpsi={kelasOpsi} />

      <StafTabel
        kelasOpsi={kelasOpsi}
        data={users.map((u) => ({
          id: u.id,
          nama: u.name,
          nip: u.nip,
          role: u.role,
          kelasIds: u.kelasDinilai.map((k) => k.id),
        }))}
      />
    </main>
  );
}
