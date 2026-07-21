import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { muatProgresKelas } from "@/server/laporan";
import { ikonJurusan } from "@/lib/kelas";
import { SEKOLAH } from "@/lib/sekolah";
import CetakTombol from "../cetak-tombol";
import CetakWatermark from "../cetak-watermark";
import KopSekolah from "../kop-sekolah";
import PilihBulan from "../pilih-bulan";

export const metadata = { title: "Cetak Progres Sekelas — AngkaSara" };

function rataDari(xs: (number | null)[]): number | null {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : null;
}

export default async function CetakProgresKelasPage({
  searchParams,
}: {
  searchParams: Promise<{ kelas?: string; bulan?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const sp = await searchParams;
  if (!session) redirect("/masuk?tab=staf&next=/guru/laporan");
  if (!sp.kelas) redirect("/guru/laporan");

  const d = await muatProgresKelas({ kelas: sp.kelas, bulan: sp.bulan });
  if (!d) notFound();

  const base = `/guru/laporan/cetak-progres-kelas?kelas=${encodeURIComponent(d.kelas)}`;
  const tglCetak = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const rataNumKelas = rataDari(d.baris.map((b) => b.rataNum));
  const rataLitKelas = rataDari(d.baris.map((b) => b.rataLit));
  const totNum = d.baris.reduce((s, b) => s + b.totalNum, 0);
  const totLit = d.baris.reduce((s, b) => s + b.totalLit, 0);
  const totPoin = d.baris.reduce((s, b) => s + b.totalPoin, 0);

  return (
    <main className="mx-auto flex w-full max-w-[210mm] flex-1 flex-col gap-5 px-6 py-8">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/guru/laporan?kelas=${encodeURIComponent(d.kelas)}`}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Daftar {d.kelas}
          </Link>
          <PilihBulan base={base} bulanId={d.bulanId} bulanLabel={d.bulanLabel} prev={d.prev} next={d.next} />
        </div>
        <CetakTombol label="🖨️ Cetak Rekap" />
      </div>

      <CetakWatermark />
      <article className="cetak-lembar relative isolate rounded-xl border border-black/10 text-zinc-900 shadow-sm">
        <KopSekolah />

        <h2 className="mt-5 text-center text-base font-bold uppercase leading-snug tracking-wider">
          Rekap Progres Latihan Sekelas
          <br />
          Literasi &amp; Numerasi
        </h2>
        <p className="mt-1 text-center text-sm text-zinc-600">
          Kelas {ikonJurusan(d.kelas)} {d.kelas} · Rekap Bulan {d.bulanLabel}
        </p>

        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-100 text-left">
              <Th>No</Th>
              <Th>Nama</Th>
              <Th center>Numerasi</Th>
              <Th center>Rata Nilai</Th>
              <Th center>Literasi</Th>
              <Th center>Rata Nilai</Th>
              <Th center>Poin</Th>
            </tr>
          </thead>
          <tbody>
            {d.baris.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-zinc-300 px-3 py-2 text-center text-zinc-500">
                  Belum ada siswa aktif di kelas ini.
                </td>
              </tr>
            ) : (
              d.baris.map((b, i) => (
                <tr key={b.siswaId}>
                  <Td center>{i + 1}</Td>
                  <Td>
                    {b.nama}
                    <span className="block text-xs text-zinc-500">{b.nisn}</span>
                  </Td>
                  <Td center>{b.totalNum}</Td>
                  <Td center>{b.rataNum ?? "—"}</Td>
                  <Td center>{b.totalLit}</Td>
                  <Td center>{b.rataLit ?? "—"}</Td>
                  <Td center>{b.totalPoin}</Td>
                </tr>
              ))
            )}
          </tbody>
          {d.baris.length > 0 && (
            <tfoot>
              <tr className="bg-zinc-50 font-bold">
                <Td center>—</Td>
                <Td>Rata / Total Kelas</Td>
                <Td center>{totNum}</Td>
                <Td center>{rataNumKelas ?? "—"}</Td>
                <Td center>{totLit}</Td>
                <Td center>{rataLitKelas ?? "—"}</Td>
                <Td center>{totPoin}</Td>
              </tr>
            </tfoot>
          )}
        </table>

        <p className="mt-2 text-xs text-zinc-500">
          Kolom Numerasi/Literasi = jumlah pengerjaan (kuantitas); Rata Nilai = mutu capaian (skor rata-rata 0–100).
        </p>

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
    </main>
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
