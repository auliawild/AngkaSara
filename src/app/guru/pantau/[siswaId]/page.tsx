import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { muatPantauanSiswa } from "@/server/pantau";
import { levelColor, levelBand } from "@/lib/skiba";
import { ikonJurusan } from "@/lib/kelas";
import type { StatusKehadiran } from "@/lib/pantau";

export const dynamic = "force-dynamic";

const GAYA_STATUS: Record<StatusKehadiran, { dot: string; teks: string; label: string }> = {
  online: { dot: "bg-green-500", teks: "text-green-600 dark:text-green-400", label: "Online" },
  baru: { dot: "bg-amber-500", teks: "text-amber-600 dark:text-amber-400", label: "Baru aktif" },
  lama: { dot: "bg-zinc-300 dark:bg-zinc-600", teks: "text-zinc-400", label: "Offline" },
};

export default async function PantauSiswaPage({
  params,
}: {
  params: Promise<{ siswaId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/masuk?tab=staf");
  const { siswaId } = await params;
  const d = await muatPantauanSiswa(siswaId);
  if (!d) notFound();

  const g = GAYA_STATUS[d.status];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-5 py-8">
      <div>
        <Link href="/guru/pantau" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          ← Pantauan
        </Link>
      </div>

      {/* Identitas + kehadiran */}
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/15 dark:bg-white/5">
        <div className="flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-black/5 text-lg font-bold dark:bg-white/10">
            {d.nama.slice(0, 1).toUpperCase()}
            <span
              className={
                "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-zinc-900 " +
                g.dot +
                (d.status === "online" ? " animate-pulse" : "")
              }
            />
          </span>
          <div>
            <h1 className="text-xl font-bold leading-tight">{d.nama}</h1>
            <p className="text-xs text-zinc-500">
              {ikonJurusan(d.kelasLabel)} {d.kelasLabel} · UserName {d.nisn}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={"text-sm font-semibold " + g.teks}>{g.label}</div>
          <div className="text-xs text-zinc-400">Terakhir terlihat {d.lastSeenLabel}</div>
        </div>
      </header>

      {/* Level SKIBA — cermin tampilan siswa */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100">🧮 Level SKIBA Math</h2>
          <div className="flex gap-3 text-xs text-zinc-500">
            <span>Topik dibuka <b className="text-zinc-700 dark:text-zinc-200">{d.topikDibuka}/10</b></span>
            <span>Skor <b className="text-zinc-700 dark:text-zinc-200">{d.totalScore.toLocaleString("id-ID")}</b></span>
          </div>
        </div>

        {/* Diagnostik */}
        <p className="text-xs text-zinc-500">
          Tes Diagnostik: <b>{d.diagAttempts}/{d.diagMaks}</b> terpakai
          {d.diagScore != null ? ` · skor terakhir ${d.diagScore}%` : " · belum pernah"}
        </p>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {d.topik.map((t) => (
            <div
              key={t.topicId}
              className="rounded-xl border border-black/10 bg-white/70 p-3 dark:border-white/15 dark:bg-white/5"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{t.icon}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                  style={{ backgroundColor: levelColor(t.maxUnlocked) }}
                  title={levelBand(t.maxUnlocked)}
                >
                  Lv {t.maxUnlocked}
                </span>
              </div>
              <div className="mt-1.5 truncate text-sm font-semibold">{t.name}</div>
              <div className="mt-0.5 flex justify-between text-[11px] text-zinc-500">
                <span>{t.selesai} level selesai</span>
                <span>{t.score.toLocaleString("id-ID")} poin</span>
              </div>
              {/* bar menuju level 20 */}
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(t.maxUnlocked / 20) * 100}%`,
                    backgroundColor: levelColor(t.maxUnlocked),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Riwayat lengkap */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100">
          🕑 Riwayat Kegiatan
          <span className="ml-2 text-xs font-normal text-zinc-400">
            {d.riwayat.length} terbaru
          </span>
        </h2>
        {d.riwayat.length === 0 ? (
          <p className="rounded-xl border border-black/10 px-4 py-8 text-center text-sm text-zinc-500 dark:border-white/15">
            Belum ada kegiatan tercatat.
          </p>
        ) : (
          <ol className="flex flex-col">
            {d.riwayat.map((r, i) => (
              <li
                key={i}
                className="flex items-center gap-3 border-b border-black/5 py-2.5 last:border-0 dark:border-white/10"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/5 text-base dark:bg-white/10">
                  {r.ikon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{r.judul}</div>
                  <div className="truncate text-[11px] text-zinc-500">
                    {r.detail ? r.detail + " · " : ""}
                    {r.waktuLabel}
                  </div>
                </div>
                <div className="shrink-0 text-right text-xs">
                  <div className="font-bold">{r.skor}%</div>
                  <div className="text-[11px] text-zinc-400">
                    {r.bintang != null && r.bintang > 0 ? "⭐".repeat(r.bintang) : ""}
                    {r.poin != null && r.poin > 0 ? ` ${r.poin} poin` : ""}
                    {r.wpm != null && r.wpm > 0 ? ` ${r.wpm} wpm` : ""}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
