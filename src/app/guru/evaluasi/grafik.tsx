import { bucketLabel } from "@/lib/kelas";
import type { TitikPerkembangan } from "@/lib/evaluasi";

const SERI = [
  { key: "numerasi", nama: "Numerasi", color: "#2563eb", tebal: false },
  { key: "literasi", nama: "Literasi", color: "#e8935f", tebal: false },
  { key: "total", nama: "Nilai Akhir", color: "#7c5cff", tebal: true },
] as const;

/** Grafik garis perkembangan (server SVG). Kesulitan soal antar bulan setara → naik = kemajuan nyata. */
export default function Grafik({ data }: { data: TitikPerkembangan[] }) {
  const W = 720;
  const H = 260;
  const pad = { t: 16, r: 16, b: 34, l: 34 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const n = data.length;

  const x = (i: number) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / 100) * ih;

  const adaTitik = data.some((d) => d.total != null);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px]" role="img" aria-label="Perkembangan nilai Check Point">
        {/* gridlines + label sumbu Y */}
        {[0, 25, 50, 75, 100].map((g) => (
          <g key={g}>
            <line x1={pad.l} y1={y(g)} x2={W - pad.r} y2={y(g)} stroke="currentColor" strokeOpacity={0.12} />
            <text x={pad.l - 6} y={y(g) + 3} textAnchor="end" fontSize={10} fill="currentColor" fillOpacity={0.5}>
              {g}
            </text>
          </g>
        ))}

        {/* label sumbu X (bulan) */}
        {data.map((d, i) => (
          <text key={d.period} x={x(i)} y={H - 12} textAnchor="middle" fontSize={10} fill="currentColor" fillOpacity={0.55}>
            {bucketLabel(d.period, "bulan")}
          </text>
        ))}

        {/* seri */}
        {adaTitik &&
          SERI.map((s) => {
            const pts = data
              .map((d, i) => ({ i, v: d[s.key] as number | null }))
              .filter((p) => p.v != null) as { i: number; v: number }[];
            const path = pts.map((p, k) => `${k === 0 ? "M" : "L"}${x(p.i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ");
            return (
              <g key={s.key}>
                <path d={path} fill="none" stroke={s.color} strokeWidth={s.tebal ? 3 : 2} strokeLinejoin="round" strokeLinecap="round" />
                {pts.map((p) => {
                  // Satu string, satu anak: <title> diparse sbg teks mentah, jadi beberapa anak
                  // JSX memicu hydration mismatch (buglog HYD-01).
                  const judul = `${bucketLabel(data[p.i].period, "bulan")} — ${s.nama}: ${p.v}`;
                  return (
                    <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={3.5} fill="#fff" stroke={s.color} strokeWidth={2}>
                      <title>{judul}</title>
                    </circle>
                  );
                })}
              </g>
            );
          })}

        {!adaTitik && (
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={13} fill="currentColor" fillOpacity={0.5}>
            Belum ada data Check Point.
          </text>
        )}
      </svg>

      <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs">
        {SERI.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.nama}
          </span>
        ))}
      </div>
    </div>
  );
}
