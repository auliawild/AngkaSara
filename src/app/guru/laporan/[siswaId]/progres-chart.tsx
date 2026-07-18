import type { TitikProgres } from "@/lib/progres";

const NUM = "#2563eb";
const LIT = "#e8935f";

/** Grafik batang bertumpuk (server SVG): jumlah aktivitas latihan per bucket (numerasi + literasi). */
export default function ProgresChart({ titik }: { titik: TitikProgres[] }) {
  const W = 720;
  const H = 230;
  const pad = { t: 14, r: 12, b: 40, l: 28 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const n = titik.length;

  const maxTotal = Math.max(1, ...titik.map((t) => t.total));
  const slot = iw / n;
  const bw = Math.min(34, slot * 0.62);
  const yTop = (v: number) => pad.t + ih - (v / maxTotal) * ih;
  const cx = (i: number) => pad.l + slot * i + slot / 2;

  const ada = titik.some((t) => t.total > 0);
  // gridline count: hingga 4 garis, langkah "bagus"
  const langkah = Math.max(1, Math.ceil(maxTotal / 4));
  const garis: number[] = [];
  for (let g = 0; g <= maxTotal; g += langkah) garis.push(g);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" role="img" aria-label="Grafik aktivitas latihan per periode">
        {garis.map((g) => (
          <g key={g}>
            <line x1={pad.l} y1={yTop(g)} x2={W - pad.r} y2={yTop(g)} stroke="currentColor" strokeOpacity={0.12} />
            <text x={pad.l - 5} y={yTop(g) + 3} textAnchor="end" fontSize={10} fill="currentColor" fillOpacity={0.5}>
              {g}
            </text>
          </g>
        ))}

        {titik.map((t, i) => {
          const hNum = (t.jumlahNum / maxTotal) * ih;
          const hLit = (t.jumlahLit / maxTotal) * ih;
          const x = cx(i) - bw / 2;
          const baseY = pad.t + ih;
          return (
            <g key={t.key}>
              {t.jumlahNum > 0 && (
                <rect x={x} y={baseY - hNum} width={bw} height={hNum} fill={NUM} rx={2} />
              )}
              {t.jumlahLit > 0 && (
                <rect x={x} y={baseY - hNum - hLit} width={bw} height={hLit} fill={LIT} rx={2} />
              )}
              <rect x={cx(i) - slot / 2} y={pad.t} width={slot} height={ih} fill="transparent">
                <title>
                  {t.label} — {t.total} aktivitas
                  {t.jumlahNum > 0 ? ` · Numerasi ${t.jumlahNum} (rata ${t.num})` : ""}
                  {t.jumlahLit > 0 ? ` · Literasi ${t.jumlahLit} (rata ${t.lit})` : ""}
                </title>
              </rect>
              <text
                x={cx(i)}
                y={H - 24}
                transform={n > 8 ? `rotate(-35 ${cx(i)} ${H - 24})` : undefined}
                textAnchor={n > 8 ? "end" : "middle"}
                fontSize={9.5}
                fill="currentColor"
                fillOpacity={0.55}
              >
                {t.label}
              </text>
            </g>
          );
        })}

        {!ada && (
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={13} fill="currentColor" fillOpacity={0.5}>
            Belum ada aktivitas latihan pada periode ini.
          </text>
        )}
      </svg>

      <div className="mt-1 flex flex-wrap justify-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: NUM }} /> Numerasi (SKIBA)
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LIT }} /> Literasi (SKIBACA)
        </span>
      </div>
    </div>
  );
}
