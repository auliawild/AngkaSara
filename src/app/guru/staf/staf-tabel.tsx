"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { hapusStaf, setelUlangSandiStaf, setKelasDinilai, ubahNamaStaf } from "@/server/staf";
import PilihKelas, { type OpsiKelas } from "./pilih-kelas";

export interface BarisStafUI {
  id: string;
  nama: string;
  nip: string | null;
  role: string;
  kelasIds: string[]; // kelas yang boleh dinilai (kosong = semua)
}

export default function StafTabel({ data, kelasOpsi }: { data: BarisStafUI[]; kelasOpsi: OpsiKelas[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [pesan, setPesan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [editNamaId, setEditNamaId] = useState<string | null>(null);
  const [namaDraft, setNamaDraft] = useState("");

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

  function bukaEditor(s: BarisStafUI) {
    setPesan(null);
    setError(null);
    setEditNamaId(null);
    setEditId((cur) => (cur === s.id ? null : s.id));
    setDraft(s.kelasIds);
  }

  function bukaEditNama(s: BarisStafUI) {
    setPesan(null);
    setError(null);
    setEditId(null);
    setEditNamaId((cur) => (cur === s.id ? null : s.id));
    setNamaDraft(s.nama);
  }

  function simpanNama(s: BarisStafUI) {
    const nm = namaDraft.trim();
    if (!nm) {
      setError("Nama wajib diisi.");
      return;
    }
    setPesan(null);
    setError(null);
    start(async () => {
      const res = await ubahNamaStaf(s.id, nm);
      if (res.ok) {
        setPesan(`Nama ${s.nama} diperbarui.`);
        setEditNamaId(null);
        router.refresh();
      } else setError(res.error ?? "Gagal menyimpan nama.");
    });
  }

  function simpanKelas(s: BarisStafUI) {
    setPesan(null);
    setError(null);
    start(async () => {
      const res = await setKelasDinilai(s.id, draft);
      if (res.ok) {
        setPesan(`Kelas untuk ${s.nama} diperbarui.`);
        setEditId(null);
        router.refresh();
      } else setError(res.error ?? "Gagal menyimpan kelas.");
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
              <th className="px-4 py-2 font-medium">Kelas dinilai</th>
              <th className="px-4 py-2 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-zinc-500">
                  Belum ada guru/staf. Impor dari Excel di atas.
                </td>
              </tr>
            ) : (
              data.map((s) => (
                <Fragment key={s.id}>
                  <tr className="border-b border-black/5 dark:border-white/5">
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
                    <td className="px-4 py-2">
                      {s.kelasIds.length === 0 ? (
                        <span className="text-xs text-zinc-400">semua kelas</span>
                      ) : (
                        <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                          {s.kelasIds.length} kelas
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => bukaEditNama(s)}
                          disabled={pending}
                          className="rounded-md border border-black/15 px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-40 dark:border-white/20 dark:hover:bg-white/10"
                          title="Ubah nama"
                        >
                          ✏️ Edit nama
                        </button>
                        <button
                          onClick={() => bukaEditor(s)}
                          disabled={pending}
                          className="rounded-md border border-black/15 px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-40 dark:border-white/20 dark:hover:bg-white/10"
                          title="Atur kelas yang boleh dinilai"
                        >
                          🏫 Atur kelas
                        </button>
                        {s.role !== "ADMIN" && (
                          <button
                            onClick={() => reset(s)}
                            disabled={pending || !s.nip}
                            className="rounded-md border border-black/15 px-2 py-1 text-xs hover:bg-black/5 disabled:opacity-40 dark:border-white/20 dark:hover:bg-white/10"
                            title="Setel ulang sandi ke NIP"
                          >
                            🔑 Reset sandi
                          </button>
                        )}
                        <button
                          onClick={() => hapus(s)}
                          disabled={pending}
                          className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40 dark:border-red-900 dark:hover:bg-red-950/30"
                        >
                          🗑 Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editNamaId === s.id && (
                    <tr className="border-b border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.03]">
                      <td colSpan={5} className="px-4 py-3">
                        <label className="mb-1.5 block text-sm font-semibold">Ubah nama</label>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            autoFocus
                            value={namaDraft}
                            onChange={(e) => setNamaDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") simpanNama(s);
                              if (e.key === "Escape") setEditNamaId(null);
                            }}
                            placeholder="Nama lengkap"
                            className="min-w-[14rem] flex-1 rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-violet-500 dark:border-white/20"
                          />
                          <button
                            onClick={() => setEditNamaId(null)}
                            className="rounded-md border border-black/15 px-2.5 py-1.5 text-xs hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => simpanNama(s)}
                            disabled={pending || !namaDraft.trim()}
                            className="rounded-md bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                          >
                            {pending ? "Menyimpan…" : "Simpan"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {editId === s.id && (
                    <tr className="border-b border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.03]">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold">
                            Kelas yang boleh dinilai {s.nama}
                            <span className="ml-2 text-[11px] font-normal text-zinc-500">
                              {draft.length === 0 ? "kosong = semua kelas" : `${draft.length} dipilih`}
                            </span>
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditId(null)}
                              className="rounded-md border border-black/15 px-2.5 py-1 text-xs hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                            >
                              Batal
                            </button>
                            <button
                              onClick={() => simpanKelas(s)}
                              disabled={pending}
                              className="rounded-md bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                            >
                              {pending ? "Menyimpan…" : "Simpan"}
                            </button>
                          </div>
                        </div>
                        <PilihKelas opsi={kelasOpsi} nilai={draft} onChange={setDraft} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
