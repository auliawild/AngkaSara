import { redirect } from "next/navigation";
import Link from "next/link";
import { sesiSiswa } from "@/server/student-auth";
import { prisma } from "@/lib/db";
import { periodKey, klasifikasi, BULAN_PANJANG } from "@/lib/kelas";
import { muatTargetSiswa } from "@/server/target";
import { persenTarget } from "@/lib/target";
import KeluarSiswa from "./keluar-siswa";

export const metadata = { title: "Beranda Siswa — AngkaSara" };

const SEMANGAT = [
  "Sedikit demi sedikit, lama-lama jadi mahir! 🌱",
  "Setiap soal yang kamu kerjakan bikin kamu makin hebat. 💪",
  "Membaca hari ini, melangkah lebih jauh esok hari. 🚀",
  "Salah itu wajar — yang penting terus mencoba! ✨",
  "Kamu lebih pintar dari kemarin. Ayo lanjutkan! 🔥",
  "Belajar sedikit tiap hari mengalahkan belajar banyak sekali-sekali. ⭐",
];

export default async function SiswaPage() {
  const sesi = await sesiSiswa();
  if (!sesi) redirect("/masuk?next=/siswa");

  const period = periodKey();
  const [cp, skiba, bacaanSelesai] = await Promise.all([
    prisma.checkpointResult.findUnique({
      where: { studentId_period: { studentId: sesi.studentId, period } },
      select: { status: true, total: true },
    }),
    prisma.skibaTopicState.findMany({
      where: { studentId: sesi.studentId },
      select: { score: true, maxUnlocked: true },
    }),
    prisma.skibacaProgress.count({ where: { studentId: sesi.studentId } }),
  ]);
  const { rekap } = await muatTargetSiswa();
  const targetKini = rekap.baris[rekap.idxKini];

  const bulan = BULAN_PANJANG[Number(period.split("-")[1]) - 1];
  const sudah = cp?.status === "submitted";
  const skibaScore = skiba.reduce((s, t) => s + t.score, 0);
  const totalBacaan = 375;
  const semangat = SEMANGAT[new Date().getDate() % SEMANGAT.length];

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      {/* latar dekoratif */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="as-blob absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-400/30 blur-3xl dark:bg-indigo-600/20" />
        <div className="as-blob absolute -right-20 top-40 h-72 w-72 rounded-full bg-fuchsia-400/25 blur-3xl dark:bg-fuchsia-700/20" style={{ animationDelay: "3s" }} />
        <div className="as-blob absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-300/25 blur-3xl dark:bg-amber-600/15" style={{ animationDelay: "6s" }} />
      </div>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 py-8 sm:py-10">
        {/* HERO */}
        <section className="as-pop relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl shadow-violet-600/20">
          <div aria-hidden className="absolute -right-8 -top-10 text-9xl opacity-20 as-float select-none">🎓</div>
          <div className="relative">
            <p className="text-sm font-medium text-white/80">Halo, selamat datang 👋</p>
            <h1 className="mt-0.5 text-3xl font-black tracking-tight">{sesi.nama.split(" ")[0]}!</h1>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span>🏫 {sesi.kelasLabel}</span>
              <span className="text-white/50">·</span>
              <span>NISN {sesi.nisn}</span>
            </div>

            {/* stat capaian */}
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              <StatChip emoji="🧮" nilai={skibaScore.toLocaleString("id-ID")} label="Skor Math" />
              <StatChip emoji="📖" nilai={`${bacaanSelesai}`} label={`dari ${totalBacaan} bacaan`} />
              <StatChip
                emoji={sudah ? "✅" : "📋"}
                nilai={sudah ? `${cp!.total}` : "—"}
                label={sudah ? "Check Point" : "belum ujian"}
              />
            </div>
          </div>
        </section>

        {/* TARGET BULANAN — ringkas, tautkan ke rincian */}
        <Link
          href="/siswa/target"
          className="as-lift as-pop group relative overflow-hidden rounded-3xl border border-black/5 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5"
        >
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-black text-zinc-800 dark:text-zinc-100">
              🎯 Target {targetKini.label}
            </h2>
            <span className="text-xs font-bold text-indigo-600 group-hover:underline dark:text-indigo-400">
              Rincian →
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <MiniTarget emoji="🧮" label="SKIBA" nilai={targetKini.skiba} target={targetKini.targetSkiba} tercapai={targetKini.skibaTercapai} warna="from-emerald-500 to-teal-600" />
            <MiniTarget emoji="📖" label="SKIBACA" nilai={targetKini.skibaca} target={targetKini.targetSkibaca} tercapai={targetKini.skibacaTercapai} warna="from-amber-500 to-orange-600" />
          </div>
        </Link>

        {/* KARTU MODUL — urutan: latihan → Check Point → Papan Peringkat (paling bawah) */}
        <div className="grid gap-4">
          <ModuleCard
            href="/siswa/skiba"
            emoji="🧮"
            title="SKIBA Math"
            kepanjangan="Sistem Komputasi Intuitif Berhitung Aktif — Menalar, Analisis, Teliti, dan Hebat"
            desc="Tes diagnostik, arena 10 topik × 20 level, kumpulkan skor & naik peringkat!"
            gradient="from-emerald-500 to-teal-600"
            cta={<CtaPill label="Berlatih" />}
          />

          <ModuleCard
            href="/siswa/skibaca"
            emoji="📖"
            title="SKIBACA"
            kepanjangan="Sahabat Kreatif, Inspirasi Baca Aksara, Cerdas Aktif"
            desc="5 jurusan × 5 level, kuis pemahaman + adu kecepatan baca (WPM)."
            gradient="from-amber-500 to-orange-600"
            cta={<CtaPill label="Membaca" />}
          />

          <ModuleCard
            href="/siswa/checkpoint"
            emoji="📋"
            title={`Check Point ${bulan}`}
            kepanjangan="Titik ukur kemampuanmu tiap akhir bulan"
            desc={
              sudah
                ? "Sudah dikerjakan bulan ini — lihat hasilmu."
                : cp?.status === "in_progress"
                  ? "Sedang berlangsung — ayo lanjutkan!"
                  : "20 soal numerasi + 15 literasi · 30 menit."
            }
            gradient="from-sky-500 to-blue-600"
            cta={
              sudah ? (
                <span
                  className="rounded-full px-3 py-1 text-sm font-black text-white shadow"
                  style={{ backgroundColor: klasifikasi(cp!.total).color }}
                >
                  {cp!.total}
                </span>
              ) : (
                <CtaPill label={cp?.status === "in_progress" ? "Lanjutkan" : "Mulai"} />
              )
            }
          />

          <ModuleCard
            href="/siswa/peringkat"
            emoji="🏆"
            title="Papan Peringkat"
            kepanjangan="Gabungan SKIBA Math + SKIBACA"
            desc="Lihat posisimu di kelas dan di seluruh sekolah. Ayo naik peringkat!"
            gradient="from-rose-500 to-pink-600"
            cta={<CtaPill label="Lihat" />}
          />
        </div>

        {/* SEMANGAT */}
        <div className="as-pop flex items-center gap-3 rounded-2xl border border-black/5 bg-white/60 p-4 text-sm font-semibold text-zinc-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
          <span className="text-2xl as-float">💡</span>
          <span>{semangat}</span>
        </div>

        <div className="mt-1">
          <KeluarSiswa />
        </div>
      </main>
    </div>
  );
}

