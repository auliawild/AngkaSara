"use client";
/**
 * UI guru menilai ringkasan SKIBACA. Filter belum/semua; tiap kartu menampilkan teks asli,
 * poin kunci (acuan), ringkasan siswa, lalu input skor + catatan → nilaiRingkasan.
 */
import { useCallback, useMemo, useState } from "react";
import {
  muatRingkasanUntukGuru,
  nilaiRingkasan,
  type RingkasanUntukGuru,
} from "@/server/skibaca-guru";
import { ikonJurusan, urutkanKelas } from "@/lib/kelas";

type Filter = "belum" | "semua";
const SEMUA_KELAS = "all";

export default function NilaiRingkasanClient({ awal }: { awal: RingkasanUntukGuru[] }) {
  const [filter, setFilter] = useState<Filter>("belum");
  const [kelas, setKelas] = useState<string>(SEMUA_KELAS);
  const [daftar, setDaftar] = useState<RingkasanUntukGuru[]>(awal);
  const [pending, setPending] = useState(false);

  const muat = useCallback(async (f: Filter) => {
    setFilter(f);
    setPending(true);
    try {
      setDaftar(await muatRingkasanUntukGuru(f));
    } finally {
      setPending(false);
    }
  }, []);

  // Opsi kelas diturunkan dari data yang ada, urut jenjang.
  const kelasOpsi = useMemo(
    () => [...new Set(daftar.map((r) => r.kelasLabel))].sort(urutkanKelas),
    [daftar],
  );
  const tampil = useMemo(
    () => (kelas === SEMUA_KELAS ? daftar : daftar.filter((r) => r.kelasLabel === kelas)),
    [daftar, kelas],
  );
  // Kelompokkan per kelas supaya guru menilai satu kelas sekaligus.
  const grup = useMemo(() => {
    const m = new Map<string, RingkasanUntukGuru[]>();
    for (const r of tampil) {
      const arr = m.get(r.kelasLabel) ?? [];
      arr.push(r);
      m.set(r.kelasLabel, arr);
    }
    return [...m.entries()].sort((a, b) => urutkanKelas(a[0], b[0]));
  }, [tampil]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["belum", "semua"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => muat(f)}
            disabled={pending}
            className={
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 " +
              (filter === f
                ? "bg-blue-600 text-white"
                : "border border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10")
            }
          >
            {f === "belum" ? "Menunggu penilaian" : "Semua"}
          </button>
        ))}
        <select
          value={kelas}
          onChange={(e) => setKelas(e.target.value)}
          className="rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-white/20"
        >
          <option value={SEMUA_KELAS}>🏫 Semua kelas</option>
          {kelasOpsi.map((k) => (
            <option key={k} value={k}>
              {ikonJurusan(k)} {k}
            </option>
          ))}
        </select>
        <span className="text-xs text-zinc-500">
          {tampil.length} ringkasan · {grup.length} kelas
        </span>
      </div>

      {tampil.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/15 p-8 text-center text-sm text-zinc-500 dark:border-white/20">
          {filter === "belum" ? "Tidak ada ringkasan yang menunggu penilaian. 🎉" : "Belum ada ringkasan."}
        </p>
      ) : (
        grup.map(([kelasLabel, items]) => (
          <section key={kelasLabel} className="flex flex-col gap-3">
            <h2 className="sticky top-0 z-10 rounded-lg bg-blue-50/90 px-3 py-1.5 text-sm font-semibold text-blue-900 backdrop-blur dark:bg-blue-950/70 dark:text-blue-200">
              <span className="mr-1">{ikonJurusan(kelasLabel)}</span>
              {kelasLabel}
              <span className="ml-2 text-xs font-normal text-blue-700/70 dark:text-blue-300/70">
                {items.length} ringkasan
              </span>
            </h2>
            {items.map((r) => (
              <KartuNilai
                key={r.id}
                r={r}
                onTersimpan={() => {
                  // di filter "belum", ringkasan yang baru dinilai hilang dari daftar
                  if (filter === "belum") setDaftar((d) => d.filter((x) => x.id !== r.id));
                  else muat("semua");
                }}
              />
            ))}
          </section>
        ))
      )}
    </div>
  );
}

// Preset "nilai cepat" (mengikuti ambang klasifikasi) & catatan siap pakai — mempercepat guru menilai.
const CEPAT = [
  { v: 55, label: "Perlu Bimbingan", color: "#d1704f" },
  { v: 70, label: "Cukup", color: "#e0a800" },
  { v: 82, label: "Baik", color: "#0057ff" },
  { v: 95, label: "Mahir", color: "#4f9c6a" },
] as const;
const CHIP_CATATAN = [
  "Ide pokok sudah tercakup.",
  "Ditulis dengan bahasa sendiri, bagus.",
  "Perlu lebih lengkap.",
  "Ada poin penting yang terlewat.",
  "Masih terlalu singkat.",
];

