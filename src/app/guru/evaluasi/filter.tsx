"use client";

import { useRouter } from "next/navigation";
import { BULAN_PANJANG, ikonJurusan } from "@/lib/kelas";

function labelPeriode(p: string): string {
  const [th, bl] = p.split("-");
  return `${BULAN_PANJANG[Number(bl) - 1]} ${th}`;
}

export default function FilterEvaluasi({
  kelasOpsi,
  periodeOpsi,
  kelas,
  period,
}: {
  kelasOpsi: string[];
  periodeOpsi: string[];
  kelas: string;
  period: string;
}) {
  const router = useRouter();
  const pergi = (k: string, p: string) => router.push(`/guru/evaluasi?kelas=${encodeURIComponent(k)}&period=${p}`);

  const sel =
    "rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-white/20";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select className={sel} value={kelas} onChange={(e) => pergi(e.target.value, period)}>
        <option value="all">🏫 Semua kelas</option>
        {kelasOpsi.map((k) => (
          <option key={k} value={k}>
            {ikonJurusan(k)} {k}
          </option>
        ))}
      </select>
      <select
        className={sel}
        value={period}
        onChange={(e) => pergi(kelas, e.target.value)}
        disabled={periodeOpsi.length === 0}
      >
        {periodeOpsi.length === 0 ? (
          <option>{labelPeriode(period)}</option>
        ) : (
          periodeOpsi.map((p) => (
            <option key={p} value={p}>
              {labelPeriode(p)}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
