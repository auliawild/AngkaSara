import { HARI_PENDEK } from "@/lib/kelas";
import type { KalenderData } from "@/lib/progres";

/** Warna sel menurut banyak pengerjaan (skala hijau); hari tanpa pengerjaan = abu-abu. */
function heat(total: number, max: number): { bg: string; fg: string } {
  if (total <= 0) return { bg: "#f4f4f5", fg: "#a1a1aa" };
  const r = max > 0 ? total / max : 1;
  if (r <= 0.25) return { bg: "#dcfce7", fg: "#166534" };
  if (r <= 0.5) return { bg: "#86efac", fg: "#14532d" };
  if (r <= 0.75) return { bg: "#4ade80", fg: "#052e16" };
  return { bg: "#22c55e", fg: "#ffffff" };
}

/**
 * Kalender latihan harian satu bulan. Tiap tanggal menunjukkan MENGERJAKAN atau TIDAK
 * (abu-abu = tidak) dan BERAPA BANYAK (angka + intensitas warna). Selalu tampil sebagai
 * kartu terang (konsisten di layar terang/gelap maupun saat dicetak).
 */
export default function KalenderHarian({ kal }: { kal: KalenderData }) {
  const kosongAwal = Array.from({ length: kal.dowAwal }); // sel kosong sebelum tanggal 1

  return (
    <div
      className="rounded-lg border border-zinc-200 bg-white p-3 text-zinc-900"
      style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" } as React.CSSProperties}
    >
      {/* Header hari */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-zinc-500">
        {HARI_PENDEK.map((h, i) => (
          <div key={h} className={i === 0 ? "text-red-500" : undefined}>
            {h}
          </div>
        ))}
      </div>

      {/* Grid tanggal */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {kosongAwal.map((_, i) => (
          <div key={`k${i}`} />
        ))}
        {kal.hari.map((h) => {
          const c = heat(h.total, kal.maxHarian);
          const judul = h.ada
            ? `${h.tanggal}: ${h.total} pengerjaan (numerasi ${h.num}, literasi ${h.lit})`
            : `${h.tanggal}: tidak mengerjakan`;
          return (
            <div
              key={h.tanggal}
              title={judul}
              className="flex aspect-square flex-col items-center justify-center rounded-md"
              style={{ backgroundColor: c.bg, color: c.fg }}
            >
              <span className="text-[10px] leading-none opacity-80">{h.tanggal}</span>
              <span className="text-sm font-bold leading-tight">{h.ada ? h.total : "·"}</span>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
        <span>Angka = banyak pengerjaan hari itu · titik (·) = tidak mengerjakan</span>
        <span className="flex items-center gap-1">
          Sedikit
          {["#dcfce7", "#86efac", "#4ade80", "#22c55e"].map((bg) => (
            <i key={bg} className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: bg }} />
          ))}
          Banyak
        </span>
      </div>
    </div>
  );
}
