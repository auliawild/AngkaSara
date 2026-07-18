"use client";
/**
 * Isian & blok tanda tangan raport (Wali Kelas + Kepala Sekolah, masing-masing nama & NIP).
 * Dipakai bersama oleh raport 1 siswa maupun cetak sekelas: `TandaTanganProvider` menyimpan
 * nilainya sekali (localStorage), `PanelTandaTangan` = form isian (no-print), `BlokTandaTangan`
 * = blok yang ikut tercetak di tiap lembar raport.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const KUNCI = "angkasara-ttd-raport";

export interface DataTtd {
  wali: string;
  waliNip: string;
  kepala: string;
  kepalaNip: string;
}
const KOSONG: DataTtd = { wali: "", waliNip: "", kepala: "", kepalaNip: "" };

const Ctx = createContext<{ data: DataTtd; set: (p: Partial<DataTtd>) => void }>({
  data: KOSONG,
  set: () => {},
});

export function TandaTanganProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DataTtd>(KOSONG);
  const [siap, setSiap] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KUNCI);
      if (raw) setData({ ...KOSONG, ...(JSON.parse(raw) as Partial<DataTtd>) });
    } catch {
      /* abaikan */
    }
    setSiap(true);
  }, []);

  useEffect(() => {
    if (!siap) return;
    try {
      localStorage.setItem(KUNCI, JSON.stringify(data));
    } catch {
      /* abaikan */
    }
  }, [data, siap]);

  return (
    <Ctx.Provider value={{ data, set: (p) => setData((d) => ({ ...d, ...p })) }}>{children}</Ctx.Provider>
  );
}

/** Form isian nama & NIP pejabat — tidak ikut tercetak. */
export function PanelTandaTangan() {
  const { data, set } = useContext(Ctx);
  const inp =
    "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/20";
  const lab = "mb-1 block text-xs font-medium text-zinc-500";

  return (
    <section className="no-print rounded-xl border border-dashed border-black/15 p-4 dark:border-white/20">
      <h2 className="text-sm font-semibold">✍️ Penanda tangan raport</h2>
      <p className="mt-0.5 text-xs text-zinc-500">
        Terisi otomatis pada semua lembar raport yang dicetak. Tersimpan di browser ini.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className={lab}>Nama Wali Kelas</span>
          <input className={inp} value={data.wali} onChange={(e) => set({ wali: e.target.value })} placeholder="mis. Budi Santoso, S.Pd" />
        </label>
        <label className="text-sm">
          <span className={lab}>NIP Wali Kelas</span>
          <input className={inp} value={data.waliNip} onChange={(e) => set({ waliNip: e.target.value })} placeholder="mis. 198501012010011001" />
        </label>
        <label className="text-sm">
          <span className={lab}>Nama Kepala Sekolah</span>
          <input className={inp} value={data.kepala} onChange={(e) => set({ kepala: e.target.value })} placeholder="Nama kepala sekolah" />
        </label>
        <label className="text-sm">
          <span className={lab}>NIP Kepala Sekolah</span>
          <input className={inp} value={data.kepalaNip} onChange={(e) => set({ kepalaNip: e.target.value })} placeholder="NIP kepala sekolah" />
        </label>
      </div>
    </section>
  );
}

const GARIS = "( ................................ )";

/** Blok tanda tangan yang tercetak di tiap lembar raport. */
export function BlokTandaTangan({ kota, tanggal }: { kota: string; tanggal: string }) {
  const { data } = useContext(Ctx);
  return (
    <section className="mt-8 grid grid-cols-2 gap-6 text-sm">
      <div className="text-center">
        <p>Mengetahui,</p>
        <p>Wali Kelas</p>
        <div className="h-16" />
        <p className="border-t border-zinc-400 pt-1 font-semibold">{data.wali.trim() || GARIS}</p>
        {data.waliNip.trim() && <p className="text-xs text-zinc-600">NIP. {data.waliNip.trim()}</p>}
      </div>
      <div className="text-center">
        <p>
          {kota}, {tanggal}
        </p>
        <p>Kepala Sekolah</p>
        <div className="h-16" />
        <p className="border-t border-zinc-400 pt-1 font-semibold">{data.kepala.trim() || GARIS}</p>
        {data.kepalaNip.trim() && <p className="text-xs text-zinc-600">NIP. {data.kepalaNip.trim()}</p>}
      </div>
    </section>
  );
}
