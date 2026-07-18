"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { hapusStaf, setelUlangSandiStaf } from "@/server/staf";

export interface BarisStafUI {
  id: string;
  nama: string;
  nip: string | null;
  role: string;
}

export default function StafTabel({ data }: { data: BarisStafUI[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [pesan, setPesan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function hapus(s: BarisStafUI) {
    if (!confirm(`Hapus akun ${s.nama}? Tindakan ini tidak bisa dibatalkan.`)) return;
    setPesan(null);
    setError(null);
    start(async () => {
      const res = await hapusStaf(s.id);
      if (res.ok) {
        setPesan(`Akun ${s.nama} dihapus.`);
        router.refresh();
      } else setError(res.error ?? "Gagal menghapus.");
    });
  }

  function reset(s: BarisStafUI) {
    if (!confirm(`Setel ulang sandi ${s.nama} menjadi NIP-nya (${s.nip})?`)) return;
    setPesan(null);
    setError(null);
    start(async () => {
      const res = await setelUlangSandiStaf(s.id);
      if (res.ok) setPesan(`Sandi ${s.nama} disetel ulang ke NIP.`);
      else setError(res.error ?? "Gagal menyetel ulang sandi.");
    });
  }

  return (
    <section className="rounded-xl border border-black/10 dark:border-white/15">
      <div className="flex items-center justify-between border-b border-black/10 px-5 py-3 dark:border-white/15">
        <h2 className="font-semibold">🧑‍🏫 Daftar Guru &amp; Staf · {data.length}</h2>
        {(pesan || error) && (
          <span className={`text-sm ${error ? "text-red-600" : "text-green-600"}`}>{error ?? pesan}</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr className="border-b border-black/10 dark:border-white/10">
              <th className="px-4 py-2 font-medium">Nama</th>
              <th className="px-4 py-2 font-medium">NIP</th>
              <th className="px-4 py-2 font-medium">Peran</th>
              <th className="px-4 py-2 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                  Belum ada guru/staf. Impor dari Excel di atas.
                </td>
              </tr>
            ) : (
              data.map((s) => (
                <tr key={s.id} className="border-b border-black/5 dark:border-white/5">
                  <td className="px-4 py-2 font-medium">{s.nama}</td>
                  <td className="px-4 py-2 tabular-nums">{s.nip ?? <span className="text-zinc-400">—</span>}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-xs font-medium " +
                        (s.role === "ADMIN"
                          ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300")
                      }
                    >
                      {s.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {s.role === "ADMIN" ? (
                      <span className="text-xs text-zinc-400">—</span>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => reset(s)}
                          disabled={pending || !s.nip}
                          className="rounded-md border border-black/15 px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-40 dark:border-white/20 dark:hover:bg-white/10"
                          title="Setel ulang sandi ke NIP"
                        >
                          🔑 Reset sandi
                        </button>
                        <button
                          onClick={() => hapus(s)}
                          disabled={pending}
                          className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-red-900 dark:hover:bg-red-950/30"
                        >
                          🗑 Hapus
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
