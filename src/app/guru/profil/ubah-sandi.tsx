"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ubahSandiSendiri } from "@/server/staf-auth";

/** Baris "Ubah Sandi" pada Profil yang mengembang jadi form ganti kata sandi sendiri. */
export default function UbahSandi() {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [konf, setKonf] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function reset() {
    setLama("");
    setBaru("");
    setKonf("");
    setError(null);
  }

  function simpan() {
    setError(null);
    setOk(null);
    if (baru.length < 8) return setError("Kata sandi baru minimal 8 karakter.");
    if (baru !== konf) return setError("Konfirmasi kata sandi tidak cocok.");
    if (baru === lama) return setError("Kata sandi baru harus berbeda dari yang lama.");
    start(async () => {
      const res = await ubahSandiSendiri({ sandiLama: lama, sandiBaru: baru });
      if (res.ok) {
        setOk("Kata sandi berhasil diubah.");
        reset();
        setBuka(false);
        router.refresh();
      } else setError(res.error ?? "Gagal mengubah kata sandi.");
    });
  }

  const inp =
    "w-full rounded-xl border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-violet-500 dark:border-white/20";

  return (
    <div className="rounded-[18px] bg-white shadow-[0_8px_22px_-18px_rgba(30,20,60,.4)] ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
      <button
        onClick={() => {
          setBuka((b) => !b);
          setOk(null);
          if (buka) reset();
        }}
        className="flex w-full items-center gap-3.5 p-3.5 text-left"
        aria-expanded={buka}
      >
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-violet-500/10 text-[15px]">
          🔑
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Ubah Sandi</p>
          <p className="mt-0.5 text-[11.5px] font-semibold text-zinc-500 dark:text-zinc-400">Keamanan akun</p>
        </div>
        <span className={`text-base font-extrabold text-zinc-400 transition-transform ${buka ? "rotate-90" : ""}`}>›</span>
      </button>

      {buka && (
        <div className="flex flex-col gap-2.5 border-t border-black/5 p-3.5 dark:border-white/10">
          <input
            className={inp}
            type="password"
            placeholder="Kata sandi lama"
            value={lama}
            onChange={(e) => setLama(e.target.value)}
            autoComplete="current-password"
          />
          <input
            className={inp}
            type="password"
            placeholder="Kata sandi baru (min. 8 karakter)"
            value={baru}
            onChange={(e) => setBaru(e.target.value)}
            autoComplete="new-password"
          />
          <input
            className={inp}
            type="password"
            placeholder="Ulangi kata sandi baru"
            value={konf}
            onChange={(e) => setKonf(e.target.value)}
            autoComplete="new-password"
          />
          {error && <p className="text-[12.5px] font-semibold text-red-600 dark:text-red-400">{error}</p>}
          <button
            onClick={simpan}
            disabled={pending || !lama || !baru || !konf}
            className="mt-0.5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {pending ? "Menyimpan…" : "Simpan Kata Sandi"}
          </button>
          <p className="text-[11px] text-zinc-400">Setelah diubah, sesi di perangkat lain akan keluar otomatis.</p>
        </div>
      )}

      {ok && !buka && (
        <p className="border-t border-black/5 px-3.5 py-2.5 text-[12.5px] font-semibold text-green-600 dark:border-white/10 dark:text-green-400">
          ✓ {ok}
        </p>
      )}
    </div>
  );
}
