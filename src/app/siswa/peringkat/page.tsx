import Link from "next/link";
import { redirect } from "next/navigation";
import { sesiSiswa } from "@/server/student-auth";
import { muatPeringkatSiswa } from "@/server/peringkat";
import { medali, type BarisPeringkat } from "@/lib/peringkat";
import { ikonJurusan } from "@/lib/kelas";

export const metadata = { title: "Peringkat — AngkaSara" };

export default async function PeringkatSiswaPage() {
  const sesi = await sesiSiswa();
  if (!sesi) redirect("/masuk?next=/siswa/peringkat");

  const d = await muatPeringkatSiswa();
  // Siswa yang belum pernah berlatih seri di peringkat teratas bersama semua temannya yang juga 0
  // → jangan disebut "juara". Ajak berlatih dulu.
  const sudahBerlatih = (d.sayaSekolah?.nilai ?? 0) > 0;

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="as-blob absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-400/30 blur-3xl dark:bg-amber-600/20" />
        <div className="as-blob absolute -right-20 top-40 h-72 w-72 rounded-full bg-violet-400/25 blur-3xl dark:bg-violet-700/20" style={{ animationDelay: "3s" }} />
      </div>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 py-8">
        <Link href="/siswa" className="text-sm font-semibold text-violet-600 hover:underline dark:text-violet-300">
          ← Beranda
        </Link>

        {/* POSISI KAMU */}
        <section className="as-pop relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 text-white shadow-xl shadow-orange-500/20">
          <div aria-hidden className="absolute -right-6 -top-8 text-9xl opacity-20 as-float select-none">🏆</div>
          <div className="relative">
            <p className="text-sm font-medium text-white/80">Peringkat gabungan kamu</p>
            <h1 className="mt-0.5 text-3xl font-black tracking-tight">
              {sudahBerlatih ? `Juara ke-${d.sayaKelas!.peringkat} di kelas` : "Ayo mulai berlatih!"}
            </h1>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <Chip
                emoji="👥"
                nilai={sudahBerlatih ? `${d.sayaKelas!.peringkat}/${d.totalKelas}` : "—"}
                label={d.kelasLabel || "kelas"}
              />
              <Chip
                emoji="🏫"
                nilai={sudahBerlatih ? `${d.sayaSekolah!.peringkat}/${d.totalSiswa}` : "—"}
                label="sekolah"
              />
              <Chip emoji="⭐" nilai={`${d.sayaSekolah?.nilai ?? 0}`} label="nilai gabungan" />
            </div>
            <p className="mt-3 text-xs font-medium text-white/80">
              {sudahBerlatih ? (
                <>
                  🧮 SKIBA {d.sayaSekolah!.nilaiSkiba} · 📖 SKIBACA {d.sayaSekolah!.nilaiSkibaca} — nilai
                  gabungan dihitung dari seberapa banyak yang kamu selesaikan <b>dan</b> seberapa tepat
                  jawabanmu.
                </>
              ) : (
                <>
                  Kerjakan arena SKIBA Math atau bacaan SKIBACA dulu, ya — begitu ada yang kamu selesaikan,
                  peringkatmu langsung muncul di sini. 💪
                </>
              )}
            </p>
          </div>
        </section>

        <Papan
          judul={`👥 Juara Kelas ${d.kelasLabel}`}
          ikon={ikonJurusan(d.kelasLabel)}
          rows={d.teratasKelas}
          sayaId={sesi.studentId}
          kosong="Belum ada yang berlatih di kelasmu. Jadilah yang pertama!"
        />

        <Papan
          judul="🏫 Juara Sekolah"
          rows={d.teratasSekolah}
          sayaId={sesi.studentId}
          tampilkanKelas
          kosong="Belum ada peringkat. Ayo jadi yang pertama!"
        />
      </main>
    </div>
  );
}

function Chip({ emoji, nilai, label }: { emoji: string; nilai: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/15 px-2 py-2.5 text-center backdrop-blur">
      <div className="text-base leading-none">{emoji}</div>
      <div className="mt-1 text-lg font-black leading-none">{nilai}</div>
      <div className="mt-1 text-[10px] font-medium leading-tight text-white/75">{label}</div>
    </div>
  );
}

function Papan({
  judul,
  ikon,
  rows,
  sayaId,
  tampilkanKelas,
  kosong,
}: {
  judul: string;
  ikon?: string;
  rows: BarisPeringkat[];
  sayaId: string;
  tampilkanKelas?: boolean;
  kosong: string;
}) {
  return (
    <section className="as-pop overflow-hidden rounded-3xl border border-black/5 bg-white/70 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <h2 className="border-b border-black/5 px-5 py-3 font-black dark:border-white/10">
        {ikon && <span className="mr-1">{ikon}</span>}
        {judul}
      </h2>
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-zinc-500">{kosong}</p>
      ) : (
        <ol>
          {rows.map((r) => {
            const aku = r.siswaId === sayaId;
            return (
              <li
                key={r.siswaId}
                className={`flex items-center gap-3 border-b border-black/5 px-5 py-2.5 text-sm last:border-0 dark:border-white/5 ${
                  aku ? "bg-violet-500/15 font-bold" : ""
                }`}
              >
                {/* Yang belum berlatih (nilai 0) seri di peringkat teratas — tampilkan "–" saja
                    supaya tak terbaca seperti juara. */}
                <span
                  className={`w-10 shrink-0 text-center font-black tabular-nums ${
                    r.nilai > 0 ? "" : "text-zinc-400"
                  }`}
                >
                  {r.nilai > 0 ? medali(r.peringkat, r.nilai) || r.peringkat : "–"}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {r.nama}
                  {aku && <span className="ml-1 text-xs text-violet-600 dark:text-violet-300">(kamu)</span>}
                  {tampilkanKelas && (
                    <span className="block text-[11px] font-medium text-zinc-500">{r.kelasLabel}</span>
                  )}
                </span>
                <span className="shrink-0 text-right">
                  <span className="text-base font-black tabular-nums">{r.nilai}</span>
                  <span className="block text-[11px] font-medium text-zinc-500 tabular-nums">
                    🧮 {r.nilaiSkiba} · 📖 {r.nilaiSkibaca}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
