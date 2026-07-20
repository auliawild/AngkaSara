/**
 * Satu lembar "Progres Latihan" siap cetak (A4, server component). Menampilkan jumlah pengerjaan
 * numerasi & literasi terpisah (kuantitas) beserta mutu capaian (rata nilai), grafik per periode,
 * dan rincian tiap periode. Dipakai cetak perorangan (guru & admin).
 */
import { ikonJurusan } from "@/lib/kelas";
import type { ProgresData } from "@/lib/progres";
import { SEKOLAH } from "@/lib/sekolah";
import KopSekolah from "./kop-sekolah";
import ProgresChart from "./[siswaId]/progres-chart";

const NUM = "#2563eb";
const LIT = "#c9723f";

export default function ProgresSheet({
  nama,
  nisn,
  kelasLabel,
  prog,
  modeLabel,
  ket,
}: {
  nama: string;
  nisn: string;
  kelasLabel: string;
  prog: ProgresData;
  modeLabel: string; // "Harian" | "Mingguan" | "Bulanan"
  ket: string; // "14 hari terakhir" dst.
}) {
  const tglCetak = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  return (
    <article className="cetak-lembar relative isolate rounded-xl border border-black/10 text-zinc-900 shadow-sm">
      <KopSekolah />

      <h2 className="mt-5 text-center text-base font-bold uppercase leading-snug tracking-wider">
        Laporan Progres Latihan
        <br />
        Literasi &amp; Numerasi
      </h2>
      <p className="mt-1 text-center text-sm text-zinc-600">
        Rekap {modeLabel} · {ket}
      </p>

      {/* Identitas */}
      <section className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <Baris k="Nama" v={nama} />
        <Baris k="Kelas" v={`${ikonJurusan(kelasLabel)} ${kelasLabel}`} />
        <Baris k="NISN" v={nisn} />
        <Baris k="Rekap" v={modeLabel} />
      </section>

      {/* A. Ringkasan kuantitas & mutu */}
      <section className="mt-5">
        <h3 className="text-sm font-bold">A. Ringkasan</h3>
        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-zinc-300 p-3">
            <div className="font-semibold" style={{ color: NUM }}>
              🧮 Numerasi (SKIBA)
            </div>
            <ul className="mt-1 space-y-0.5 text-zinc-700">
              <li>
                Jumlah pengerjaan: <b>{prog.totalNum}</b>
              </li>
              <li>
                Mutu (rata nilai): <b>{prog.rataNum ?? "—"}</b>
              </li>
            </ul>
          </div>
          <div className="rounded-lg border border-zinc-300 p-3">
            <div className="font-semibold" style={{ color: LIT }}>
              📖 Literasi (SKIBACA)
            </div>
            <ul className="mt-1 space-y-0.5 text-zinc-700">
              <li>
                Jumlah pengerjaan: <b>{prog.totalLit}</b>
              </li>
              <li>
                Mutu (rata nilai): <b>{prog.rataLit ?? "—"}</b>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Total pengerjaan: <b>{prog.totalAktivitas}</b> · Total poin: <b>{prog.totalPoin}</b> · Aktif di{" "}
          {prog.bucketAktif} dari {prog.titik.length} periode.
        </p>
      </section>

      {/* B. Grafik jumlah pengerjaan per periode */}
      <section className="mt-5">
        <h3 className="text-sm font-bold">B. Jumlah Pengerjaan per Periode</h3>
        <div className="mt-2 rounded-lg border border-zinc-300 p-2">
          <ProgresChart titik={prog.titik} />
        </div>
      </section>

      {/* C. Rincian per periode */}
      <section className="mt-5">
        <h3 className="text-sm font-bold">C. Rincian per Periode</h3>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-100 text-left">
              <Th>Periode</Th>
              <Th center>Numerasi</Th>
              <Th center>Rata Nilai</Th>
              <Th center>Literasi</Th>
              <Th center>Rata Nilai</Th>
              <Th center>Poin</Th>
            </tr>
          </thead>
          <tbody>
            {prog.titik.filter((t) => t.total > 0).length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-zinc-300 px-3 py-2 text-center text-zinc-500">
                  Belum ada pengerjaan pada rentang ini.
                </td>
              </tr>
            ) : (
              prog.titik
                .filter((t) => t.total > 0)
                .map((t) => (
                  <tr key={t.key}>
                    <Td>{t.label}</Td>
                    <Td center>{t.jumlahNum}</Td>
                    <Td center>{t.num ?? "—"}</Td>
                    <Td center>{t.jumlahLit}</Td>
                    <Td center>{t.lit ?? "—"}</Td>
                    <Td center>{t.poin}</Td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </section>

      {/* Tanda tangan ringkas */}
      <section className="mt-8 flex justify-end text-sm">
        <div className="text-center">
          <p>
            {SEKOLAH.kota}, {tglCetak}
          </p>
          <p>Guru/Wali Kelas</p>
          <div className="h-16" />
          <p className="font-semibold">( ................................ )</p>
        </div>
      </section>
    </article>
  );
}

function Baris({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-24 shrink-0 text-zinc-500">{k}</span>
      <span className="text-zinc-500">:</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
function Th({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <th className={`border border-zinc-300 px-3 py-1.5 font-semibold ${center ? "text-center" : ""}`}>{children}</th>
  );
}
function Td({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return <td className={`border border-zinc-300 px-3 py-1.5 ${center ? "text-center" : ""}`}>{children}</td>;
}
