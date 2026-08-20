import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { muatDataPenelitian } from "@/server/penelitian";
import { SEKOLAH } from "@/lib/sekolah";
import { bandSkor, type AgregatKelas, type TitikSekolah } from "@/lib/penelitian";
import PerkembanganChart from "../laporan/perkembangan-chart";

export const metadata = { title: "Data Penelitian — AngkaSara" };

const nn = (x: number | null, suf = "") => (x == null ? "–" : `${x}${suf}`);

function Stat({
  label,
  nilai,
  sub,
  warna,
  bandOf,
}: {
  label: string;
  nilai: string;
  sub?: string;
  warna?: string;
  bandOf?: number | null; // skor 0..100 → chip klasifikasi skala bersama
}) {
  const band = bandOf === undefined ? null : bandSkor(bandOf);
  return (
    <div className="rounded-2xl border border-black/5 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-start justify-between gap-2">
        <div className={`text-2xl font-black leading-none ${warna ?? "text-zinc-900 dark:text-zinc-50"}`}>{nilai}</div>
        {band && (
          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: band.color }}
          >
            {band.ic} {band.label}
          </span>
        )}
      </div>
      <div className="mt-1.5 text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">{sub}</div>}
    </div>
  );
}

/** Selisih Check Point vs diagnostik: warna hijau naik / merah turun. */
function Selisih({ v }: { v: number | null }) {
  if (v == null) return <span className="text-zinc-400">–</span>;
  const naik = v > 0;
  const turun = v < 0;
  return (
    <span className={naik ? "text-emerald-600 dark:text-emerald-400" : turun ? "text-rose-600 dark:text-rose-400" : "text-zinc-500"}>
      {naik ? "▲ +" : turun ? "▼ " : "±"}
      {v}
    </span>
  );
}

function Seksi({ emoji, judul, anak }: { emoji: string; judul: string; anak: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-black/5 bg-black/[0.015] p-4 dark:border-white/10 dark:bg-white/[0.02] sm:p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-200">
        <span>{emoji}</span>
        {judul}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{anak}</div>
    </section>
  );
}

/** Kolom tabel per kelas (ringkas — versi lengkap ada di ekspor). */
const KOLOM = [
  "Kelas",
  "Siswa",
  "Diag SKIBA",
  "Diag SKIBACA",
  "CP Total",
  "SKIBA Level",
  "SKIBACA Bacaan",
] as const;

function selKelas(k: AgregatKelas): (string | number)[] {
  return [
    k.kelasLabel,
    k.jumlahSiswa,
    k.diagSkibaN ? `${nn(k.diagSkibaSkor)} (${k.diagSkibaN})` : "–",
    k.diagBacaN ? `${nn(k.diagBacaSkor)} (${k.diagBacaN})` : "–",
    k.cpN ? `${nn(k.cpTotal)} (${k.cpN})` : "–",
    `${k.skibaLevelRata} / ${k.skibaLevelTotal}`,
    `${k.bacaSelesaiRata} / ${k.bacaSelesaiTotal}`,
  ];
}

