import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SEKOLAH } from "@/lib/sekolah";
import KeluarStaf from "../keluar-staf";
import UbahSandi from "./ubah-sandi";

export const metadata = { title: "Profil — AngkaSara" };

interface Baris {
  badge: string;
  name: string;
  sub: string;
  href?: string;
  admin?: boolean;
}

const BARIS: Baris[] = [
  { badge: "🏫", name: SEKOLAH.nama, sub: "Instansi" },
  { badge: "👥", name: "Kelola Siswa", sub: "Tambah & impor siswa dari Excel", href: "/guru/siswa", admin: true },
  { badge: "🧑‍🏫", name: "Kelola Guru & Staf", sub: "Impor staf, reset sandi", href: "/guru/staf", admin: true },
  { badge: "🏫", name: "Kelola Kelas", sub: "Aktif/nonaktifkan kelas", href: "/guru/kelas", admin: true },
  { badge: "📊", name: "Evaluasi", sub: "Nilai Check Point per kelas", href: "/guru/evaluasi" },
];

export default async function ProfilPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/masuk?tab=staf&next=/guru/profil");

  const { user } = session;
  const role = (user as { role?: string }).role ?? "GURU";
  const baris = BARIS.filter((b) => !b.admin || role === "ADMIN");

  const rowCls =
    "flex items-center gap-3.5 rounded-[18px] bg-white p-3.5 shadow-[0_8px_22px_-18px_rgba(30,20,60,.4)] ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10";
  const badgeCls =
    "flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-violet-500/10 text-[15px] text-violet-700 dark:text-violet-300";

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 pb-8 pt-6 sm:px-6">
      <section
        className="as-pop rounded-[28px] p-[22px] text-white"
        style={{
          background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
          boxShadow: "0 20px 40px -20px rgba(30,20,60,.5)",
        }}
      >
        <div className="text-[40px]">👤</div>
        <h1 className="mt-2.5 text-2xl font-black">{user.name}</h1>
        <p className="mt-1.5 text-[13px] leading-snug text-white/85">
          {role} · {user.email}
        </p>
      </section>

      <div className="flex flex-col gap-2.5">
        {baris.map((b) =>
          b.href ? (
            <Link key={b.name} href={b.href} className={`as-lift ${rowCls}`}>
              <div className={badgeCls}>{b.badge}</div>
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-sm font-extrabold text-zinc-900 dark:text-zinc-50">{b.name}</p>
                <p className="mt-0.5 text-[11.5px] font-semibold text-zinc-500 dark:text-zinc-400">{b.sub}</p>
              </div>
              <span className="text-base font-extrabold text-zinc-400">›</span>
            </Link>
          ) : (
            <div key={b.name} className={rowCls}>
              <div className={badgeCls}>{b.badge}</div>
              <div className="min-w-0 flex-1">
                <p className="m-0 text-sm font-extrabold text-zinc-900 dark:text-zinc-50">{b.name}</p>
                <p className="mt-0.5 text-[11.5px] font-semibold text-zinc-500 dark:text-zinc-400">{b.sub}</p>
              </div>
            </div>
          ),
        )}

        <UbahSandi />

        <div className={rowCls}>
          <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-red-500/10 text-[15px]">
            🚪
          </div>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-sm font-extrabold text-red-600 dark:text-red-400">Keluar</p>
            <p className="mt-0.5 text-[11.5px] font-semibold text-zinc-500 dark:text-zinc-400">Akhiri sesi</p>
          </div>
          <KeluarStaf />
        </div>
      </div>
    </main>
  );
}
