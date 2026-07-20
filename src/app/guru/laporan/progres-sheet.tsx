/**
 * Satu lembar "Laporan Progres Latihan" siap cetak (A4, server component). Fokus pada KALENDER
 * LATIHAN HARIAN satu bulan: tiap tanggal mengerjakan atau tidak & berapa banyak (numerasi/literasi),
 * dilengkapi ringkasan bulan + rincian hari aktif. Dipakai cetak perorangan (guru & admin).
 */
import { HARI_PENDEK, ikonJurusan } from "@/lib/kelas";
import type { KalenderData } from "@/lib/progres";
import { SEKOLAH } from "@/lib/sekolah";
import KalenderHarian from "./kalender-harian";
import KopSekolah from "./kop-sekolah";

const NUM = "#2563eb";
const LIT = "#c9723f";

export default function ProgresSheet({
  nama,
  nisn,
  kelasLabel,
  bulanLabel,
  kal,
}: {
  nama: string;
  nisn: string;
  kelasLabel: string;
  bulanLabel: string;
  kal: KalenderData;
}) {
  const tglCetak = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const hariAktif = kal.hari.filter((h) => h.ada);

  return (
    <article className="cetak-lembar relative isolate rounded-xl border border-black/10 text-zinc-900 shadow-sm">
      <KopSekolah />

      <h2 className="mt-5 text-center text-base font-bold uppercase leading-snug tracking-wider">
        Laporan Progres Latihan
        <br />
        Kalender Latihan Harian
      </h2>
      <p className="mt-1 text-center text-sm text-zinc-600">{bulanLabel}</p>

      {/* Identitas */}
      <section className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <Baris k="Nama" v={nama} />
        <Baris k="Kelas" v={`${ikonJurusan(kelasLabel)} ${kelasLabel}`} />
        <Baris k="NISN" v={nisn} />
        <Baris k="Bulan" v={bulanLabel} />
      </section>

      {/* A. Ringkasan bulan */}
      <section className="mt-5">
        <h3 className="text-sm font-bold">A. Ringkasan Bulan</h3>
        <div className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Kotak label={`Hari aktif (dari ${kal.jumlahHari})`} nilai={kal.hariAktif} />
          <Kotak label="Total pengerjaan" nilai={kal.total} />
          <Kotak label="Numerasi (rata nilai)" nilai={`${kal.totalNum} (${kal.rataNum ?? "—"})`} warna={NUM} />
          <Kotak label="Literasi (rata nilai)" nilai={`${kal.totalLit} (${kal.rataLit ?? "—"})`} warna={LIT} />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Rentetan hari aktif terpanjang: <b>{kal.streakTerpanjang}</b> hari.
        </p>
      </section>

      {/* B. Kalender */}
      <section className="mt-5">
        <h3 className="text-sm font-bold">B. Kalender Latihan Harian</h3>
        <div className="mt-2">
          <KalenderHarian kal={kal} />
        </div>
      </section>

      {/* C. Rincian hari aktif */}
      <section className="mt-5">
        <h3 className="text-sm font-bold">C. Rincian Hari Mengerjakan</h3>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-100 text-left">
              <Th>Tanggal</Th>
              <Th center>Numerasi</Th>
              <Th center>Literasi</Th>
              <Th center>Total</Th>
            </tr>
          </thead>
          <tbody>
            {hariAktif.length === 0 ? (
              <tr>
                <td colSpan={4} className="border border-zinc-300 px-3 py-2 text-center text-zinc-500">
                  Tidak ada hari mengerjakan pada bulan ini.
                </td>
              </tr>
            ) : (
              hariAktif.map((h) => (
                <tr key={h.tanggal}>
                  <Td>
                    {HARI_PENDEK[h.dow]}, {h.tanggal} {bulanLabel}
                  </Td>
                  <Td center>{h.num}</Td>
                  <Td center>{h.lit}</Td>
                  <Td center>{h.total}</Td>
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
function Kotak({ label, nilai, warna }: { label: string; nilai: number | string; warna?: string }) {
  return (
    <div className="rounded-lg border border-zinc-300 p-3">
      <div className="text-xl font-bold" style={warna ? { color: warna } : undefined}>
        {nilai}
      </div>
      <div className="mt-0.5 text-xs text-zinc-500">{label}</div>
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