export default async function DataPenelitianPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/masuk?tab=admin&next=/guru/data");
  const role = (session.user as { role?: string }).role ?? "GURU";
  if (role !== "ADMIN") redirect("/guru");

  const d = await muatDataPenelitian();
  const s = d.sekolah;
  const tanggal = new Date(d.dibuatPada).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-5 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/guru" className="text-sm text-violet-600 hover:underline dark:text-violet-400">
              ← Dasbor
            </Link>
            <h1 className="text-2xl font-bold">Data Penelitian</h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Rekap rata-rata satu sekolah — {SEKOLAH.nama}. Snapshot {tanggal} ·{" "}
            <span className="font-semibold">{s.jumlahSiswa} siswa</span>, {d.perKelas.length} kelas.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/guru/data/export?format=xlsx"
            className="rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            ⬇️ Excel
          </a>
          <a
            href="/guru/data/export?format=csv"
            className="rounded-xl border border-violet-300 px-3.5 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-950/40"
          >
            ⬇️ CSV
          </a>
        </div>
      </header>

      {s.jumlahSiswa === 0 ? (
        <p className="rounded-2xl border border-black/5 bg-white/60 p-8 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
          Belum ada siswa aktif.
        </p>
      ) : (
        <>
          <Seksi
            emoji="🧭"
            judul="Tes Diagnostik (asesmen awal)"
            anak={
              <>
                <Stat label="Rata skor Diagnostik SKIBA" nilai={nn(s.diagSkibaSkor)} sub={`${s.diagSkibaN} dari ${s.jumlahSiswa} siswa · skala 0–100`} warna="text-emerald-600 dark:text-emerald-400" bandOf={s.diagSkibaSkor} />
                <Stat label="Rata skor Diagnostik SKIBACA" nilai={nn(s.diagBacaSkor)} sub={`${s.diagBacaN} dari ${s.jumlahSiswa} siswa · skala 0–100`} warna="text-amber-600 dark:text-amber-400" bandOf={s.diagBacaSkor} />
                <Stat label="Rata level saran SKIBA" nilai={nn(s.diagSkibaLevel)} sub="skala 1–20" />
                <Stat label="Rata level saran SKIBACA" nilai={nn(s.diagBacaRec)} sub="skala 1–5" />
              </>
            }
          />

          <Seksi
            emoji="📝"
            judul="Check Point (nilai formal bulanan)"
            anak={
              <>
                <Stat label="Rata Nilai Akhir" nilai={nn(s.cpTotal)} sub={`${s.cpN} dari ${s.jumlahSiswa} siswa ikut · skala 0–100`} warna="text-violet-600 dark:text-violet-400" bandOf={s.cpTotal} />
                <Stat label="Rata Numerasi (SKIBA)" nilai={nn(s.cpNumerasi)} sub="skala 0–100" bandOf={s.cpNumerasi} />
                <Stat label="Rata Literasi (SKIBACA)" nilai={nn(s.cpLiterasi)} sub="skala 0–100" bandOf={s.cpLiterasi} />
                <Stat label="Siswa ikut Check Point" nilai={`${s.cpN}`} sub={`dari ${s.jumlahSiswa}`} />
              </>
            }
          />

          <Seksi
            emoji="📈"
            judul="Progres pengerjaan (kumulatif seluruh siswa)"
            anak={
              <>
                <Stat label="Rata level SKIBA / siswa" nilai={`${s.skibaLevelRata}`} sub={`${s.skibaLevelTotal} level, ${s.skibaTuntasTotal} topik tuntas`} warna="text-emerald-600 dark:text-emerald-400" />
                <Stat label="Rata bacaan SKIBACA / siswa" nilai={`${s.bacaSelesaiRata}`} sub={`${s.bacaSelesaiTotal} bacaan total`} warna="text-amber-600 dark:text-amber-400" />
                <Stat label="Rata % kuis SKIBACA" nilai={nn(s.bacaPersen)} sub={`${s.bacaN} siswa membaca · ${nn(s.bacaWpm)} WPM`} />
                <Stat label="Rata aktivitas latihan / siswa" nilai={`${(s.aktivitasNumRata + s.aktivitasLitRata).toFixed(1)}`} sub={`num ${s.aktivitasNumRata} · lit ${s.aktivitasLitRata}`} />
              </>
            }
          />

          {/* Perkembangan sekolah: Diagnostik → Check Point tiap bulan (skala bersama 0–100) */}
          <section className="rounded-3xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5 sm:p-5">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-200">
              <span>📉</span>
              Perkembangan sekolah: Diagnostik → Check Point tiap bulan
            </h2>
            <p className="mb-3 text-[12px] text-zinc-500 dark:text-zinc-400">
              Skala penilaian <b>bersama 0–100</b> untuk numerasi (SKIBA) &amp; literasi (SKIBACA). Titik pertama =
              baseline diagnostik; berikutnya rata Check Point tiap bulan. Selisih = Check Point − diagnostik.
            </p>
            <PerkembanganChart titik={d.perkembangan.map((t) => ({ label: t.label, numerasi: t.numerasi, literasi: t.literasi }))} />

            {/* Tabel selisih per bulan */}
            {d.perkembangan.some((t: TitikSekolah) => t.tipe === "checkpoint") && (
              <div className="mt-4 overflow-x-auto rounded-2xl border border-black/5 dark:border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-black/[0.03] text-left text-xs font-bold uppercase tracking-wide text-zinc-500 dark:bg-white/5 dark:text-zinc-400">
                    <tr>
                      <th className="px-3 py-2">Titik</th>
                      <th className="px-3 py-2">Numerasi</th>
                      <th className="px-3 py-2">Δ vs Diagnostik</th>
                      <th className="px-3 py-2">Literasi</th>
                      <th className="px-3 py-2">Δ vs Diagnostik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/10">
                    {d.perkembangan.map((t: TitikSekolah) => (
                      <tr key={t.label} className={t.tipe === "diagnostik" ? "bg-black/[0.02] dark:bg-white/[0.03]" : ""}>
                        <td className="px-3 py-2 font-semibold whitespace-nowrap">{t.label}</td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">{nn(t.numerasi)}</td>
                        <td className="px-3 py-2"><Selisih v={t.selisihNum} /></td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300">{nn(t.literasi)}</td>
                        <td className="px-3 py-2"><Selisih v={t.selisihLit} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Rincian per kelas */}
          <section>
            <h2 className="mb-2 text-sm font-bold text-zinc-700 dark:text-zinc-200">Rincian per kelas</h2>
            {/* Tabel (sm ke atas) */}
            <div className="hidden overflow-x-auto rounded-2xl border border-black/5 shadow-sm dark:border-white/10 sm:block">
              <table className="w-full text-sm">
                <thead className="bg-black/[0.03] text-left text-xs font-bold uppercase tracking-wide text-zinc-500 dark:bg-white/5 dark:text-zinc-400">
                  <tr>
                    {KOLOM.map((k) => (
                      <th key={k} className="px-3 py-2 whitespace-nowrap">
                        {k}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/10">
                  {d.perKelas.map((k) => {
                    const sel = selKelas(k);
                    return (
                      <tr key={k.kelasLabel} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                        {sel.map((v, i) => (
                          <td key={i} className={`px-3 py-2 whitespace-nowrap ${i === 0 ? "font-semibold" : "text-zinc-600 dark:text-zinc-300"}`}>
                            {v}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Kartu (mobile) */}
            <div className="flex flex-col gap-2 sm:hidden">
              {d.perKelas.map((k) => (
                <div key={k.kelasLabel} className="rounded-2xl border border-black/5 bg-white/70 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{k.kelasLabel}</span>
                    <span className="text-xs text-zinc-400">{k.jumlahSiswa} siswa</span>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px] text-zinc-600 dark:text-zinc-300">
                    <div>Diag SKIBA: <b>{k.diagSkibaN ? `${nn(k.diagSkibaSkor)} (${k.diagSkibaN})` : "–"}</b></div>
                    <div>Diag SKIBACA: <b>{k.diagBacaN ? `${nn(k.diagBacaSkor)} (${k.diagBacaN})` : "–"}</b></div>
                    <div>CP Total: <b>{k.cpN ? `${nn(k.cpTotal)} (${k.cpN})` : "–"}</b></div>
                    <div>SKIBA Lv: <b>{k.skibaLevelRata} / {k.skibaLevelTotal}</b></div>
                    <div>SKIBACA: <b>{k.bacaSelesaiRata} / {k.bacaSelesaiTotal}</b> bacaan</div>
                  </dl>
                </div>
              ))}
            </div>
          </section>

          <details className="rounded-2xl border border-black/5 bg-white/60 p-4 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
            <summary className="cursor-pointer font-semibold text-zinc-700 dark:text-zinc-200">Cara membaca angka (metodologi)</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px]">
              <li>
                <b>Diagnostik &amp; Check Point</b> — rata-rata dihitung hanya atas siswa yang mengikuti; angka
                dalam kurung <code>(n)</code> = jumlah pengikut, untuk menilai cakupan.
              </li>
              <li>
                <b>Progres pengerjaan</b> — rata-rata atas seluruh siswa (yang belum mengerjakan dihitung 0).
              </li>
              <li>
                <b>Mutu SKIBACA (% kuis &amp; WPM)</b> — hanya atas siswa yang sudah membaca minimal satu bacaan.
              </li>
              <li>
                Ekspor Excel/CSV berisi rincian lengkap per kelas + baris <b>SEKOLAH (semua)</b> dan sheet keterangan.
              </li>
            </ul>
          </details>
        </>
      )}
    </main>
  );
}