function StatChip({ emoji, nilai, label }: { emoji: string; nilai: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/15 px-2 py-2.5 text-center backdrop-blur">
      <div className="text-base leading-none">{emoji}</div>
      <div className="mt-1 text-lg font-black leading-none">{nilai}</div>
      <div className="mt-1 text-[10px] font-medium leading-tight text-white/75">{label}</div>
    </div>
  );
}

function MiniTarget({
  emoji,
  label,
  nilai,
  target,
  tercapai,
  warna,
}: {
  emoji: string;
  label: string;
  nilai: number;
  target: number;
  tercapai: boolean;
  warna: string;
}) {
  const pct = persenTarget(nilai, target);
  return (
    <div className="rounded-2xl bg-black/[0.03] p-2.5 dark:bg-white/5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-zinc-600 dark:text-zinc-300">
          {emoji} {label}
        </span>
        {tercapai && <span className="text-[11px]">✅</span>}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-lg font-black leading-none text-zinc-900 dark:text-zinc-50">{nilai}</span>
        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">/ {target}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div className={`h-full rounded-full bg-gradient-to-r ${warna}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CtaPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/30 transition-colors group-hover:bg-white/30">
      {label} <span aria-hidden>→</span>
    </span>
  );
}

function ModuleCard({
  href,
  emoji,
  title,
  kepanjangan,
  desc,
  gradient,
  cta,
}: {
  href: string;
  emoji: string;
  title: string;
  kepanjangan?: string;
  desc: string;
  gradient: string;
  cta: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`as-lift as-pop group relative flex items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg`}
    >
      <div aria-hidden className="absolute -bottom-6 -right-3 text-8xl opacity-15 transition-transform duration-300 group-hover:scale-110 select-none">
        {emoji}
      </div>
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl backdrop-blur">
        {emoji}
      </div>
      <div className="relative min-w-0 flex-1">
        <h2 className="text-lg font-black leading-tight">{title}</h2>
        {kepanjangan && (
          <p className="mt-0.5 text-[11px] font-semibold italic leading-snug text-white/75">{kepanjangan}</p>
        )}
        <p className="mt-1 text-sm text-white/85">{desc}</p>
      </div>
      <div className="relative shrink-0 self-start pt-1">{cta}</div>
    </Link>
  );
}
