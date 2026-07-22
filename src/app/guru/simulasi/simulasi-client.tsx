"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  simMulaiDiagnostik,
  simNilaiDiagnostik,
  simMulaiArena,
  simNilaiArena,
  simNilaiBacaan,
  type SimTopik,
  type SimBacaanKlien,
} from "@/server/simulasi";

/* ---------- Papan skor lokal (localStorage — "tersimpan dalam simulasi") ---------- */
const KEY = "angkasara-sim-papan";
interface Skor {
  ts: number;
  jenis: "Diagnostik" | "Arena" | "Bacaan";
  label: string;
  skor: number; // persen 0..100
  detail: string;
}
function muatPapan(): Skor[] {
  if (typeof window === "undefined") return [];
  try {
    return (JSON.parse(localStorage.getItem(KEY) || "[]") as Skor[]).filter((x) => typeof x?.skor === "number");
  } catch {
    return [];
  }
}
function simpanPapan(list: Skor[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-50)));
  } catch {
    /* abaikan kuota */
  }
}

type Soal = { ctx?: string; qHTML: string; icon: string; topicName: string; level: number; options: { key: string; html: string }[] };

export default function SimulasiClient({ topik, bacaan }: { topik: SimTopik[]; bacaan: SimBacaanKlien[] }) {
  const [tab, setTab] = useState<"math" | "baca">("math");
  const [papan, setPapan] = useState<Skor[]>([]);
  // Muat papan dari localStorage SETELAH mount (hindari hydration mismatch: server tak punya localStorage).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setPapan(muatPapan()), []);

  function catat(s: Omit<Skor, "ts">) {
    const next = [...muatPapan(), { ...s, ts: Date.now() }];
    simpanPapan(next);
    setPapan(next);
  }
  function reset() {
    simpanPapan([]);
    setPapan([]);
  }

  const terbaik = (jenis: Skor["jenis"]) => {
    const xs = papan.filter((p) => p.jenis === jenis);
    return xs.length ? Math.max(...xs.map((p) => p.skor)) : null;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        🧪 Mode simulasi/ujicoba. Hasil <b>tidak disimpan ke basis data</b> dan <b>tidak masuk peringkat siswa</b>.
        Papan skor tersimpan di peramban ini saja.
      </div>

      <div className="inline-flex w-fit rounded-xl bg-black/5 p-1 text-sm font-semibold dark:bg-white/10">
        {(["math", "baca"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={"rounded-lg px-4 py-1.5 " + (tab === t ? "bg-white shadow dark:bg-zinc-800" : "text-zinc-500")}
          >
            {t === "math" ? "🧮 SKIBA Math" : "📖 SKIBACA"}
          </button>
        ))}
      </div>

      {tab === "math" ? <MathPanel topik={topik} catat={catat} /> : <BacaPanel bacaan={bacaan} catat={catat} />}

      {/* Papan skor */}
      <section className="as-pop rounded-2xl border border-black/5 bg-white/60 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between border-b border-black/5 px-4 py-2.5 dark:border-white/10">
          <h2 className="text-sm font-extrabold">🏆 Papan Skor Simulasi</h2>
          {papan.length > 0 && (
            <button onClick={reset} className="text-xs font-semibold text-red-600 hover:underline dark:text-red-400">
              Kosongkan
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 p-4">
          {(["Diagnostik", "Arena", "Bacaan"] as const).map((j) => {
            const b = terbaik(j);
            return (
              <div key={j} className="rounded-xl bg-black/[0.03] p-3 text-center dark:bg-white/[0.04]">
                <div className="text-lg font-black">{b == null ? "—" : `${b}`}</div>
                <div className="text-[11px] font-semibold text-zinc-500">Terbaik {j}</div>
              </div>
            );
          })}
        </div>
        {papan.length > 0 && (
          <ul className="max-h-52 divide-y divide-black/5 overflow-y-auto px-4 pb-3 text-xs dark:divide-white/5">
            {[...papan].reverse().slice(0, 12).map((p, i) => (
              <li key={i} className="flex items-center justify-between gap-2 py-1.5">
                <span className="min-w-0 flex-1 truncate">
                  <b>{p.jenis}</b> · {p.label}
                </span>
                <span className="shrink-0 tabular-nums text-zinc-500">{p.detail}</span>
                <span className="w-10 shrink-0 text-right font-bold tabular-nums">{p.skor}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ===================== SKIBA MATH ===================== */
function MathPanel({ topik, catat }: { topik: SimTopik[]; catat: (s: Omit<Skor, "ts">) => void }) {
  const [topicId, setTopicId] = useState(topik[0]?.id ?? "");
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sesi, setSesi] = useState<{ soal: Soal[]; token: string; kind: "diag" | "arena"; judul: string; detik: number; warna: string } | null>(null);
  const [hasil, setHasil] = useState<{ skor: number; ringkas: string } | null>(null);

  const toSoal = (
    arr: { ctx: string; qHTML: string; icon: string; topicName: string; level: number; options: { label: string; value: string }[] }[],
  ): Soal[] =>
    arr.map((s) => ({
      ctx: s.ctx,
      qHTML: s.qHTML,
      icon: s.icon,
      topicName: s.topicName,
      level: s.level,
      options: s.options.map((o) => ({ key: o.value, html: o.label })),
    }));

  async function mulaiDiag() {
    setError(null);
    setLoading(true);
    try {
      const r = await simMulaiDiagnostik();
      setHasil(null);
      setSesi({ soal: toSoal(r.soal), token: r.token, kind: "diag", judul: "Tes Diagnostik", detik: r.detikPerSoal, warna: "#7c3aed" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  async function mulaiArena() {
    setError(null);
    setLoading(true);
    try {
      const r = await simMulaiArena({ topicId, level });
      const nama = topik.find((t) => t.id === topicId)?.name ?? topicId;
      setHasil(null);
      setSesi({ soal: toSoal(r.soal), token: r.token, kind: "arena", judul: `${nama} · Level ${level}`, detik: r.detikPerSoal, warna: "#7c3aed" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  async function selesai(jawab: (string | null)[]) {
    if (!sesi) return;
    setLoading(true);
    try {
      if (sesi.kind === "diag") {
        const r = await simNilaiDiagnostik({ token: sesi.token, jawab });
        if (!r.ok) return setError(r.error);
        catat({ jenis: "Diagnostik", label: sesi.judul, skor: r.hasil.pct, detail: `${r.hasil.benar}/${r.hasil.total} · saran Lv${r.hasil.levelRata}` });
        setHasil({ skor: r.hasil.pct, ringkas: `${r.hasil.benar}/${r.hasil.total} benar · ${r.hasil.band} · saran mulai Level ${r.hasil.levelRata}` });
      } else {
        const r = await simNilaiArena({ token: sesi.token, jawab });
        if (!r.ok) return setError(r.error);
        catat({ jenis: "Arena", label: sesi.judul, skor: r.hasil.skor, detail: `${"⭐".repeat(r.hasil.bintang)} ${r.hasil.points} poin` });
        setHasil({ skor: r.hasil.skor, ringkas: `${r.hasil.benar}/${r.hasil.total} benar · ${"⭐".repeat(r.hasil.bintang)} · ${r.hasil.points} poin (combo maks ${r.hasil.bestCombo}×)` });
      }
      setSesi(null);
    } finally {
      setLoading(false);
    }
  }

  if (sesi)
    return (
      <RunnerBerurut
        soal={sesi.soal}
        judul={sesi.judul}
        detikPerSoal={sesi.detik}
        warna={sesi.warna}
        onSelesai={selesai}
        busy={loading}
        onBatal={() => setSesi(null)}
      />
    );

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      {hasil && <KartuHasil skor={hasil.skor} ringkas={hasil.ringkas} />}

      <div className="as-pop rounded-2xl border border-black/5 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
        <h3 className="text-sm font-extrabold">🎯 Tes Diagnostik</h3>
        <p className="mt-1 text-xs text-zinc-500">30 soal numerasi campuran, seperti diagnostik siswa. Menghasilkan saran level.</p>
        <button onClick={mulaiDiag} disabled={loading} className="mt-3 rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          {loading ? "Menyiapkan…" : "Mulai Diagnostik"}
        </button>
      </div>

      <div className="as-pop rounded-2xl border border-black/5 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
        <h3 className="text-sm font-extrabold">🏟️ Arena (contoh level)</h3>
        <p className="mt-1 text-xs text-zinc-500">10 soal satu topik & level. Semua level terbuka di simulasi.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className="rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/20">
            {topik.map((t) => (
              <option key={t.id} value={t.id}>
                {t.icon} {t.name}
              </option>
            ))}
          </select>
          <select value={level} onChange={(e) => setLevel(Number(e.target.value))} className="rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm dark:border-white/20">
            {[1, 5, 10, 15, 20].map((l) => (
              <option key={l} value={l}>
                Level {l}
              </option>
            ))}
          </select>
          <button onClick={mulaiArena} disabled={loading || !topicId} className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            {loading ? "Menyiapkan…" : "Mulai Arena"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== SKIBACA ===================== */
function BacaPanel({ bacaan, catat }: { bacaan: SimBacaanKlien[]; catat: (s: Omit<Skor, "ts">) => void }) {
  const [aktif, setAktif] = useState<SimBacaanKlien | null>(null);
  const [jawab, setJawab] = useState<(number | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasil, setHasil] = useState<{ skor: number; ringkas: string } | null>(null);

  function buka(b: SimBacaanKlien) {
    setHasil(null);
    setError(null);
    setAktif(b);
    setJawab(new Array(b.soal.length).fill(null));
  }
  async function selesai() {
    if (!aktif) return;
    setLoading(true);
    setError(null);
    try {
      const r = await simNilaiBacaan({ passageId: aktif.id, jawab });
      if (!r.ok) return setError(r.error);
      catat({ jenis: "Bacaan", label: `${aktif.title} (Lv${aktif.level})`, skor: r.hasil.percent, detail: `${r.hasil.benar}/${r.hasil.total} · ${r.hasil.badge.label}` });
      setHasil({ skor: r.hasil.percent, ringkas: `${r.hasil.benar}/${r.hasil.total} benar · ${r.hasil.badge.text}` });
      setAktif(null);
    } finally {
      setLoading(false);
    }
  }

  if (bacaan.length === 0)
    return <p className="rounded-2xl border border-black/5 bg-white/60 p-4 text-sm text-zinc-500 backdrop-blur dark:border-white/10 dark:bg-white/5">Belum ada bacaan contoh di basis data. Jalankan seed SKIBACA lebih dulu.</p>;

  if (aktif) {
    const terjawab = jawab.filter((x) => x != null).length;
    return (
      <div className="flex flex-col gap-4">
        <button onClick={() => setAktif(null)} className="w-fit text-xs font-semibold text-violet-600 hover:underline dark:text-violet-300">
          ← Daftar bacaan
        </button>
        <article className="as-pop rounded-2xl border border-black/5 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <h3 className="font-extrabold">{aktif.icon} {aktif.title}</h3>
          <p className="mt-0.5 text-[11px] text-zinc-500">{aktif.jurusanFull} · Level {aktif.level} · {aktif.wordCount} kata</p>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{aktif.text}</p>
        </article>
        <div className="flex flex-col gap-3">
          {aktif.soal.map((s, qi) => (
            <div key={s.urutan} className="as-pop rounded-2xl border border-black/5 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <p className="text-sm font-semibold">{qi + 1}. {s.q}</p>
              <div className="mt-2 flex flex-col gap-1.5">
                {s.options.map((o, oi) => {
                  const on = jawab[qi] === oi;
                  return (
                    <button
                      key={oi}
                      onClick={() => setJawab((j) => j.map((v, k) => (k === qi ? oi : v)))}
                      className={"rounded-lg border px-3 py-1.5 text-left text-sm transition-colors " + (on ? "border-amber-500 bg-amber-50 font-semibold dark:border-amber-500 dark:bg-amber-950/40" : "border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10")}
                    >
                      {String.fromCharCode(65 + oi)}. {o}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <button onClick={selesai} disabled={loading || terjawab < aktif.soal.length} className="w-fit rounded-lg bg-amber-600 px-5 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50">
          {loading ? "Menilai…" : terjawab < aktif.soal.length ? `Jawab semua dulu (${terjawab}/${aktif.soal.length})` : "Selesai & Nilai"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {hasil && <KartuHasil skor={hasil.skor} ringkas={hasil.ringkas} />}
      <p className="text-xs text-zinc-500">Pilih bacaan contoh untuk mencoba kuis pemahaman:</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {bacaan.map((b) => (
          <button key={b.id} onClick={() => buka(b)} className="flex items-center gap-3 rounded-2xl border border-black/10 p-3 text-left hover:border-amber-400 hover:bg-amber-50/40 dark:border-white/15 dark:hover:bg-amber-950/10">
            <span className="text-xl">{b.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{b.title}</span>
              <span className="block text-[11px] text-zinc-500">Level {b.level} · {b.soal.length} soal · {b.wordCount} kata</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===================== Runner arena (mirip Kuis siswa: timer, header topik, auto-lanjut) ===================== */
function RunnerBerurut({
  soal,
  judul,
  detikPerSoal,
  warna,
  onSelesai,
  busy,
  onBatal,
}: {
  soal: Soal[];
  judul: string;
  detikPerSoal: number;
  warna: string;
  onSelesai: (jawab: (string | null)[]) => void;
  busy: boolean;
  onBatal: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [pilih, setPilih] = useState<string | null>(null);
  const [sisa, setSisa] = useState(detikPerSoal);
  const [lock, setLock] = useState(false);
  const jawabRef = useRef<(string | null)[]>(soal.map(() => null));
  const selesaiRef = useRef(false);

  const lanjut = useCallback(
    (val: string | null) => {
      setLock(true);
      setPilih(val);
      jawabRef.current[idx] = val;
      window.setTimeout(() => {
        if (idx + 1 >= soal.length) {
          if (!selesaiRef.current) {
            selesaiRef.current = true;
            onSelesai(jawabRef.current.slice());
          }
        } else {
          setIdx(idx + 1);
          setPilih(null);
          setSisa(detikPerSoal);
          setLock(false);
        }
      }, 380);
    },
    [idx, soal.length, detikPerSoal, onSelesai],
  );

  // Hitung mundur per soal (auto-lanjut saat waktu habis) — seperti arena siswa.
  useEffect(() => {
    if (lock) return;
    if (sisa <= 0) {
      lanjut(null);
      return;
    }
    const t = window.setTimeout(() => setSisa((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [sisa, lock, lanjut]);

  const cur = soal[idx];
  const total = soal.length;
  const frac = Math.max(0, sisa / detikPerSoal);
  const timerWarna = frac > 0.5 ? warna : frac > 0.25 ? "#e0a800" : "#dc2626";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate text-sm font-extrabold">{judul}</span>
          <button onClick={onBatal} className="shrink-0 text-xs font-semibold text-red-600 hover:underline dark:text-red-400">
            Batal
          </button>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: `conic-gradient(${timerWarna} ${frac * 360}deg, rgba(0,0,0,.08) 0deg)` }}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
            {sisa}
          </span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
        <div className="h-full transition-all" style={{ width: `${(idx / total) * 100}%`, backgroundColor: warna }} />
      </div>

      <div className="as-pop rounded-2xl border border-black/5 bg-white/60 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
        <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500">
          <span>{cur.icon}</span>
          <span>{cur.topicName}</span>
          <span className="ml-auto rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">Lv {cur.level}</span>
        </div>
        {cur.ctx && <p className="mb-1 text-xs text-zinc-400">{cur.ctx}</p>}
        <div className="text-lg font-medium" dangerouslySetInnerHTML={{ __html: cur.qHTML }} />
        <div className="mt-4 grid gap-2">
          {cur.options.map((o, i) => {
            const aktif = pilih === o.key;
            return (
              <button
                key={i}
                disabled={lock || busy}
                onClick={() => lanjut(o.key)}
                className={
                  "rounded-lg border px-4 py-2.5 text-left transition-colors disabled:cursor-default " +
                  (aktif ? "border-violet-600 bg-violet-50 dark:border-violet-500 dark:bg-violet-950/40" : "border-black/15 hover:border-violet-400 dark:border-white/20")
                }
              >
                <span className="mr-2 font-semibold">{String.fromCharCode(65 + i)}.</span>
                <span dangerouslySetInnerHTML={{ __html: o.html }} />
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-center text-xs text-zinc-400">
        Pilih jawaban untuk lanjut otomatis · dinilai saat selesai (simulasi — tak disimpan)
      </p>
    </div>
  );
}

function KartuHasil({ skor, ringkas }: { skor: number; ringkas: string }) {
  const warna = skor >= 75 ? "#16a34a" : skor >= 60 ? "#ca8a04" : "#dc2626";
  return (
    <div className="as-pop flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
      <div className="text-3xl font-black tabular-nums" style={{ color: warna }}>{skor}</div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-bold">Hasil simulasi</p>
        <p className="text-zinc-500">{ringkas}</p>
      </div>
    </div>
  );
}
