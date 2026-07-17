"use client";
/**
 * SKIBA Math — UI klien (Phase 2). Orkestrasi hub/diagnostik/arena/peringkat.
 *
 * Keamanan: soal datang TERSANITASI dari server (tanpa kunci), jadi TAK ADA
 * umpan-balik benar/salah saat mengerjakan (persis Check Point). "Juice" game
 * (bintang, combo, confetti, suara sukses) tampil di LAYAR HASIL berdasarkan
 * penilaian server. Suara netral (klik/tik) tetap ada saat bermain.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  muatSkiba,
  mulaiArena,
  submitArena,
  mulaiDiagnostik,
  submitDiagnostik,
  muatPeringkat,
  type SkibaData,
  type TopikState,
  type SubmitArenaHasil,
  type SubmitDiagHasil,
  type BarisPeringkat,
} from "@/server/skiba";
import type { SoalKlien } from "@/lib/skiba";

/* ===================== util suara & confetti (klien murni) ===================== */
type Sfx = ReturnType<typeof buatSfx>;
function buatSfx() {
  let ctx: AudioContext | null = null;
  const ensure = () => {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    return ctx;
  };
  const beep = (freq: number, dur: number, type: OscillatorType = "sine", vol = 0.18, delay = 0) => {
    try {
      const a = ensure();
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = type;
      o.frequency.value = freq;
      o.connect(g);
      g.connect(a.destination);
      const t0 = a.currentTime + delay;
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    } catch {
      /* audio diblokir → abaikan */
    }
  };
  return {
    correct: () => {
      beep(880, 0.12, "triangle");
      beep(1320, 0.14, "triangle", 0.16, 0.08);
    },
    wrong: () => beep(180, 0.25, "sawtooth", 0.2),
    tick: () => beep(600, 0.05, "square", 0.06),
    levelUp: () => [523, 659, 784, 1046].forEach((f, i) => beep(f, 0.16, "triangle", 0.18, i * 0.1)),
    click: () => beep(440, 0.06, "sine", 0.1),
  };
}

function confetti(n = 120) {
  if (typeof document === "undefined") return;
  let cvs = document.getElementById("skiba-confetti") as HTMLCanvasElement | null;
  if (!cvs) {
    cvs = document.createElement("canvas");
    cvs.id = "skiba-confetti";
    cvs.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:60";
    document.body.appendChild(cvs);
  }
  const ctx = cvs.getContext("2d");
  if (!ctx) return;
  cvs.width = window.innerWidth;
  cvs.height = window.innerHeight;
  const colors = ["#0057ff", "#00c2ff", "#ffd166", "#06d6a0", "#ef476f", "#8338ec"];
  const parts = Array.from({ length: n }, () => ({
    x: Math.random() * cvs!.width,
    y: -20 - Math.random() * cvs!.height * 0.3,
    r: 6 + Math.random() * 6,
    c: colors[Math.floor(Math.random() * colors.length)],
    vy: 3 + Math.random() * 4,
    vx: -2 + Math.random() * 4,
    rot: Math.random() * 6.28,
    vr: -0.2 + Math.random() * 0.4,
  }));
  let frames = 0;
  const loop = () => {
    ctx.clearRect(0, 0, cvs!.width, cvs!.height);
    let alive = false;
    for (const p of parts) {
      p.y += p.vy;
      p.x += p.vx;
      p.rot += p.vr;
      if (p.y < cvs!.height + 20) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
      ctx.restore();
    }
    frames++;
    if (alive && frames < 300) requestAnimationFrame(loop);
    else ctx.clearRect(0, 0, cvs!.width, cvs!.height);
  };
  requestAnimationFrame(loop);
}

function levelBand(L: number): string {
  if (L <= 4) return "Pemula";
  if (L <= 8) return "Penantang";
  if (L <= 12) return "Mahir";
  if (L <= 16) return "Jagoan";
  return "Master";
}
function levelColor(L: number): string {
  const hue = 130 - ((L - 1) / 19) * 130;
  return `hsl(${hue.toFixed(0)},70%,36%)`;
}

