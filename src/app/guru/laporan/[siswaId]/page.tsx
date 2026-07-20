import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { muatRaportSiswa, muatProgresSiswa } from "@/server/laporan";
import CetakTombol from "../cetak-tombol";
import CetakWatermark from "../cetak-watermark";
import ProgresChart from "./progres-chart";
import RaportSheet from "../raport-sheet";
import { TandaTanganProvider, PanelTandaTangan } from "../tanda-tangan";

export const metadata = { title: "Raport Siswa — AngkaSara" };

const MODES = [
  { id: "hari", label: "Harian", ket: "14 hari terakhir" },
  { id: "minggu", label: "Mingguan", ket: "12 minggu terakhir" },
  { id: "bulan", label: "Bulanan", ket: "12 bulan terakhir" },
] as const;

export default async function RaportPage({
  params,
  searchParams,
}: {
  params: Promise<{ siswaId: string }>;
  searchParams: Promise<{ semester?: string; mode?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { siswaId } = await params;
  if (!session) redirect(`/masuk?tab=staf&next=/guru/laporan/${siswaId}`);
  const isAdmin = ((session.user as { role?: string }).role ?? "GURU") === "ADMIN";

  const sp = await searchParams;
  const d = await muatRaportSiswa({ siswaId, semester: sp.semester });
  if (!d) notFound();
  const { raport: r, semesterLabel } = d;
  const prog = await muatProgresSiswa({ siswaId, mode: sp.mode });
  const modeKet = MODES.find((m) => m.id === prog?.mode)?.ket ?? "";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-6 py-8">
      {/* Chrome non-cetak */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/guru/laporan?kelas=${encodeURIComponent(r.kelasLabel)}&semester=${d.semesterId}`}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Daftar {r.kelasLabel}
          </Link>
          <span className="text-sm text-zinc-500">{semesterLabel}</span>
        </div>
        {isAdmin && <CetakTombol />}
      </div>

      {/* ===== Progres Latihan harian/mingguan/bulanan (layar; cetak via halaman khusus) ===== */}
      {prog && (
        <section className="no-print rounded-xl border border-black/10 p-5 dark:border-white/15">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">📈 Progres Latihan {r.nama}</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Jumlah pengerjaan &amp; mutu capaian SKIBA/SKIBACA · {modeKet}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1 rounded-lg bg-black/5 p-1 text-sm dark:bg-white/10">
                {MODES.map((m) => (
                  <Link
                    key={m.id}
                    href={`/guru/laporan/${siswaId}?semester=${d.semesterId}&mode=${m.id}`}
                    className={
                      "rounded-md px-3 py-1 transition-colors " +
                      (prog.mode === m.id
                        ? "bg-white font-medium shadow-sm dark:bg-zinc-700"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200")
                    }
                  >
                    {m.label}
                  </Link>
                ))}
              </div>
              <Link
                href={`/guru/laporan/cetak-progres?siswaId=${siswaId}&mode=${prog.mode}`}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                🖨️ Cetak Progres
              </Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Numerasi (pengerjaan)" nilai={prog.totalNum} warna="#2563eb" />
            <StatTile label="Literasi (pengerjaan)" nilai={prog.totalLit} warna="#c9723f" />
            <StatTile label="Rata Numerasi" nilai={prog.rataNum ?? "—"} warna="#2563eb" />
            <StatTile label="Rata Literasi" nilai={prog.rataLit ?? "—"} warna="#c9723f" />
          </div>

          <div className="mt-4">
            <ProgresChart titik={prog.titik} />
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            Total {prog.totalAktivitas} pengerjaan · {prog.totalPoin} poin · aktif di {prog.bucketAktif} dari{" "}
            {prog.titik.length} periode. Arahkan kursor ke batang untuk rincian.
          </p>
        </section>
      )}

      {!isAdmin && (
        <p className="rounded-xl border border-black/10 p-4 text-sm text-zinc-500 dark:border-white/15">
          📄 Raport semester &amp; cetak hanya tersedia untuk Admin.
        </p>
      )}

      {/* ===== Lembar raport (cetak) — hanya Admin ===== */}
      {isAdmin && (
        <TandaTanganProvider>
          <PanelTandaTangan />
          <CetakWatermark />
          <RaportSheet r={r} semesterLabel={semesterLabel} tahunAjaran={d.tahunAjaran} />
        </TandaTanganProvider>
      )}
    </main>
  );
}

function StatTile({ label, nilai, warna }: { label: string; nilai: number | string; warna?: string }) {
  return (
    <div className="rounded-xl border border-black/10 p-4 dark:border-white/15">
      <div className="text-2xl font-bold" style={warna ? { color: warna } : undefined}>
        {nilai}
      </div>
      <div className="mt-0.5 text-xs text-zinc-500">{label}</div>
    </div>
  );
}