function KartuNilai({ r, onTersimpan }: { r: RingkasanUntukGuru; onTersimpan: () => void }) {
  const [skor, setSkor] = useState<string>(r.score != null ? String(r.score) : "");
  const [feedback, setFeedback] = useState<string>(r.feedback ?? "");
  const [bukaTeks, setBukaTeks] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tersimpan, setTersimpan] = useState(false);

  const skorNum = Number(skor);
  const valid = skor !== "" && Number.isFinite(skorNum) && skorNum >= 0 && skorNum <= 100;

  async function simpan() {
    if (!valid) {
      setError("Skor harus 0–100.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await nilaiRingkasan({ summaryId: r.id, score: skorNum, feedback });
      if (!res.ok) {
        setError(res.error ?? "Gagal menyimpan.");
        return;
      }
      setTersimpan(true);
      setTimeout(onTersimpan, 700);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 p-5 dark:border-white/15">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-semibold">
            {r.nama} <span className="text-xs font-normal text-zinc-500">· {r.kelasLabel}</span>
          </div>
          <div className="text-xs text-zinc-500">
            {r.jurusanKode} · Level {r.level} · Bacaan {r.urutan}: {r.judul} · dikirim {r.dikirim}
          </div>
        </div>
        {r.dinilai && !tersimpan && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            Sudah dinilai: {r.score}
          </span>
        )}
      </div>

      {/* Ringkasan siswa */}
      <div className="mt-3 rounded-xl border border-violet-200/60 bg-violet-50/40 p-3 dark:border-violet-800/50 dark:bg-violet-950/20">
        <div className="mb-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
          Ringkasan siswa ({r.wordCount} kata)
        </div>
        <p className="whitespace-pre-line text-sm leading-relaxed">{r.ringkasanSiswa}</p>
      </div>

      {/* Acuan: teks asli + poin kunci */}
      <button
        onClick={() => setBukaTeks((v) => !v)}
        className="mt-2 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        {bukaTeks ? "▲ Sembunyikan acuan" : "▼ Lihat teks asli & poin kunci"}
      </button>
      {bukaTeks && (
        <div className="mt-2 flex flex-col gap-2 rounded-xl border border-black/10 p-3 text-sm dark:border-white/15">
          <div>
            <div className="mb-1 text-xs font-semibold text-zinc-500">Teks asli</div>
            <p className="whitespace-pre-line leading-relaxed">{r.teksAsli}</p>
          </div>
          {r.poinKunci.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-semibold text-zinc-500">
                Poin kunci (idealnya tercakup)
              </div>
              <ul className="list-disc pl-5 text-zinc-600 dark:text-zinc-300">
                {r.poinKunci.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Nilai cepat */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-zinc-500">Nilai cepat:</span>
        {CEPAT.map((c) => (
          <button
            key={c.v}
            type="button"
            onClick={() => setSkor(String(c.v))}
            className="rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors"
            style={{
              borderColor: c.color + "66",
              color: c.color,
              backgroundColor: skor === String(c.v) ? c.color + "22" : "transparent",
            }}
          >
            {c.label} · {c.v}
          </button>
        ))}
      </div>

      {/* Input nilai */}
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-zinc-500">Skor (0–100)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={skor}
            onChange={(e) => setSkor(e.target.value)}
            className="w-24 rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-white/20"
          />
        </label>
        <label className="min-w-[12rem] flex-1 text-sm">
          <span className="mb-1 block text-xs font-medium text-zinc-500">Catatan (opsional)</span>
          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="mis. Ide pokok sudah tercakup, tingkatkan kalimatmu."
            className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-white/20"
          />
        </label>
        <button
          onClick={simpan}
          disabled={pending || tersimpan || !valid}
          className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 text-sm font-bold text-white shadow disabled:opacity-50"
        >
          {tersimpan ? "Tersimpan ✓" : pending ? "Menyimpan…" : "Simpan nilai"}
        </button>
      </div>

      {/* Catatan siap pakai */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {CHIP_CATATAN.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFeedback((f) => (f.trim() ? f.trimEnd() + " " + c : c))}
            className="rounded-full border border-black/10 px-2.5 py-1 text-xs text-zinc-600 hover:bg-black/5 dark:border-white/15 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            + {c}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
