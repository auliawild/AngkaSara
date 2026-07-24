"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { tambahSiswa, editSiswa, hapusSiswa } from "@/server/students";

interface Row {
  id: string;
  nisn: string;
  nama: string;
  aktif: boolean;
  kelasId: string;
}
interface Opsi {
  id: string;
  label: string;
}

const inputCls =
  "rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-white/20";

export default function SiswaTabel({
  kelas,
  siswa,
  kelasOpsi,
}: {
  kelas: Opsi;
  siswa: Row[];
  kelasOpsi: Opsi[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editId, setEditId] = useState<string | null>(null);
  const [tambah, setTambah] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "ok" | "err"; teks: string } | null>(null);

  function jalankan(
    fn: () => Promise<{ ok: boolean; error?: string; username?: string }>,
    sukses: string | ((res: { ok: boolean; error?: string; username?: string }) => string),
    tutup: () => void,
  ) {
    setPesan(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        setPesan({ tipe: "err", teks: res.error ?? "Gagal." });
        return;
      }
      tutup();
      setPesan({ tipe: "ok", teks: typeof sukses === "function" ? sukses(res) : sukses });
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-black/10 dark:border-white/15">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 px-4 py-3 dark:border-white/15">
        <h2 className="font-semibold">
          {kelas.label} <span className="text-sm font-normal text-zinc-500">· {siswa.length} siswa</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/guru/siswa/export?kelas=${kelas.id}&format=xlsx`}
            className={
              "rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10 " +
              (siswa.length === 0 ? "pointer-events-none opacity-40" : "")
            }
            title="Unduh daftar siswa + UserName (Excel)"
          >
            ⬇️ Excel
          </a>
          <a
            href={`/guru/siswa/export?kelas=${kelas.id}&format=csv`}
            className={
              "rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10 " +
              (siswa.length === 0 ? "pointer-events-none opacity-40" : "")
            }
            title="Unduh daftar siswa + UserName (CSV)"
          >
            ⬇️ CSV
          </a>
          <button
            onClick={() => {
              setTambah((v) => !v);
              setEditId(null);
              setPesan(null);
            }}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            {tambah ? "Batal" : "+ Tambah siswa"}
          </button>
        </div>
      </div>

      {pesan && (
        <p
          className={
            "px-4 pt-3 text-sm " + (pesan.tipe === "ok" ? "text-green-600" : "text-red-600")
          }
        >
          {pesan.teks}
        </p>
      )}

      {tambah && (
        <BarisForm
          kelasOpsi={kelasOpsi}
          awal={{ nisn: "", nama: "", kelasId: kelas.id, aktif: true }}
          pending={pending}
          autoUsername
          onBatal={() => setTambah(false)}
          onSimpan={(d, tutup) =>
            jalankan(
              () => tambahSiswa(d),
              (res) => (res.username ? `Siswa ditambahkan. UserName: ${res.username}` : "Siswa ditambahkan."),
              tutup,
            )
          }
        />
      )}

      {siswa.length === 0 && !tambah ? (
        <p className="px-4 py-6 text-sm text-zinc-500">
          Belum ada siswa di kelas ini. Tambah manual atau impor dari Excel di atas.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr className="border-b border-black/10 dark:border-white/10">
                <th className="px-4 py-2 font-medium">NISN</th>
                <th className="px-4 py-2 font-medium">Nama</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {siswa.map((s) =>
                editId === s.id ? (
                  <tr key={s.id} className="border-b border-black/5 dark:border-white/5">
                    <td colSpan={4} className="p-0">
                      <BarisForm
                        kelasOpsi={kelasOpsi}
                        awal={{ nisn: s.nisn, nama: s.nama, kelasId: s.kelasId, aktif: s.aktif }}
                        pending={pending}
                        withAktif
                        onBatal={() => setEditId(null)}
                        onSimpan={(d, tutup) =>
                          jalankan(() => editSiswa(s.id, d), "Perubahan disimpan.", tutup)
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  <tr key={s.id} className="border-b border-black/5 hover:bg-black/[.02] dark:border-white/5 dark:hover:bg-white/[.03]">
                    <td className="px-4 py-2 font-mono text-xs">{s.nisn}</td>
                    <td className="px-4 py-2">{s.nama}</td>
                    <td className="px-4 py-2">
                      {s.aktif ? (
                        <span className="text-green-600">Aktif</span>
                      ) : (
                        <span className="text-zinc-400">Nonaktif</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditId(s.id);
                          setTambah(false);
                          setPesan(null);
                        }}
                        className="rounded px-2 py-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                      >
                        Edit
                      </button>
                      <button
                        disabled={pending}
                        onClick={() => {
                          if (!confirm(`Hapus ${s.nama} (NISN ${s.nisn})? Data Check Point-nya ikut terhapus.`))
                            return;
                          jalankan(() => hapusSiswa(s.id), "Siswa dihapus.", () => {});
                        }}
                        className="rounded px-2 py-1 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function BarisForm({
  kelasOpsi,
  awal,
  pending,
  withAktif,
  autoUsername,
  onBatal,
  onSimpan,
}: {
  kelasOpsi: Opsi[];
  awal: { nisn: string; nama: string; kelasId: string; aktif: boolean };
  pending: boolean;
  withAktif?: boolean;
  /** Form tambah: UserName boleh dikosongkan → dibuat otomatis oleh server. */
  autoUsername?: boolean;
  onBatal: () => void;
  onSimpan: (d: { nisn: string; nama: string; kelasId: string; aktif: boolean }, tutup: () => void) => void;
}) {
  const [nisn, setNisn] = useState(awal.nisn);
  const [nama, setNama] = useState(awal.nama);
  const [kelasId, setKelasId] = useState(awal.kelasId);
  const [aktif, setAktif] = useState(awal.aktif);

  // Boleh kosong bila auto; kalau diisi tetap harus ≥4 digit.
  const nisnTakSah = autoUsername ? nisn.length > 0 && nisn.length < 4 : nisn.length < 4;

  return (
    <div className="flex flex-wrap items-center gap-2 bg-black/[.02] px-4 py-3 dark:bg-white/[.03]">
      <input
        className={inputCls + " w-44 font-mono"}
        placeholder={autoUsername ? "UserName (otomatis)" : "NISN"}
        inputMode="numeric"
        value={nisn}
        onChange={(e) => setNisn(e.target.value.replace(/\D/g, ""))}
      />
      <input
        className={inputCls + " min-w-[12rem] flex-1"}
        placeholder="Nama lengkap"
        value={nama}
        onChange={(e) => setNama(e.target.value)}
      />
      <select className={inputCls} value={kelasId} onChange={(e) => setKelasId(e.target.value)}>
        {kelasOpsi.map((k) => (
          <option key={k.id} value={k.id}>
            {k.label}
          </option>
        ))}
      </select>
      {withAktif && (
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={aktif} onChange={(e) => setAktif(e.target.checked)} />
          Aktif
        </label>
      )}
      <button
        disabled={pending || nisnTakSah || !nama.trim()}
        onClick={() => onSimpan({ nisn, nama, kelasId, aktif }, onBatal)}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Menyimpan…" : "Simpan"}
      </button>
      <button
        onClick={onBatal}
        className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 hover:bg-black/5 dark:hover:bg-white/10"
      >
        Batal
      </button>
      {autoUsername && (
        <p className="w-full text-xs text-zinc-500">
          Cukup isi <b>Nama</b> &amp; pilih <b>Kelas</b> — UserName dibuat otomatis (angkatan+jurusan+rombel+urutan).
          Isi kotak UserName hanya jika siswa sudah punya NISN.
        </p>
      )}
    </div>
  );
}
