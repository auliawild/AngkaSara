"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { imporSiswa } from "@/server/students";
import type { ImporLaporan } from "@/lib/impor";

export default function ImporPanel() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [namaFile, setNamaFile] = useState<string | null>(null);
  const [lapor, setLapor] = useState<ImporLaporan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function jalankan() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Pilih berkas .xlsx atau .csv dulu.");
      return;
    }
    setError(null);
    setLapor(null);
    const fd = new FormData();
    fd.set("file", file);
    start(async () => {
      try {
        const hasil = await imporSiswa(fd);
        setLapor(hasil);
        if (fileRef.current) fileRef.current.value = "";
        setNamaFile(null);
        if (hasil.ditambah > 0) router.refresh();
      } catch (e) {
        setError((e as Error).message || "Impor gagal.");
      }
    });
  }

  return (
    <section className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-5 dark:border-blue-900 dark:bg-blue-950/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-blue-900 dark:text-blue-200">📊 Impor dari Excel</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Cukup kolom <b>Nama</b> &amp; <b>Kelas</b> — <b>UserName</b> login dibuat otomatis setelah impor.
            Nama yang sudah ada di kelas itu dilewati.
          </p>
        </div>
        <a
          href="/guru/siswa/template"
          className="rounded-lg border border-blue-300 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950"
        >
          ⬇ Unduh template
        </a>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:bg-zinc-900 dark:hover:bg-white/10">
          {namaFile ?? "📁 Pilih berkas…"}
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.csv,.txt"
            className="hidden"
            onChange={(e) => {
              setNamaFile(e.target.files?.[0]?.name ?? null);
              setError(null);
              setLapor(null);
            }}
          />
        </label>
        <button
          onClick={jalankan}
          disabled={pending || !namaFile}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Mengimpor…" : "Impor Siswa"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {lapor && (
        <div className="mt-4 space-y-2 text-sm">
          <p className="font-medium text-green-700 dark:text-green-400">
            ✅ {lapor.ditambah} siswa ditambahkan
            {lapor.dilewati.length > 0 && ` · ${lapor.dilewati.length} dilewati (sudah ada)`}
            {lapor.gagal.length > 0 && ` · ${lapor.gagal.length} gagal`}
          </p>

          {Object.keys(lapor.perKelas).length > 0 && (
            <p className="text-zinc-600 dark:text-zinc-300">
              {Object.entries(lapor.perKelas)
                .map(([k, n]) => `${k}: ${n}`)
                .join(" · ")}
            </p>
          )}

          {lapor.dibuat.length > 0 && (
            <details className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/30">
              <summary className="cursor-pointer font-medium text-green-800 dark:text-green-300">
                {lapor.dibuat.length} UserName dibuat otomatis — klik untuk lihat
              </summary>
              <ul className="mt-2 max-h-48 space-y-0.5 overflow-y-auto text-zinc-700 dark:text-zinc-200">
                {lapor.dibuat.map((d, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="truncate">
                      {d.nama} <span className="text-zinc-400">· {d.kelas}</span>
                    </span>
                    <span className="font-mono font-semibold">{d.username}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-zinc-500">
                Unduh daftar lengkap + UserName lewat tombol ⬇️ Excel/CSV di tiap kelas.
              </p>
            </details>
          )}

          {lapor.gagal.length > 0 && (
            <details className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
              <summary className="cursor-pointer font-medium text-red-700 dark:text-red-400">
                {lapor.gagal.length} baris gagal — klik untuk rincian
              </summary>
              <ul className="mt-2 max-h-48 space-y-0.5 overflow-y-auto text-red-700 dark:text-red-300">
                {lapor.gagal.map((g, i) => (
                  <li key={i}>
                    Baris {g.baris}: {g.isi} — <em>{g.sebab}</em>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
