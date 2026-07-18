/**
 * Satu lembar raport siap cetak (server component). Dipakai halaman raport 1 siswa
 * maupun cetak sekelas. Blok tanda tangan diambil dari TandaTanganProvider (client).
 */
import { BULAN_PANJANG, ikonJurusan } from "@/lib/kelas";
import { SKIBA_TOTAL_LEVEL, SKIBA_TOTAL_TOPIK, type RaportSiswa } from "@/lib/laporan";
import { SEKOLAH } from "@/lib/sekolah";
import { BlokTandaTangan } from "./tanda-tangan";

function labelBulan(period: string): string {
  const [th, bl] = period.split("-");
  return `${BULAN_PANJANG[Number(bl) - 1]} ${th}`;
}

function deskripsiNaratif(nama: string, total: number | null, klasLabel?: string): string {
  if (total == null)
    return `${nama} belum mengikuti Check Point pada semester ini, sehingga nilai akhir belum dapat ditetapkan. Mohon dorong ${nama} untuk mengerjakan Check Point bulanan.`;
  if (total >= 90)
    return `${nama} menunjukkan penguasaan literasi & numerasi yang sangat baik (${klasLabel}). Pertahankan dan tantang dengan materi pengayaan.`;
  if (total >= 75)
    return `${nama} memperlihatkan kemampuan literasi & numerasi yang baik (${klasLabel}). Teruskan latihan agar semakin mahir.`;
  if (total >= 60)
    return `${nama} mencapai tingkat cukup (${klasLabel}). Perbanyak latihan SKIBA Math & SKIBACA untuk menguatkan pemahaman.`;
  return `${nama} masih memerlukan bimbingan (${klasLabel}). Perlu pendampingan lebih intensif serta latihan rutin literasi & numerasi.`;
}

