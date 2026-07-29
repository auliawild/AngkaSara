"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { tambahSiswa, editSiswa, hapusSiswa } from "@/server/students";
import { bukaDiagnostikSkiba, bukaCheckpoint } from "@/server/kesempatan";

interface Row {
  id: string;
  nisn: string;
  nama: string;
  aktif: boolean;
  kelasId: string;
  /** Jumlah kesempatan Tes Diagnostik SKIBA yang sudah dipakai (0..diagMaks). */
  diagTerpakai: number;
  /** Status Check Point periode berjalan: null = belum ada. */
  cpStatus: "in_progress" | "submitted" | null;
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
  diagMaks,
  periodeLabel,
}: {
  kelas: Opsi;
  siswa: Row[];
  kelasOpsi: Opsi[];
  diagMaks: number;
  periodeLabel: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editId, setEditId] = useState<string | null>(null);
  const [bukaId, setBukaId] = useState<string | null>(null);
  const [tambah, setTambah] = useState(false);
  const [pesan, setPesan] = useState<{ tipe: "ok" | "err"; teks: string } | null>(null);

  function jalankan(
    fn: () => Promise<{ ok: boolean; error?: string; username?: string; pesan?: string }>,
    sukses:
      | string
      | ((res: { ok: boolean; error?: string; username?: string; pesan?: string }) => string),
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
                  <Fragment key={s.id}>
                    <tr className="border-b border-black/5 hover:bg-black/[.02] dark:border-white/5 dark:hover:bg-white/[.03]">
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
                            setBukaId((v) => (v === s.id ? null : s.id));
                            setEditId(null);
                            setTambah(false);
                            setPesan(null);
                          }}
                          className={
                            "rounded px-2 py-1 hover:bg-amber-50 dark:hover:bg-amber-950 " +
                            (bukaId === s.id
                              ? "text-amber-700 dark:text-amber-300"
                              : "text-amber-600 dark:text-amber-400")
                          }
                          title="Buka kembali kesempatan Diagnostik / Check Point"
                        >
                          🔓 Kesempatan
                        </button>
                        <button
                          onClick={() => {
                            setEditId(s.id);
                            setBukaId(null);
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
                    {bukaId === s.id && (
                      <tr className="border-b border-black/5 dark:border-white/5">
                        <td colSpan={4} className="p-0">
                          <PanelKesempatan
                            row={s}
                            diagMaks={diagMaks}
                            periodeLabel={periodeLabel}
                            pending={pending}
                            onBukaDiag={() =>
                              jalankan(
                                () => bukaDiagnostikSkiba(s.id),
                                (res) => res.pesan ?? "Kesempatan diagnostik dibuka.",
                                () => setBukaId(null),
                              )
                            }
                            onBukaCheckpoint={() =>
                              jalankan(
                                () => bukaCheckpoint(s.id),
                                (res) => res.pesan ?? "Kesempatan Check Point dibuka.",
                                () => setBukaId(null),
                              )
                            }
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
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

/** Panel buka-kesempatan per siswa: Tes Diagnostik SKIBA & Check Point periode berjalan. */
function PanelKesempatan({
  row,
  diagMaks,
  periodeLabel,
  pending,
  onBukaDiag,
  onBukaCheckpoint,
}: {
  row: Row;
  diagMaks: number;
  periodeLabel: string;
  pending: boolean;
  onBukaDiag: () => void;
  onBukaCheckpoint: () => void;
}) {
  const diagHabis = row.diagTerpakai > 0;
  const cpAda = row.cpStatus !== null;
  const cpTeks =
    row.cpStatus === "submitted"
      ? "sudah dikumpulkan"
      : row.cpStatus === "in_progress"
        ? "sedang dikerjakan"
        : "belum dikerjakan";

  const tombolCls =
    "rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="grid gap-3 bg-amber-50/60 px-4 py-3 sm:grid-cols-2 dark:bg-amber-950/20">
      {/* Tes Diagnostik SKIBA */}
      <div className="flex flex-col gap-1.5 rounded-lg border border-amber-200/60 p-3 dark:border-amber-900/40">
        <div className="text-sm font-semibold">🧮 Tes Diagnostik SKIBA</div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400">
          Terpakai <b>{row.diagTerpakai}</b> dari {diagMaks}× ·{" "}
          {diagHabis ? (
            <span className="text-amber-700 dark:text-amber-300">bisa dibuka kembali</span>
          ) : (
            <span className="text-green-600">kesempatan masih penuh</span>
          )}
        </div>
        <div>
          <button disabled={pending || !diagHabis} onClick={onBukaDiag} className={tombolCls}>
            {pending ? "Memproses…" : "Buka kembali"}
          </button>
        </div>
        <p className="text-[11px] text-zinc-500">Kuota dikembalikan penuh ({diagMaks}×). Skor lama tetap.</p>
      </div>

      {/* Check Point periode berjalan */}
      <div className="flex flex-col gap-1.5 rounded-lg border border-amber-200/60 p-3 dark:border-amber-900/40">
        <div className="text-sm font-semibold">📝 Check Point {periodeLabel}</div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400">
          Status:{" "}
          <b className={cpAda ? "text-amber-700 dark:text-amber-300" : "text-green-600"}>{cpTeks}</b>
        </div>
        <div>
          <button
            disabled={pending || !cpAda}
            onClick={() => {
              if (
                !confirm(
                  `Buka kembali Check Point ${periodeLabel} untuk ${row.nama}? Skor bulan ini yang tersimpan akan dihapus.`,
                )
              )
                return;
              onBukaCheckpoint();
            }}
            className={tombolCls}
          >
            {pending ? "Memproses…" : "Buka kembali"}
          </button>
        </div>
        <p className="text-[11px] text-zinc-500">Menghapus hasil bulan ini agar siswa bisa mulai dari awal.</p>
      </div>
    </div>
  );
}
