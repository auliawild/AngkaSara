"use client";
/**
 * SKIBACA — UI klien (Phase 3). Alur: hub jurusan → level & daftar bacaan →
 * baca (timer WPM) → kuis (server-graded) → hasil (skor, WPM, badge, koreksi).
 * Kunci jawaban tak pernah ke klien; penilaian di server via submitBacaan.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  muatJurusan,
  mulaiBacaan,
  submitBacaan,
  mulaiDiagnostikBaca,
  submitDiagnostikBaca,
  type JurusanRingkas,
  type JurusanDetail,
  type SubmitBacaanHasil,
  type MulaiDiagnostikBacaHasil,
} from "@/server/skibaca";
import { labelPanjang, type BacaanKlien, type HasilDiagnostikBaca } from "@/lib/skibaca";

type Mode = "hub" | "jurusan" | "baca" | "diagnostik";

export default function SkibacaClient({ jurusanAwal }: { jurusanAwal: JurusanRingkas[] }) {
  const [mode, setMode] = useState<Mode>("hub");
  const [detail, setDetail] = useState<JurusanDetail | null>(null);
  const [bacaan, setBacaan] = useState<BacaanKlien | null>(null);
  const [levelAwal, setLevelAwal] = useState(1); // level dibuka saat kembali ke JurusanView
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bukaJurusan = useCallback(async (kode: string) => {
    setPending(true);
    setError(null);
    try {
      setDetail(await muatJurusan(kode));
      setLevelAwal(1);
      setMode("jurusan");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }, []);

  const bukaBacaan = useCallback(async (id: string) => {
    setPending(true);
    setError(null);
    try {
      setBacaan(await mulaiBacaan(id));
      setMode("baca");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }, []);

  const segarkanJurusan = useCallback(async () => {
    if (!detail) return;
    try {
      setDetail(await muatJurusan(detail.kode));
    } catch {
      /* abaikan */
    }
  }, [detail]);

  if (mode === "diagnostik" && detail) {
    return (
      <DiagnostikBaca
        kode={detail.kode}
        onKeluar={async (mulaiLevel) => {
          await segarkanJurusan();
          if (mulaiLevel) setLevelAwal(mulaiLevel);
          setMode("jurusan");
        }}
      />
    );
  }

  if (mode === "baca" && bacaan) {
    return (
      <BacaBacaan
        bacaan={bacaan}
        onSelesai={async () => {
          await segarkanJurusan();
        }}
        onKeluar={() => {
          setBacaan(null);
          setMode("jurusan");
        }}
      />
    );
  }

  if (mode === "jurusan" && detail) {
    return (
      <JurusanView
        key={`${detail.kode}-${levelAwal}`}
        detail={detail}
        levelAwal={levelAwal}
        pending={pending}
        error={error}
        onPilihBacaan={bukaBacaan}
        onMulaiDiagnostik={() => setMode("diagnostik")}
        onMulaiRekomendasi={(lv) => setLevelAwal(lv)}
        onKembali={() => setMode("hub")}
      />
    );
  }

  // hub
  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-sm text-zinc-500">
        Pilih jurusan, lalu baca teks singkat dan jawab kuis pemahamannya. Kecepatan bacamu (WPM)
        dihitung otomatis.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {jurusanAwal.map((j) => (
          <button
            key={j.kode}
            disabled={pending}
            onClick={() => bukaJurusan(j.kode)}
            className="as-lift as-pop flex items-center gap-3 rounded-2xl border border-black/10 bg-white/60 p-4 text-left disabled:opacity-50 dark:border-white/15 dark:bg-white/5"
          >
            <span className="text-3xl">{j.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{j.kode}</div>
              <div className="truncate text-xs text-zinc-500">{j.full}</div>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-zinc-500">
                <span>
                  {j.selesai}/{j.total} bacaan
                </span>
                {j.rataPercent != null && (
                  <>
                    <span>·</span>
                    <span>rata {j.rataPercent}%</span>
                  </>
                )}
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${(j.selesai / j.total) * 100}%` }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===================== JURUSAN: level + daftar bacaan ===================== */
function JurusanView({
  detail,
  levelAwal,
  pending,
  error,
  onPilihBacaan,
  onMulaiDiagnostik,
  onMulaiRekomendasi,
  onKembali,
}: {
  detail: JurusanDetail;
  levelAwal: number;
  pending: boolean;
  error: string | null;
  onPilihBacaan: (id: string) => void;
  onMulaiDiagnostik: () => void;
  onMulaiRekomendasi: (level: number) => void;
  onKembali: () => void;
}) {
  const [levelAktif, setLevelAktif] = useState(levelAwal || detail.levels[0]?.level || 1);
  const level = detail.levels.find((l) => l.level === levelAktif) ?? detail.levels[0];
  const diag = detail.diagnostik;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onKembali}
          className="rounded-lg border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          ←
        </button>
        <div>
          <div className="font-semibold">
            {detail.icon} {detail.kode}
          </div>
          <div className="text-xs text-zinc-500">{detail.full}</div>
        </div>
      </div>

      {/* Kartu Tes Diagnostik: saran level awal (semua bacaan tetap terbuka) */}
      <div className="rounded-2xl border border-amber-300/60 bg-amber-50/60 p-4 dark:border-amber-700/50 dark:bg-amber-950/20">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">Tes Diagnostik</div>
            {diag ? (
              <div className="text-xs text-zinc-500">
                Rekomendasi terakhir: <b className="text-amber-700 dark:text-amber-400">Level {diag.recommended}</b> — level yang paling sesuai untukmu.
              </div>
            ) : (
              <div className="text-xs text-zinc-500">
                Kerjakan untuk tahu level bacaan yang paling sesuai dengan kemampuanmu.
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={onMulaiDiagnostik}
            disabled={pending}
            className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-3.5 py-1.5 text-sm font-bold text-white shadow disabled:opacity-50"
          >
            {diag ? "Ulangi Tes 🔁" : "Mulai Tes Diagnostik ✍️"}
          </button>
          {diag && (
            <button
              onClick={() => {
                setLevelAktif(diag.recommended);
                onMulaiRekomendasi(diag.recommended);
              }}
              className="rounded-lg border border-amber-500/60 px-3.5 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-100/60 dark:text-amber-300 dark:hover:bg-amber-900/30"
            >
              Mulai dari Level {diag.recommended} →
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {detail.levels.map((l) => {
          const selesai = l.bacaan.filter((b) => b.percent != null).length;
          return (
            <button
              key={l.level}
              onClick={() => setLevelAktif(l.level)}
              className={
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors " +
                (levelAktif === l.level
                  ? "bg-amber-600 text-white"
                  : "border border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10")
              }
            >
              Level {l.level}
              <span className="ml-1.5 text-xs opacity-80">
                {selesai}/{l.bacaan.length}
              </span>
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-2">
        {level?.bacaan.map((b) => (
          <button
            key={b.id}
            disabled={pending}
            onClick={() => onPilihBacaan(b.id)}
            className="flex items-center gap-3 rounded-xl border border-black/10 p-3 text-left transition-colors hover:border-amber-400 hover:bg-amber-50/40 disabled:opacity-50 dark:border-white/15 dark:hover:border-amber-700 dark:hover:bg-amber-950/20"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 text-sm font-bold dark:bg-white/10">
              {b.urutan}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{b.title}</div>
              <div className="text-xs text-zinc-500">
                {b.wordCount} kata · {labelPanjang(b.wordCount)}
              </div>
            </div>
            {b.percent != null ? (
              <span className="shrink-0 text-right text-xs">
                <span className="block font-bold text-amber-600">{b.percent}%</span>
                <span className="text-zinc-400">{b.wpm} wpm</span>
              </span>
            ) : (
              <span className="shrink-0 text-xs text-zinc-400">belum</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===================== BACA → KUIS → HASIL ===================== */
type FaseBaca = "baca" | "kuis" | "hasil";
function BacaBacaan({
  bacaan,
  onSelesai,
  onKeluar,
}: {
  bacaan: BacaanKlien;
  onSelesai: () => Promise<void>;
  onKeluar: () => void;
}) {
  const [fase, setFase] = useState<FaseBaca>("baca");
  const [jawab, setJawab] = useState<(number | null)[]>(bacaan.soal.map(() => null));
  const [hasil, setHasil] = useState<SubmitBacaanHasil["hasil"] | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mulaiBacaRef = useRef<number>(Date.now());
  const detikBacaRef = useRef<number>(0);

  function mulaiKuis() {
    detikBacaRef.current = Math.max(1, Math.round((Date.now() - mulaiBacaRef.current) / 1000));
    setFase("kuis");
  }

  const belum = jawab.filter((x) => x == null).length;

  async function kirim() {
    if (belum > 0 && !confirm(`Masih ada ${belum} soal kosong. Kumpulkan sekarang?`)) return;
    setPending(true);
    setError(null);
    try {
      const res = await submitBacaan({
        passageId: bacaan.id,
        jawab,
        detikBaca: detikBacaRef.current,
      });
      if (!res.ok || !res.hasil) {
        setError(res.error ?? "Gagal mengumpulkan.");
        return;
      }
      setHasil(res.hasil);
      setFase("hasil");
      await onSelesai();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  if (fase === "baca") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onKeluar}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            ←
          </button>
          <div className="text-sm text-zinc-500">
            {bacaan.icon} {bacaan.jurusanKode} · Level {bacaan.level} · Bacaan {bacaan.urutan}
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 p-6 dark:border-white/15">
          <h2 className="text-xl font-bold">{bacaan.title}</h2>
          <p className="mt-1 text-xs text-zinc-400">
            {bacaan.wordCount} kata — bacalah dengan saksama, waktu bacamu dihitung.
          </p>
          <p className="mt-4 whitespace-pre-line text-lg leading-relaxed">{bacaan.text}</p>
        </div>
        <button
          onClick={mulaiKuis}
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3 font-bold text-white shadow-lg shadow-orange-500/25 transition-transform hover:scale-[1.02]"
        >
          Selesai membaca, mulai kuis ✅
        </button>
      </div>
    );
  }

  if (fase === "hasil" && hasil) {
    return (
      <div className="flex flex-col gap-4">
        <div className="as-pop rounded-3xl border border-black/5 bg-gradient-to-b from-amber-50 to-transparent p-6 text-center shadow-lg dark:border-white/10 dark:from-amber-950/30">
          <div className="text-5xl as-float">{hasil.percent >= 90 ? "🏆" : hasil.percent >= 70 ? "🎉" : "🌱"}</div>
          <div
            className="mx-auto mt-2 w-fit rounded-full px-5 py-2 text-sm font-bold text-white shadow"
            style={{ backgroundColor: hasil.badge.color }}
          >
            {hasil.badge.text}
          </div>
          <p className="mt-2 text-sm font-semibold text-zinc-500">
            {hasil.percent >= 90
              ? "Luar biasa! Pemahamanmu hebat."
              : hasil.percent >= 70
                ? "Bagus! Terus tingkatkan, ya."
                : "Jangan menyerah — baca lagi dan coba lagi!"}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label="Skor" nilai={`${hasil.percent}%`} />
            <Stat label="Benar" nilai={`${hasil.benar}/${hasil.total}`} />
            <Stat label="Kecepatan" nilai={`${hasil.wpm} wpm`} />
          </div>
          <p className="mt-2 text-xs text-zinc-400">Waktu baca {hasil.detikBaca} detik</p>
        </div>

        <div className="rounded-2xl border border-black/10 p-5 dark:border-white/15">
          <h3 className="mb-3 text-sm font-semibold text-zinc-500">Rincian jawaban</h3>
          <div className="flex flex-col gap-2">
            {bacaan.soal.map((s, i) => {
              const k = hasil.koreksi[i];
              return (
                <div key={i} className="text-sm">
                  <div className="flex items-start gap-2">
                    <span>{k.benar ? "✅" : "❌"}</span>
                    <div className="flex-1">
                      <p className="font-medium">
                        {i + 1}. {s.q}
                      </p>
                      <p className={k.benar ? "text-green-700 dark:text-green-400" : "text-red-600"}>
                        Jawabanmu: {k.pilih != null ? s.options[k.pilih] : "— (kosong)"}
                      </p>
                      {!k.benar && (
                        <p className="text-green-700 dark:text-green-400">
                          Jawaban benar: {s.options[k.answerIndex]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onKeluar}
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3 font-bold text-white shadow-lg shadow-orange-500/25 transition-transform hover:scale-[1.02]"
        >
          ← Kembali ke daftar bacaan
        </button>
      </div>
    );
  }

  // fase kuis
  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm font-medium text-zinc-500">
        Kuis: {bacaan.title} — jawab {bacaan.soal.length} soal
      </div>
      <div className="flex flex-col gap-4">
        {bacaan.soal.map((s, qi) => (
          <div key={qi} className="rounded-2xl border border-black/10 p-5 dark:border-white/15">
            <p className="font-medium">
              {qi + 1}. {s.q}
            </p>
            <div className="mt-3 grid gap-2">
              {s.options.map((opt, oi) => {
                const aktif = jawab[qi] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => setJawab((a) => a.map((x, j) => (j === qi ? oi : x)))}
                    className={
                      "rounded-lg border px-4 py-2.5 text-left text-sm transition-colors " +
                      (aktif
                        ? "border-amber-600 bg-amber-50 dark:bg-amber-950/40"
                        : "border-black/15 hover:border-amber-400 dark:border-white/20")
                    }
                  >
                    <span className="mr-2 font-semibold">{String.fromCharCode(65 + oi)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={kirim}
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-3 font-bold text-white shadow-lg shadow-green-600/25 transition-transform hover:scale-[1.02] disabled:scale-100 disabled:opacity-50"
      >
        {pending ? "Menilai…" : "Kumpulkan jawaban ✅"}
      </button>
      <p className="text-center text-xs text-zinc-400">{belum} soal belum dijawab</p>
    </div>
  );
}

/* ===================== TES DIAGNOSTIK (5 bacaan sampel) ===================== */
function DiagnostikBaca({
  kode,
  onKeluar,
}: {
  kode: string;
  onKeluar: (mulaiLevel?: number) => void;
}) {
  const [data, setData] = useState<MulaiDiagnostikBacaHasil | null>(null);
  const [idx, setIdx] = useState(0); // bacaan sampel ke-idx (0..4)
  const [fase, setFase] = useState<"baca" | "kuis">("baca");
  const [jawabSemua, setJawabSemua] = useState<(number | null)[][]>([]);
  const [hasil, setHasil] = useState<HasilDiagnostikBaca | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    (async () => {
      try {
        const d = await mulaiDiagnostikBaca(kode);
        setData(d);
        setJawabSemua(d.bacaan.map((b) => b.soal.map(() => null)));
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [kode]);

  async function kirim(jawabFinal: (number | null)[][]) {
    setPending(true);
    setError(null);
    try {
      const res = await submitDiagnostikBaca({ kode, jawab: jawabFinal });
      if (!res.ok || !res.hasil) {
        setError(res.error ?? "Gagal mengumpulkan.");
        return;
      }
      setHasil(res.hasil);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  if (error && !data) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => onKeluar()}
          className="w-fit rounded-lg border border-black/15 px-4 py-2 text-sm dark:border-white/20"
        >
          ← Kembali
        </button>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-zinc-500">Menyiapkan tes diagnostik…</p>;
  }

  /* ---- Layar hasil ---- */
  if (hasil) {
    return (
      <div className="flex flex-col gap-4">
        <div className="as-pop rounded-3xl border border-black/5 bg-gradient-to-b from-amber-50 to-transparent p-6 text-center shadow-lg dark:border-white/10 dark:from-amber-950/30">
          <div className="text-5xl as-float">🎯</div>
          <p className="mt-2 text-sm font-semibold text-zinc-500">Rekomendasi level bacaan untukmu</p>
          <div className="mx-auto mt-1 w-fit rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2 text-lg font-black text-white shadow">
            Level {hasil.recommended}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 p-5 dark:border-white/15">
          <h3 className="mb-3 text-sm font-semibold text-zinc-500">Rincian skor per level</h3>
          <div className="flex flex-col gap-2.5">
            {hasil.perLevel.map((r) => {
              const warna =
                r.percent >= 70 ? "bg-emerald-500" : r.percent >= 40 ? "bg-amber-500" : "bg-rose-500";
              return (
                <div key={r.level} className="flex items-center gap-3 text-sm">
                  <span className="w-16 shrink-0 font-medium">Level {r.level}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
                    <div className={`h-full rounded-full ${warna}`} style={{ width: `${r.percent}%` }} />
                  </div>
                  <span className="w-12 shrink-0 text-right font-semibold">{r.percent}%</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            Semua bacaan tetap terbuka — rekomendasi ini hanya saran titik mulai yang pas.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => onKeluar(hasil.recommended)}
            className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3 font-bold text-white shadow-lg shadow-orange-500/25 transition-transform hover:scale-[1.02]"
          >
            Mulai dari Level {hasil.recommended} →
          </button>
          <button
            onClick={() => onKeluar()}
            className="rounded-xl border border-black/15 px-5 py-3 text-sm font-semibold hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const b = data.bacaan[idx];
  const jawabIni = jawabSemua[idx] ?? [];
  const belum = jawabIni.filter((x) => x == null).length;
  const terakhir = idx === data.bacaan.length - 1;

  function lanjut() {
    if (belum > 0 && !confirm(`Masih ada ${belum} soal kosong pada bacaan ini. Lanjutkan?`)) return;
    if (terakhir) {
      kirim(jawabSemua);
    } else {
      setIdx((i) => i + 1);
      setFase("baca");
    }
  }

  /* ---- Layar baca ---- */
  if (fase === "baca") {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onKeluar()}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            ←
          </button>
          <div className="text-sm text-zinc-500">
            🎯 Diagnostik {data.icon} {kode} · Bacaan {idx + 1}/{data.bacaan.length} · Level {b.level}
          </div>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
          <div
            className="h-full rounded-full bg-amber-500 transition-all"
            style={{ width: `${(idx / data.bacaan.length) * 100}%` }}
          />
        </div>
        <div className="rounded-2xl border border-black/10 p-6 dark:border-white/15">
          <h2 className="text-xl font-bold">{b.title}</h2>
          <p className="mt-1 text-xs text-zinc-400">{b.wordCount} kata — baca dengan saksama.</p>
          <p className="mt-4 whitespace-pre-line text-lg leading-relaxed">{b.text}</p>
        </div>
        <button
          onClick={() => setFase("kuis")}
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3 font-bold text-white shadow-lg shadow-orange-500/25 transition-transform hover:scale-[1.02]"
        >
          Selesai membaca, jawab kuis ✅
        </button>
      </div>
    );
  }

  /* ---- Layar kuis ---- */
  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm font-medium text-zinc-500">
        🎯 Diagnostik · Bacaan {idx + 1}/{data.bacaan.length} (Level {b.level}) — jawab {b.soal.length} soal
      </div>
      <div className="flex flex-col gap-4">
        {b.soal.map((s, qi) => (
          <div key={qi} className="rounded-2xl border border-black/10 p-5 dark:border-white/15">
            <p className="font-medium">
              {qi + 1}. {s.q}
            </p>
            <div className="mt-3 grid gap-2">
              {s.options.map((opt, oi) => {
                const aktif = jawabIni[qi] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() =>
                      setJawabSemua((all) =>
                        all.map((row, ri) => (ri === idx ? row.map((x, j) => (j === qi ? oi : x)) : row)),
                      )
                    }
                    className={
                      "rounded-lg border px-4 py-2.5 text-left text-sm transition-colors " +
                      (aktif
                        ? "border-amber-600 bg-amber-50 dark:bg-amber-950/40"
                        : "border-black/15 hover:border-amber-400 dark:border-white/20")
                    }
                  >
                    <span className="mr-2 font-semibold">{String.fromCharCode(65 + oi)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={lanjut}
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-3 font-bold text-white shadow-lg shadow-green-600/25 transition-transform hover:scale-[1.02] disabled:scale-100 disabled:opacity-50"
      >
        {pending ? "Menilai…" : terakhir ? "Lihat hasil diagnostik 🎉" : "Lanjut bacaan berikutnya →"}
      </button>
      <p className="text-center text-xs text-zinc-400">{belum} soal belum dijawab</p>
    </div>
  );
}

function Stat({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white/70 p-3 text-center shadow-sm dark:border-white/10 dark:bg-white/10">
      <div className="text-lg font-black">{nilai}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}
