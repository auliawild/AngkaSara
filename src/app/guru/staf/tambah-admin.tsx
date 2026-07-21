"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { tambahAdmin } from "@/server/staf";
import PilihKelas, { type OpsiKelas } from "./pilih-kelas";

export default function TambahAdmin({ kelasOpsi }: { kelasOpsi: OpsiKelas[] }) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [kelasIds, setKelasIds] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function simpan() {
    setError(null);
    setOk(null);
    start(async () => {
      const res = await tambahAdmin({ nama, email, password, kelasIds });
      if (res.ok) {
        setOk(`Admin ${nama} dibuat.`);
        setNama("");
        setEmail("");
        setPassword("");
        setKelasIds([]);
        setBuka(false);
        router.refresh();
      } else setError(res.error ?? "Gagal membuat admin.");
    });
  }

  const inp =
    "rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-violet-500 dark:border-white/20";

  return (
    <section className="rounded-xl border border-violet-200 bg-violet-50/40 p-5 dark:border-violet-900 dark:bg-violet-950/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-violet-900 dark:text-violet-200">🛡️ Tambah Admin</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Akun Admin login pakai <b>email + kata sandi</b> (bukan NIP), dan bisa mengelola guru/staf.
          </p>
        </div>
        <button
          onClick={() => {
            setBuka((b) => !b);
            setError(null);
            setOk(null);
          }}
          className="rounded-lg border border-violet-300 px-3 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-950"
        >
          {buka ? "Tutup" : "+ Admin baru"}
        </button>
      </div>

      {buka && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <input className={inp} placeholder="Nama lengkap" value={nama} onChange={(e) => setNama(e.target.value)} autoComplete="off" />
            <input className={inp} type="email" placeholder="email@sekolah.sch.id" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
            <input className={inp} type="password" placeholder="Kata sandi (min. 8)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </div>

          <div className="rounded-lg border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold">Kelas yang boleh dinilai</span>
              <span className="text-[11px] text-zinc-500">
                {kelasIds.length === 0 ? "Kosong = semua kelas" : `${kelasIds.length} kelas dipilih`}
              </span>
            </div>
            <p className="mb-3 text-[11.5px] leading-snug text-zinc-500">
              Batasi admin ini agar hanya bisa <b>Menilai Ringkasan SKIBACA</b> untuk kelas terpilih.
              Biarkan kosong bila admin boleh menilai semua kelas.
            </p>
            <PilihKelas opsi={kelasOpsi} nilai={kelasIds} onChange={setKelasIds} />
          </div>

          <div>
            <button
              onClick={simpan}
              disabled={pending || !nama || !email || password.length < 8}
              className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {pending ? "Menyimpan…" : "Simpan Admin"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {ok && <p className="mt-3 text-sm text-green-600">{ok}</p>}
    </section>
  );
}