export default function RaportSheet({
  r,
  semesterLabel,
  tahunAjaran,
}: {
  r: RaportSiswa;
  semesterLabel: string;
  tahunAjaran: string;
}) {
  return (
    <article className="cetak-raport rounded-xl border border-black/10 bg-white p-8 text-zinc-900 shadow-sm">
      {/* Kop sekolah */}
      <header className="flex items-center gap-4 border-b-2 border-zinc-800 pb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SEKOLAH.logo} alt="Logo sekolah" width={68} height={68} className="h-17 w-17 object-contain" />
        <div className="flex-1 text-center leading-snug">
          <h1 className="text-lg font-black tracking-wide">{SEKOLAH.nama}</h1>
          <p className="text-xs">{SEKOLAH.alamat}</p>
          <p className="text-[11px] text-zinc-600">
            Telepon/Faksimile {SEKOLAH.telepon}, Pos-el : {SEKOLAH.email}
          </p>
        </div>
        <div className="w-17" />
      </header>

      {/* Judul dokumen — dua baris */}
      <h2 className="mt-5 text-center text-base font-bold uppercase leading-snug tracking-wider">
        Laporan Hasil Belajar
        <br />
        Literasi &amp; Numerasi
      </h2>
      <p className="mt-1 text-center text-sm text-zinc-600">Tahun Ajaran {tahunAjaran}</p>

      {/* Identitas */}
      <section className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <Baris k="Nama" v={r.nama} />
        <Baris k="Kelas" v={`${ikonJurusan(r.kelasLabel)} ${r.kelasLabel}`} />
        <Baris k="NISN" v={r.nisn} />
        <Baris k="Semester" v={semesterLabel} />
      </section>

      {/* A. Check Point */}
      <section className="mt-5">
        <h3 className="text-sm font-bold">A. Nilai Check Point (Asesmen Formal Bulanan)</h3>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-100 text-left">
              <Th>Bulan</Th>
              <Th center>Numerasi</Th>
              <Th center>Literasi</Th>
              <Th center>Nilai</Th>
            </tr>
          </thead>
          <tbody>
            {r.cp.perBulan.length === 0 ? (
              <tr>
                <td colSpan={4} className="border border-zinc-300 px-3 py-2 text-center text-zinc-500">
                  Belum ada Check Point pada semester ini.
                </td>
              </tr>
            ) : (
              r.cp.perBulan.map((b) => (
                <tr key={b.period}>
                  <Td>{labelBulan(b.period)}</Td>
                  <Td center>{b.numerasi}</Td>
                  <Td center>{b.literasi}</Td>
                  <Td center bold>
                    {b.total}
                  </Td>
                </tr>
              ))
            )}
            {r.cp.ikut > 0 && (
              <tr className="bg-zinc-50 font-bold">
                <Td>Rata-rata ({r.cp.ikut} bln)</Td>
                <Td center>{r.cp.numerasi}</Td>
                <Td center>{r.cp.literasi}</Td>
                <Td center>{r.cp.total}</Td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-3 flex items-center gap-3">
          <div className="rounded-lg border border-zinc-300 px-4 py-2 text-center">
            <div className="text-xs text-zinc-500">Nilai Akhir</div>
            <div className="text-2xl font-black" style={{ color: r.cp.klas?.color }}>
              {r.cp.total ?? "—"}
            </div>
          </div>
          {r.cp.klas && (
            <span
              className="rounded-full px-3 py-1 text-sm font-semibold"
              style={{ backgroundColor: r.cp.klas.color + "22", color: r.cp.klas.color }}
            >
              {r.cp.klas.ic} {r.cp.klas.label}
            </span>
          )}
        </div>
      </section>

      {/* B. Capaian latihan */}
      <section className="mt-5">
        <h3 className="text-sm font-bold">B. Capaian Latihan Mandiri</h3>
        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-zinc-300 p-3">
            <div className="font-semibold">🧮 SKIBA Math (Numerasi)</div>
            <ul className="mt-1 space-y-0.5 text-zinc-700">
              <li>
                Level selesai: <b>{r.skiba.levelSelesai}</b> / {SKIBA_TOTAL_LEVEL}
              </li>
              <li>
                Topik tuntas: <b>{r.skiba.topikTuntas}</b> / {SKIBA_TOTAL_TOPIK}
              </li>
              <li>
                Total poin: <b>{r.skiba.totalPoin}</b>
              </li>
            </ul>
          </div>
          <div className="rounded-lg border border-zinc-300 p-3">
            <div className="font-semibold">📖 SKIBACA (Literasi)</div>
            <ul className="mt-1 space-y-0.5 text-zinc-700">
              <li>
                Bacaan selesai: <b>{r.skibaca.bacaanSelesai}</b>
              </li>
              <li>
                Rata skor kuis: <b>{r.skibaca.rataPersen ?? "—"}</b>
                {r.skibaca.rataPersen != null ? "%" : ""} · Kecepatan: <b>{r.skibaca.rataWpm ?? "—"}</b> kpm
              </li>
              <li>
                Ringkasan dinilai: <b>{r.skibaca.ringkasanDinilai}</b>/{r.skibaca.ringkasanKirim}
                {r.skibaca.rataRingkasan != null && ` · rata ${r.skibaca.rataRingkasan}`}
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Keaktifan latihan semester ini: {r.aktivitasNumerasi} sesi numerasi · {r.aktivitasLiterasi} sesi literasi.
        </p>
      </section>

      {/* C. Catatan */}
      <section className="mt-5">
        <h3 className="text-sm font-bold">C. Catatan</h3>
        <p className="mt-1 text-sm text-zinc-700">{deskripsiNaratif(r.nama, r.cp.total, r.cp.klas?.label)}</p>
      </section>

      <BlokTandaTangan kota={SEKOLAH.kota} />
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
function Td({ children, center, bold }: { children: React.ReactNode; center?: boolean; bold?: boolean }) {
  return (
    <td className={`border border-zinc-300 px-3 py-1.5 ${center ? "text-center" : ""} ${bold ? "font-bold" : ""}`}>
      {children}
    </td>
  );
}