/* ===================== komponen utama ===================== */
type Mode = "hub" | "diag" | "arena" | "peringkat";

export default function SkibaClient({ awal }: { awal: SkibaData }) {
  const [data, setData] = useState<SkibaData>(awal);
  const [mode, setMode] = useState<Mode>("hub");
  const sfxRef = useRef<Sfx | null>(null);
  const sfx = () => (sfxRef.current ??= buatSfx());

  const segarkan = useCallback(async () => {
    try {
      setData(await muatSkiba());
    } catch {
      /* abaikan */
    }
  }, []);

  return (
    <>
      <nav className="flex flex-wrap gap-2">
        {(
          [
            ["hub", "🏠 Topik"],
            ["diag", "🧪 Diagnostik"],
            ["peringkat", "🏆 Peringkat"],
          ] as [Mode, string][]
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => {
              sfx().click();
              setMode(m);
            }}
            className={
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors " +
              (mode === m || (mode === "arena" && m === "hub")
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-teal-600/25"
                : "border border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10")
            }
          >
            {label}
          </button>
        ))}
      </nav>

      {mode === "hub" && (
        <Hub
          data={data}
          onPilihArena={() => setMode("arena")}
          sfx={sfx}
        />
      )}
      {mode === "arena" && (
        <Arena data={data} sfx={sfx} onSelesai={segarkan} onKeluar={() => setMode("hub")} />
      )}
      {mode === "diag" && (
        <Diagnostik
          sisa={data.diagSisa}
          sfx={sfx}
          onSelesai={segarkan}
          onKeHub={() => setMode("hub")}
        />
      )}
      {mode === "peringkat" && <Peringkat />}
    </>
  );
}

