"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { mulaiCheckpoint, submitCheckpoint } from "@/server/checkpoint";
import type { ClientCheckpoint } from "@/lib/checkpoint";

type Fase = "intro" | "kuis";

export default function CheckpointClient({
  namaBulan,
  sedangKerja,
}: {
  namaBulan: string;
  sedangKerja: boolean;
}) {
  const router = useRouter();
  const [fase, setFase] = useState<Fase>("intro");
  const [soal, setSoal] = useState<ClientCheckpoint | null>(null);
  const [jawabNum, setJawabNum] = useState<(string | null)[]>([]);
  const [jawabLit, setJawabLit] = useState<(number | null)[][]>([]);
  const [step, setStep] = useState(0);
  const [sisa, setSisa] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const terkirim = useRef(false);

  const totalSteps = soal ? soal.soalNum.length + soal.bacaan.length : 0;

  async function mulai() {
    setPending(true);
    setError(null);
    try {
      const res = await mulaiCheckpoint();
      if (res.status === "sudah") {
        router.refresh();
        return;
      }
      const s = res.soal!;
      setSoal(s);
      setJawabNum(new Array(s.soalNum.length).fill(null));
      setJawabLit(s.bacaan.map((b) => b.questions.map(() => null)));
      setSisa(res.sisaDetik ?? 0);
      setFase("kuis");
    } catch (e) {
      setError((e as Error).message || "Gagal memulai.");
    } finally {
      setPending(false);
    }
  }

  const kirim = useCallback(
    async (waktuHabis: boolean) => {
      if (terkirim.current) return;
      terkirim.current = true;
      setPending(true);
      setError(null);
      try {
        const res = await submitCheckpoint({ jawabNum, jawabLit, waktuHabis });
        if (!res.ok) {
          setError(res.error ?? "Gagal mengumpulkan.");
          terkirim.current = false;
          setPending(false);
          return;
        }
        router.refresh();
      } catch (e) {
        setError((e as Error).message || "Gagal mengumpulkan.");
        terkirim.current = false;
        setPending(false);
      }
    },
    [jawabNum, jawabLit, router],
  );

  // Timer mundur (server tetap berwenang; ini agar UI auto-kumpul saat habis).
  useEffect(() => {
    if (fase !== "kuis") return;
    const t = setInterval(() => setSisa((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [fase]);

  useEffect(() => {
    if (fase === "kuis" && sisa === 0 && !terkirim.current) kirim(true);
  }, [fase, sisa, kirim]);

  if (fase === "intro") {
    return (
      <div className="rounded-2xl border border-black/10 p-6 dark:border-white/15">
        <h1 className="text-2xl font-bold">Check Point {namaBulan}</h1>
        <ul className="mt-4 space-y-1.5 text-sm text-zinc-600 dark:text-zinc-300">
          <li>📐 20 soal numerasi + 📖 15 soal literasi (3 bacaan × 5)</li>
          <li>⏱️ Waktu 30 menit — otomatis terkumpul saat habis</li>
          <li>🔒 Hanya bisa dikerjakan <b>sekali</b> bulan ini</li>
        </ul>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          onClick={mulai}
          disabled={pending}
          className="mt-6 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Menyiapkan…" : sedangKerja ? "Lanjutkan" : "Mulai Check Point"}
        </button>
      </div>
    );
  }

  if (!soal) return null;
  const nNum = soal.soalNum.length;
  const diNumerasi = step < nNum;
  const belumTerjawab =
    jawabNum.filter((x) => x == null).length + jawabLit.flat().filter((x) => x == null).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Bilah atas: progres + timer */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-zinc-500">
          {diNumerasi ? `Numerasi ${step + 1}/${nNum}` : `Bacaan ${step - nNum + 1}/${soal.bacaan.length}`}
        </div>
        <Timer sisa={sisa} />
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
        <div
          className="h-full bg-blue-600 transition-all"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {diNumerasi ? (
        <SoalNumerasi
          soal={soal.soalNum[step]}
          nomor={step + 1}
          pilih={jawabNum[step]}
          onPilih={(v) => setJawabNum((a) => a.map((x, i) => (i === step ? v : x)))}
        />
      ) : (
        <SoalBacaan
          bacaan={soal.bacaan[step - nNum]}
          jawab={jawabLit[step - nNum]}
          nomorMulai={nNum + (step - nNum) * soal.bacaan[step - nNum].questions.length + 1}
          onPilih={(qi, oi) =>
            setJawabLit((a) =>
              a.map((row, pi) => (pi === step - nNum ? row.map((x, j) => (j === qi ? oi : x)) : row)),
            )
          }
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Navigasi */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || pending}
          className="rounded-lg border border-black/15 px-4 py-2 text-sm disabled:opacity-40 dark:border-white/20"
        >
          ← Sebelumnya
        </button>
        {step < totalSteps - 1 ? (
          <button
            onClick={() => setStep((s) => Math.min(totalSteps - 1, s + 1))}
            disabled={pending}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Berikutnya →
          </button>
        ) : (
          <button
            onClick={() => {
              if (belumTerjawab > 0 && !confirm(`Masih ada ${belumTerjawab} soal kosong. Kumpulkan sekarang?`))
                return;
              kirim(false);
            }}
            disabled={pending}
            className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {pending ? "Mengumpulkan…" : "Kumpulkan"}
          </button>
        )}
      </div>
      <p className="text-center text-xs text-zinc-400">{belumTerjawab} soal belum dijawab</p>
    </div>
  );
}

function Timer({ sisa }: { sisa: number }) {
  const m = Math.floor(sisa / 60);
  const s = sisa % 60;
  const bahaya = sisa <= 60;
  return (
    <div
      className={
        "rounded-lg px-3 py-1 font-mono text-sm font-semibold " +
        (bahaya ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" : "bg-black/5 dark:bg-white/10")
      }
    >
      ⏱️ {m}:{String(s).padStart(2, "0")}
    </div>
  );
}

function SoalNumerasi({
  soal,
  nomor,
  pilih,
  onPilih,
}: {
  soal: ClientCheckpoint["soalNum"][number];
  nomor: number;
  pilih: string | null;
  onPilih: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-black/10 p-5 dark:border-white/15">
      <div className="mb-2 flex items-center gap-2 text-sm text-zinc-500">
        <span>{soal.icon}</span>
        <span>{soal.topicName}</span>
        <span className="ml-auto rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">Lv {soal.lv}</span>
      </div>
      {soal.ctx && <p className="mb-1 text-xs text-zinc-400">{soal.ctx}</p>}
      <div className="text-lg font-medium" dangerouslySetInnerHTML={{ __html: `${nomor}. ${soal.qHTML}` }} />
      <div className="mt-4 grid gap-2">
        {soal.options.map((o, i) => {
          const aktif = pilih === o.value;
          return (
            <button
              key={i}
              onClick={() => onPilih(o.value)}
              className={
                "rounded-lg border px-4 py-2.5 text-left transition-colors " +
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
  );
}

function SoalBacaan({
  bacaan,
  jawab,
  nomorMulai,
  onPilih,
}: {
  bacaan: ClientCheckpoint["bacaan"][number];
  jawab: (number | null)[];
  nomorMulai: number;
  onPilih: (qi: number, oi: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-black/10 p-5 dark:border-white/15">
      <div className="mb-1 text-xs uppercase tracking-wide text-zinc-400">{bacaan.tema}</div>
      <h2 className="text-lg font-bold">{bacaan.title}</h2>
      <div className="mt-2 max-h-56 overflow-y-auto whitespace-pre-line rounded-lg bg-black/[.03] p-3 text-sm leading-relaxed dark:bg-white/[.04]">
        {bacaan.text}
      </div>
      <div className="mt-4 space-y-5">
        {bacaan.questions.map((q, qi) => (
          <div key={qi}>
            <p className="font-medium">
              {nomorMulai + qi}. {q.q}
            </p>
            <div className="mt-2 grid gap-2">
              {q.options.map((opt, oi) => {
                const aktif = jawab[qi] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => onPilih(qi, oi)}
                    className={
                      "rounded-lg border px-3 py-2 text-left text-sm transition-colors " +
                      (aktif
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40"
                        : "border-black/15 hover:border-blue-400 dark:border-white/20")
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
    </div>
  );
}
