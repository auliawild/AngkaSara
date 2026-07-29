import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { urutkanKelas, ikonJurusan, periodKey, BULAN_PANJANG } from "@/lib/kelas";
import { MAX_DIAG_ATTEMPTS } from "@/lib/skiba";
import SiswaTabel from "./siswa-tabel";
import ImporPanel from "./impor-panel";

export const metadata = { title: "Kelola Siswa — AngkaSara" };

export default async function KelolaSiswaPage({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/masuk?tab=admin&next=/guru/siswa");
  const role = (session.user as { role?: string }).role ?? "GURU";
  if (role !== "ADMIN") redirect("/guru");

  const kelasList = await prisma.kelas.findMany({
    select: { id: true, label: true, aktif: true, _count: { select: { students: true } } },
  });
  kelasList.sort((a, b) => urutkanKelas(a.label, b.label));
  const totalSiswa = kelasList.reduce((s, k) => s + k._count.students, 0);
  const kelasOpsi = kelasList.map((k) => ({ id: k.id, label: k.label }));

  const sp = await searchParams;
  const selectedId =
    sp.kelas && kelasList.some((k) => k.id === sp.kelas) ? sp.kelas : kelasList[0]?.id;
  const selected = kelasList.find((k) => k.id === selectedId) ?? null;

  const siswaRows = selectedId
    ? await prisma.student.findMany({
        where: { kelasId: selectedId },
        orderBy: { nama: "asc" },
        select: {
          id: true,
          nisn: true,
          nama: true,
          aktif: true,
          kelasId: true,
          skibaProfile: { select: { diagAttempts: true } },
        },
      })
    : [];

  // Status Check Point periode berjalan untuk siswa kelas terpilih (buka-kesempatan).
  const period = periodKey();
  const cpRows = siswaRows.length
    ? await prisma.checkpointResult.findMany({
        where: { studentId: { in: siswaRows.map((s) => s.id) }, period },
        select: { studentId: true, status: true },
      })
    : [];
  const cpByStudent = new Map(cpRows.map((r) => [r.studentId, r.status]));
  const [thP, blP] = period.split("-").map(Number);
  const periodeLabel = `${BULAN_PANJANG[(blP ?? 1) - 1] ?? ""} ${thP ?? ""}`.trim();

  const siswa = siswaRows.map((s) => ({
    id: s.id,
    nisn: s.nisn,
    nama: s.nama,
    aktif: s.aktif,
    kelasId: s.kelasId,
    diagTerpakai: s.skibaProfile?.diagAttempts ?? 0,
    cpStatus: (cpByStudent.get(s.id) ?? null) as "in_progress" | "submitted" | null,
  }));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/guru" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              ← Dasbor
            </Link>
            <h1 className="text-2xl font-bold">Kelola Siswa</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {totalSiswa.toLocaleString("id-ID")} siswa · {kelasList.length} kelas
          </p>
        </div>
      </header>

      <ImporPanel />

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        {/* Daftar kelas */}
        <nav className="flex max-h-[70vh] flex-col gap-0.5 overflow-y-auto rounded-xl border border-black/10 p-2 dark:border-white/15">
          {kelasList.map((k) => {
            const aktif = k.id === selectedId;
            return (
              <Link
                key={k.id}
                href={`/guru/siswa?kelas=${k.id}`}
                className={
                  "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors " +
                  (aktif
                    ? "bg-blue-600 text-white"
                    : "hover:bg-black/5 dark:hover:bg-white/10")
                }
              >
                <span className="truncate">
                  <span className="mr-1">{ikonJurusan(k.label)}</span>
                  {k.label}
                  {!k.aktif && (
                    <span className={"ml-1.5 text-[10px] font-semibold " + (aktif ? "text-white/70" : "text-amber-600 dark:text-amber-400")}>
                      nonaktif
                    </span>
                  )}
                </span>
                <span
                  className={
                    "shrink-0 rounded-full px-1.5 text-xs " +
                    (aktif ? "bg-white/20" : "bg-black/10 dark:bg-white/15")
                  }
                >
                  {k._count.students}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Tabel siswa kelas terpilih */}
        {selected ? (
          <SiswaTabel
            kelas={{ id: selected.id, label: selected.label }}
            siswa={siswa}
            kelasOpsi={kelasOpsi}
            diagMaks={MAX_DIAG_ATTEMPTS}
            periodeLabel={periodeLabel}
          />
        ) : (
          <p className="text-sm text-zinc-500">Belum ada kelas. Jalankan seed terlebih dahulu.</p>
        )}
      </div>
    </main>
  );
}
