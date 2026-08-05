import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { muatPantauan } from "@/server/pantau";
import { ikonJurusan } from "@/lib/kelas";
import type { StatusKehadiran } from "@/lib/pantau";
import LingkupBanner from "../lingkup-banner";
import PilihKelas from "./pilih-kelas";
import AutoRefresh from "./auto-refresh";

export const metadata = { title: "Pantauan Harian — AngkaSara" };
export const dynamic = "force-dynamic"; // selalu data terbaru (status online)

const GAYA_STATUS: Record<StatusKehadiran, { dot: string; teks: string; label: string }> = {
  online: { dot: "bg-green-500", teks: "text-green-600 dark:text-green-400", label: "Online" },
  baru: { dot: "bg-amber-500", teks: "text-amber-600 dark:text-amber-400", label: "Baru aktif" },
  lama: { dot: "bg-zinc-300 dark:bg-zinc-600", teks: "text-zinc-400", label: "Offline" },
};

export default async function PantauPage({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/masuk?tab=staf&next=/guru/pantau");

  const sp = await searchParams;
  const d = await muatPantauan({ kelas: sp.kelas });

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 px-5 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/guru" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              ← Dasbor
            </Link>
            <h1 className="text-2xl font-bold">Pantauan Harian</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Kehadiran online &amp; kegiatan siswa hari ini · ketuk siswa untuk lihat level &amp; riwayat.
          </p>
        </div>
        <AutoRefresh detik={30} />
      </header>

      <LingkupBanner kelas={d.dibatasiKe} />

      {/* Ringkasan + filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-300">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500" />
            {d.onlineCount} online
          </span>
          <span className="text-zinc-500">dari {d.totalCount} siswa</span>
        </div>
        <PilihKelas kelasOpsi={d.kelasOpsi} terpilih={d.kelasTerpilih} />
      </div>

      {d.siswa.length === 0 ? (
        <p className="rounded-xl border border-black/10 px-4 py-10 text-center text-sm text-zinc-500 dark:border-white/15">
          Belum ada siswa pada lingkup/kelas ini.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {d.siswa.map((s) => {
            const g = GAYA_STATUS[s.status];
            return (
              <li key={s.siswaId}>
                <Link
                  href={`/guru/pantau/${s.siswaId}`}
                  className="flex items-center gap-3 rounded-xl border border-black/10 bg-white/60 px-4 py-3 transition-colors hover:border-blue-300 hover:bg-blue-50/40 dark:border-white/15 dark:bg-white/5 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
                >
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/5 text-sm font-bold dark:bg-white/10">
                    {s.nama.slice(0, 1).toUpperCase()}
                    <span
                      className={
                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-zinc-900 " +
                        g.dot +
                        (s.status === "online" ? " animate-pulse" : "")
                      }
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{s.nama}</span>
                      <span className="shrink-0 text-xs text-zinc-400">
                        {ikonJurusan(s.kelasLabel)} {s.kelasLabel}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-zinc-500">
                      {s.terakhirLabel ?? <span className="italic opacity-70">belum ada kegiatan hari ini</span>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={"text-xs font-semibold " + g.teks}>{g.label}</div>
                    <div className="text-[11px] text-zinc-400">{s.lastSeenLabel}</div>
                    {s.aktifTotal > 0 && (
                      <div className="mt-1 flex justify-end gap-1 text-[11px]">
                        {s.aktifNum > 0 && (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            🧮 {s.aktifNum}
                          </span>
                        )}
                        {s.aktifLit > 0 && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            📖 {s.aktifLit}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
