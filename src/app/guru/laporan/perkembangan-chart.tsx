import type { TitikPerkembangan } from "@/lib/laporan";

const NUM = "#2563eb"; // numerasi (SKIBA)
const LIT = "#e8935f"; // literasi (SKIBACA)

/** Titik non-null suatu domain, dengan indeks kategorinya (untuk garis yang melewati bulan kosong). */
function jalur(titik: TitikPerkembangan[], ambil: (t: TitikPerkembangan) => number | null) {
  const pts: { i: number; v: number }[] = [];
  titik.forEach((t, i) => {
    const v = ambil(t);
    if (v != null) pts.push({ i, v });
  });
  return pts;
}

/**
 * Lampiran raport: grafik garis perkembangan literasi & numerasi (skala 0..100),
 * titik pertama "Awal" dari tes diagnostik lalu skor Check Point tiap bulan.
 * Server component, warna eksplisit agar tetap tercetak.
 */
export default function PerkembanganChart({ titik }: { titik: TitikPerkembangan[] }) {
  const W = 720;
  const H = 260;
  const pad = { t: 18, r: 18, b: 42, l: 34 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const n = titik.length;

  const cx = (i: number) => (n <= 1 ? pad.l + iw / 2 : pad.l + (iw * i) / (n - 1));
  const cy = (v: number) => pad.t + ih * (1 - v / 100);

  const garis = [0, 25, 50, 75, 100];
  const num = jalur(titik, (t) => t.numerasi);
  const lit = jalur(titik, (t) => t.literasi);
  const ada = num.length > 0 || lit.length > 0;

  const polyline = (pts: { i: number; v: number }[]) => pts.map((p) => `${cx(p.i)},${cy(p.v)}`).join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" role="img" aria-label="Grafik perkembangan literasi & numerasi">
        {/* gridlines + label sumbu Y */}
        {garis.map((g) => (
          <g key={g}>
            <line x1={pad.l} y1={cy(g)} x2={W - pad.r} y2={cy(g)} stroke="#000000" strokeOpacity={0.1} />
            <text x={pad.l - 6} y={cy(g) + 3} textAnchor="end" fontSize={10} fill="#71717a">
              {g}
            </text>
          </g>
        ))}

        {/* label sumbu X */}
        {titik.map((t, i) => (
          <text
            key={t.label + i}
            x={cx(i)}
            y={H - 22}
            transform={n > 7 ? `rotate(-32 ${cx(i)} ${H - 22})` : undefined}
            textAnchor={n > 7 ? "end" : "middle"}
            fontSize={10}
            fill="#52525b"
          >
            {t.label}
          </text>
        ))}

        {/* garis + titik: literasi lalu numerasi */}
        {[
          { pts: lit, color: LIT },
          { pts: num, color: NUM },
        ].map(({ pts, color }, k) => (
          <g key={k}>
            {pts.length > 1 && <polyline points={polyline(pts)} fill="none" stroke={color} strokeWidth={2.5} />}
            {pts.map((p) => (
              <g key={p.i}>
                <circle cx={cx(p.i)} cy={cy(p.v)} r={3.5} fill={color} />
                <text x={cx(p.i)} y={cy(p.v) - 8} textAnchor="middle" fontSize={9.5} fontWeight={600} fill={color}>
                  {p.v}
                </text>
              </g>
            ))}
          </g>
        ))}

        {!ada && (
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={13} fill="#71717a">
            Belum ada data diagnostik maupun Check Point.
          </text>
        )}
      </svg>

      <div className="mt-1 flex flex-wrap justify-center gap-4 text-xs text-zinc-600">
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: NUM }} /> Numerasi
        </span>
        <span className="flex items-center gap-1.5">
          <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: LIT }} /> Literasi
        </span>
      </div>
    </div>
  );
}