/* ===================== HUB / grid topik ===================== */
function Hub({
  data,
  onPilihArena,
  sfx,
}: {
  data: SkibaData;
  onPilihArena: () => void;
  sfx: () => Sfx;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total Skor" nilai={data.totalScore.toLocaleString("id-ID")} />
        <Stat label="Topik dibuka" nilai={`${data.topik.filter((t) => t.maxUnlocked > 1).length}/10`} />
        <Stat
          label="Level dilalui"
          nilai={String(data.topik.reduce((s, t) => s + t.progress.length, 0))}
        />
        <Stat label="Sisa diagnostik" nilai={`${data.diagSisa}×`} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {data.topik.map((t) => (
          <button
            key={t.topicId}
            onClick={() => {
              sfx().click();
              onPilihArena();
            }}
            className="as-lift as-pop flex items-center gap-3 rounded-2xl border border-black/10 bg-white/60 p-4 text-left dark:border-white/15 dark:bg-white/5"
          >
            <span className="text-3xl">{t.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{t.name}</span>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold text-white"
                  style={{ backgroundColor: levelColor(t.maxUnlocked) }}
                >
                  Lv {t.maxUnlocked}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                <span>⭐ {t.score.toLocaleString("id-ID")}</span>
                <span>·</span>
                <span>{t.progress.length} level selesai</span>
              </div>
              {/* bar progres menuju level 20 */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(t.maxUnlocked / 20) * 100}%`,
                    backgroundColor: levelColor(t.maxUnlocked),
                  }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-zinc-400">
        Belum tahu mulai dari mana? Kerjakan 🧪 Tes Diagnostik dulu — level tiap topik akan terbuka
        sesuai kemampuanmu.
      </p>
    </div>
  );
}

function Stat({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-gradient-to-br from-black/[.03] to-transparent p-3 text-center shadow-sm dark:border-white/10 dark:from-white/[.06]">
      <div className="text-xl font-black">{nilai}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}

/** Kartu statistik untuk di atas latar gradien (teks putih). */
function StatGlass({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="rounded-2xl bg-white/20 px-2 py-2.5 text-center backdrop-blur">
      <div className="text-lg font-black leading-none">{nilai}</div>
      <div className="mt-1 text-[10px] font-medium leading-tight text-white/80">{label}</div>
    </div>
  );
}

/* ===================== ARENA ===================== */
type FaseArena = "pilih" | "main" | "hasil";
function Arena({
  data,
  sfx,
  onSelesai,
  onKeluar,
}: {
  data: SkibaData;
  sfx: () => Sfx;
  onSelesai: () => void;
  onKeluar: () => void;
}) {
  const [topicId, setTopicId] = useState<string | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const [fase, setFase] = useState<FaseArena>("pilih");
  const [soal, setSoal] = useState<SoalKlien[]>([]);
  const [token, setToken] = useState("");
  const [detik, setDetik] = useState(15);
  const [hasil, setHasil] = useState<SubmitArenaHasil["hasil"] | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topik = data.topik.find((t) => t.topicId === topicId) ?? null;

  async function mulai() {
    if (!topicId || !level) return;
    setPending(true);
    setError(null);
    try {
      const res = await mulaiArena(topicId, level);
      setSoal(res.soal);
      setToken(res.token);
      setDetik(res.detikPerSoal);
      setFase("main");
    } catch (e) {
      setError((e as Error).message || "Gagal memulai.");
    } finally {
      setPending(false);
    }
  }

  const kumpul = useCallback(
    async (jawab: (string | null)[]) => {
      setPending(true);
      setError(null);
      try {
        const res = await submitArena({ token, jawab });
        if (!res.ok || !res.hasil) {
          setError(res.error ?? "Gagal mengumpulkan.");
          setFase("pilih");
          return;
        }
        setHasil(res.hasil);
        setFase("hasil");
        const s = sfx();
        if (res.hasil.bintang >= 2) {
          s.levelUp();
          confetti(res.hasil.bintang === 3 ? 180 : 110);
        } else {
          s.wrong();
        }
        onSelesai();
      } catch (e) {
        setError((e as Error).message || "Gagal mengumpulkan.");
        setFase("pilih");
      } finally {
        setPending(false);
      }
    },
    [token, sfx, onSelesai],
  );

  if (fase === "main") {
    return <Kuis soal={soal} detikPerSoal={detik} warna="#0057ff" sfx={sfx} onSelesai={kumpul} disabled={pending} />;
  }

  if (fase === "hasil" && hasil) {
    return (
      <div
        className={
          "as-pop rounded-3xl p-6 text-center text-white shadow-xl " +
          (hasil.bintang === 3
            ? "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-orange-500/25"
            : hasil.bintang === 2
              ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-teal-600/25"
              : "bg-gradient-to-br from-slate-500 to-slate-700 shadow-slate-700/20")
        }
      >
        <div className="text-5xl as-float">{"⭐".repeat(hasil.bintang) + "☆".repeat(3 - hasil.bintang)}</div>
        <p className="mt-2 text-sm font-bold text-white/90">
          {hasil.bintang === 3
            ? "Sempurna! Penguasaan sangat baik 🎉"
            : hasil.bintang === 2
              ? "Bagus! Sedikit lagi menuju sempurna 💪"
              : "Terus berlatih, kamu pasti bisa! 🌱"}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <StatGlass label="Poin" nilai={hasil.points.toLocaleString("id-ID")} />
          <StatGlass label="Benar" nilai={`${hasil.benar}/${hasil.total}`} />
          <StatGlass label="Combo" nilai={`x${hasil.bestCombo}`} />
        </div>
        {hasil.unlockNext && (
          <p className="mt-4 rounded-xl bg-white/20 px-3 py-2 text-sm font-bold ring-1 ring-white/30">
            🔓 Level {hasil.unlockNext} terbuka untuk {hasil.topicName}!
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              setFase("pilih");
              setHasil(null);
            }}
            className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-zinc-800 shadow transition-transform hover:scale-105"
          >
            🎮 Main lagi
          </button>
          <button
            onClick={onKeluar}
            className="rounded-full bg-white/20 px-5 py-2.5 text-sm font-semibold ring-1 ring-white/40 backdrop-blur transition-colors hover:bg-white/30"
          >
            ← Kembali ke topik
          </button>
        </div>
      </div>
    );
  }

  // fase pilih
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-2 text-sm font-medium text-zinc-500">1. Pilih topik</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {data.topik.map((t) => (
            <button
              key={t.topicId}
              onClick={() => {
                sfx().click();
                setTopicId(t.topicId);
                setLevel(Math.min(t.recLevel || 1, t.maxUnlocked));
              }}
              className={
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors " +
                (topicId === t.topicId
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40"
                  : "border-black/15 hover:border-blue-400 dark:border-white/20")
              }
            >
              <span className="text-lg">{t.icon}</span>
              <span className="min-w-0 flex-1 truncate">{t.name}</span>
              <span className="shrink-0 text-xs text-zinc-400">Lv{t.maxUnlocked}</span>
            </button>
          ))}
        </div>
      </div>

      {topik && (
        <div>
          <div className="mb-2 text-sm font-medium text-zinc-500">
            2. Pilih level (terbuka s/d {topik.maxUnlocked})
          </div>
          <div className="grid grid-cols-10 gap-1.5">
            {Array.from({ length: 20 }, (_, i) => i + 1).map((L) => {
              const terkunci = L > topik.maxUnlocked;
              const aktif = level === L;
              return (
                <button
                  key={L}
                  disabled={terkunci}
                  onClick={() => {
                    sfx().click();
                    setLevel(L);
                  }}
                  title={terkunci ? "Terkunci" : `Level ${L} · ${levelBand(L)}`}
                  className={
                    "aspect-square rounded-md text-xs font-bold transition-transform " +
                    (terkunci
                      ? "cursor-not-allowed bg-black/5 text-zinc-300 dark:bg-white/5 dark:text-zinc-600"
                      : aktif
                        ? "scale-110 text-white ring-2 ring-offset-1 dark:ring-offset-zinc-900"
                        : "text-white opacity-80 hover:opacity-100")
                  }
                  style={terkunci ? undefined : { backgroundColor: levelColor(L) }}
                >
                  {terkunci ? "🔒" : L}
                </button>
              );
            })}
          </div>
          {level && (
            <p className="mt-2 text-sm">
              Siap main: <b>{topik.icon} {topik.name}</b> · Level {level} ({levelBand(level)})
              {topik.recLevel > 1 && level === topik.recLevel && (
                <span className="text-zinc-400"> · rekomendasi diagnostik</span>
              )}
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onKeluar}
          className="rounded-lg border border-black/15 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          ←
        </button>
        <button
          onClick={mulai}
          disabled={!topicId || !level || pending}
          className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-600/25 transition-transform hover:scale-105 disabled:scale-100 disabled:opacity-40"
        >
          {pending ? "Menyiapkan…" : "▶️ MULAI PERMAINAN"}
        </button>
      </div>
    </div>
  );
}

/* ===================== DIAGNOSTIK ===================== */
type FaseDiag = "intro" | "main" | "hasil";
function Diagnostik({
  sisa,
  sfx,
  onSelesai,
  onKeHub,
}: {
  sisa: number;
  sfx: () => Sfx;
  onSelesai: () => void;
  onKeHub: () => void;
}) {
  const [fase, setFase] = useState<FaseDiag>("intro");
  const [soal, setSoal] = useState<SoalKlien[]>([]);
  const [token, setToken] = useState("");
  const [detik, setDetik] = useState(15);
  const [hasil, setHasil] = useState<SubmitDiagHasil["hasil"] | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function mulai() {
    setPending(true);
    setError(null);
    try {
      const res = await mulaiDiagnostik();
      setSoal(res.soal);
      setToken(res.token);
      setDetik(res.detikPerSoal);
      setFase("main");
    } catch (e) {
      setError((e as Error).message || "Gagal memulai.");
    } finally {
      setPending(false);
    }
  }

  const kumpul = useCallback(
    async (jawab: (string | null)[]) => {
      setPending(true);
      setError(null);
      try {
        const res = await submitDiagnostik({ token, jawab });
        if (!res.ok || !res.hasil) {
          setError(res.error ?? "Gagal mengumpulkan.");
          setFase("intro");
          return;
        }
        setHasil(res.hasil);
        setFase("hasil");
        sfx().levelUp();
        confetti(res.hasil.pct >= 75 ? 160 : 100);
        onSelesai();
      } catch (e) {
        setError((e as Error).message || "Gagal mengumpulkan.");
        setFase("intro");
      } finally {
        setPending(false);
      }
    },
    [token, sfx, onSelesai],
  );

  if (fase === "main") {
    return <Kuis soal={soal} detikPerSoal={detik} warna="#7c3aed" sfx={sfx} onSelesai={kumpul} disabled={pending} />;
  }

  if (fase === "hasil" && hasil) {
    return (
      <div className="as-pop rounded-3xl border border-black/5 bg-gradient-to-b from-violet-50 to-transparent p-6 shadow-lg dark:border-white/10 dark:from-violet-950/30">
        <h2 className="text-center text-xl font-black">📊 Hasil Tes Diagnostik</h2>
        <div className="mx-auto mt-3 w-fit rounded-full px-5 py-2 text-sm font-bold text-white shadow" style={{ backgroundColor: levelColor(hasil.levelRata) }}>
          🎯 Rata-rata: Level {hasil.levelRata} · {hasil.band}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="Jawaban benar" nilai={`${hasil.benar}/${hasil.total}`} />
          <Stat label="Persentase" nilai={`${hasil.pct}%`} />
        </div>
        <div className="mt-5">
          <h3 className="mb-2 text-sm font-semibold text-zinc-500">Rincian per topik</h3>
          <div className="flex flex-col gap-1.5">
            {hasil.rincian.map((r) => (
              <div key={r.topicId} className="flex items-center gap-2 text-sm">
                <span className="w-32 shrink-0 truncate">
                  {r.icon} {r.topicName}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${r.pct}%`, backgroundColor: levelColor(r.recLevel) }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-xs text-zinc-500">
                  {r.total > 0 ? `${r.benar}/${r.total}` : "—"}
                </span>
                <span className="w-10 shrink-0 text-right text-xs font-semibold">Lv{r.recLevel}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          💡 Level tiap topik di Arena sudah terbuka sesuai rincian di atas — bukan disamaratakan.
        </p>
        <div className="mt-5 flex justify-center">
          <button
            onClick={onKeHub}
            className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-600/25 transition-transform hover:scale-105"
          >
            🎮 Lanjut ke Arena
          </button>
        </div>
      </div>
    );
  }

  // intro
  const habis = sisa <= 0;
  return (
    <div className="rounded-2xl border border-black/10 p-6 dark:border-white/15">
      <h2 className="text-xl font-bold">🧪 Tes Diagnostik Awal</h2>
      <ul className="mt-3 space-y-1.5 text-sm text-zinc-600 dark:text-zinc-300">
        <li>📝 30 soal campuran dari semua topik.</li>
        <li>⏱️ {detik} detik per soal — otomatis lanjut saat habis.</li>
        <li>🎯 Menentukan level awal tiap topik di Arena.</li>
      </ul>
      <p className="mt-3 text-sm font-semibold text-zinc-500">
        {habis
          ? `🚫 Kesempatan sudah habis (maks ${2}×). Hasil terakhir tetap berlaku.`
          : `🎟️ Kesempatan tersisa: ${sisa}×`}
      </p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button
        onClick={mulai}
        disabled={pending || habis}
        className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 font-bold text-white shadow-lg shadow-violet-600/25 transition-transform hover:scale-[1.02] disabled:scale-100 disabled:opacity-40"
      >
        {pending ? "Menyiapkan…" : habis ? "🚫 Kesempatan habis" : "▶️ Mulai Tes Diagnostik"}
      </button>
    </div>
  );
}

/* ===================== KUIS (dipakai arena & diagnostik) ===================== */
function Kuis({
  soal,
  detikPerSoal,
  warna,
  sfx,
  onSelesai,
  disabled,
}: {
  soal: SoalKlien[];
  detikPerSoal: number;
  warna: string;
  sfx: () => Sfx;
  onSelesai: (jawab: (string | null)[]) => void;
  disabled: boolean;
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
      if (val) sfx().click();
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
      }, 420);
    },
    [idx, soal.length, detikPerSoal, onSelesai, sfx],
  );

  // hitung mundur per soal
  useEffect(() => {
    if (lock) return;
    if (sisa <= 0) {
      lanjut(null);
      return;
    }
    const t = window.setTimeout(() => {
      if (sisa <= 4) sfx().tick();
      setSisa((s) => s - 1);
    }, 1000);
    return () => window.clearTimeout(t);
  }, [sisa, lock, lanjut, sfx]);

  const cur = soal[idx];
  const total = soal.length;
  const frac = Math.max(0, sisa / detikPerSoal);
  const timerWarna = frac > 0.5 ? warna : frac > 0.25 ? "#e0a800" : "#dc2626";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-zinc-500">
          Soal {idx + 1} / {total}
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white"
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

      <div className="rounded-2xl border border-black/10 p-5 dark:border-white/15">
        <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500">
          <span>{cur.icon}</span>
          <span>{cur.topicName}</span>
          <span className="ml-auto rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">
            Lv {cur.level}
          </span>
        </div>
        {cur.ctx && <p className="mb-1 text-xs text-zinc-400">{cur.ctx}</p>}
        <div className="text-lg font-medium" dangerouslySetInnerHTML={{ __html: cur.qHTML }} />
        <div className="mt-4 grid gap-2">
          {cur.options.map((o, i) => {
            const aktif = pilih === o.value;
            return (
              <button
                key={i}
                disabled={lock || disabled}
                onClick={() => lanjut(o.value)}
                className={
                  "rounded-lg border px-4 py-2.5 text-left transition-colors disabled:cursor-default " +
                  (aktif
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40"
                    : "border-black/15 hover:border-blue-400 dark:border-white/20")
                }
              >
                <span className="mr-2 font-semibold">{String.fromCharCode(65 + i)}.</span>
                <span dangerouslySetInnerHTML={{ __html: o.label }} />
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-center text-xs text-zinc-400">
        Pilih jawaban untuk lanjut otomatis · hasil dinilai di server saat selesai
      </p>
    </div>
  );
}

/* ===================== PAPAN PERINGKAT ===================== */
function Peringkat() {
  const [rows, setRows] = useState<BarisPeringkat[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const muat = useCallback(async () => {
    setError(null);
    try {
      setRows(await muatPeringkat());
    } catch (e) {
      setError((e as Error).message || "Gagal memuat.");
    }
  }, []);
  useEffect(() => {
    muat();
  }, [muat]);

  const medali = useMemo(() => ["🥇", "🥈", "🥉"], []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (rows === null) return <p className="text-sm text-zinc-500">Memuat papan peringkat…</p>;
  if (rows.length === 0)
    return (
      <p className="rounded-xl border border-black/10 p-6 text-center text-sm text-zinc-500 dark:border-white/15">
        Belum ada skor. Ayo main di Arena dan jadi yang pertama! 🚀
      </p>
    );

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/15">
      <table className="w-full text-left text-sm">
        <thead className="bg-black/[.03] text-xs uppercase text-zinc-500 dark:bg-white/[.04]">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">Nama</th>
            <th className="px-3 py-2">Kelas</th>
            <th className="px-3 py-2">Topik</th>
            <th className="px-3 py-2 text-right">Poin</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className={
                "border-t border-black/5 dark:border-white/10 " +
                (r.isMe ? "bg-blue-50 font-semibold dark:bg-blue-950/30" : "")
              }
            >
              <td className="px-3 py-2">{i < 3 ? medali[i] : i + 1}</td>
              <td className="px-3 py-2">{r.nama}{r.isMe && " (kamu)"}</td>
              <td className="px-3 py-2 text-zinc-500">{r.kelasLabel}</td>
              <td className="px-3 py-2 text-zinc-500">
                {r.topic} · {r.level}
              </td>
              <td className="px-3 py-2 text-right font-bold">{r.points.toLocaleString("id-ID")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
