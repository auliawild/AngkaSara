"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setKelasAktif, setTingkatAktif, type KelasItem } from "@/server/kelas";

const TINGKAT = ["X", "XI", "XII"];

export default function KelolaKelasClient({ items }: { items: KelasItem[] }) {
  const router = useRouter();
  const [state, setState] = useState<KelasItem[]>(items);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  // State lokal = sumber kebenaran optimistik; header ringkasan (server) ikut segar via router.refresh().
  const groups = TINGKAT.map((t) => ({ t, list: state.filter((k) => k.tingkat === t) })).filter((g) => g.list.length);

  function toggle(id: string, aktif: boolean) {
    setErr(null);
    setState((s) => s.map((k) => (k.id === id ? { ...k, aktif } : k)));
    start(async () => {
      const r = await setKelasAktif(id, aktif);
      if (!r.ok) {
        setErr(r.error ?? "Gagal mengubah status kelas.");
        setState((s) => s.map((k) => (k.id === id ? { ...k, aktif: !aktif } : k)));
      } else {
        router.refresh();
      }
    });
  }

  function toggleTingkat(t: string, aktif: boolean) {
    setErr(null);
    const sebelum = state;
    setState((s) => s.map((k) => (k.tingkat === t ? { ...k, aktif } : k)));
    start(async () => {
      const r = await setTingkatAktif(t, aktif);
      if (!r.ok) {
        setErr(r.error ?? "Gagal mengubah status kelas.");
        setState(sebelum);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {err && <p className="text-sm font-semibold text-red-600 dark:text-red-400">{err}</p>}

      {groups.map((g) => {
        const aktifCount = g.list.filter((k) => k.aktif).length;
        const semuaAktif = aktifCount === g.list.length;
        return (
          <section
            key={g.t}
            className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/15"
          >
            <div className="flex items-center justify-between gap-2 border-b border-black/10 bg-black/[0.02] px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
              <h2 className="text-sm font-extrabold">
                Tingkat {g.t}{" "}
                <span className="ml-1 font-semibold text-zinc-400">
                  · {aktifCount}/{g.list.length} aktif
                </span>
              </h2>
              <button
                onClick={() => toggleTingkat(g.t, !semuaAktif)}
                disabled={pending}
                className="rounded-lg border border-black/15 px-2.5 py-1 text-xs font-semibold hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
              >
                {semuaAktif ? "Nonaktifkan semua" : "Aktifkan semua"}
              </button>
            </div>

            <ul className="divide-y divide-black/5 dark:divide-white/5">
              {g.list.map((k) => (
                <li key={k.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-lg">{k.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={"truncate text-sm font-semibold " + (k.aktif ? "" : "text-zinc-400 line-through")}>
                      {k.label}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {k.jumlahSiswa} siswa{!k.aktif && " · nonaktif"}
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={k.aktif}
                    aria-label={`Kelas ${k.label} ${k.aktif ? "aktif" : "nonaktif"}`}
                    onClick={() => toggle(k.id, !k.aktif)}
                    disabled={pending}
                    className={
                      "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 " +
                      (k.aktif ? "bg-violet-600" : "bg-zinc-300 dark:bg-zinc-600")
                    }
                  >
                    <span
                      className={
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform " +
                        (k.aktif ? "translate-x-[22px]" : "translate-x-0.5")
                      }
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
