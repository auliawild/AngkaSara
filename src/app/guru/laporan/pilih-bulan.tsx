"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Pemilih bulan (no-print): tombol ‹ bulan lalu / bulan depan › + input bulan untuk lompat langsung.
 * `base` = URL dasar tanpa param bulan (mis. ".../cetak-progres-kelas?kelas=X"); komponen menambah "&bulan=".
 */
export default function PilihBulan({
  base,
  bulanId,
  bulanLabel,
  prev,
  next,
}: {
  base: string;
  bulanId: string; // "YYYY-MM"
  bulanLabel: string;
  prev: string;
  next: string;
}) {
  const router = useRouter();
  const href = (b: string) => `${base}${base.includes("?") ? "&" : "?"}bulan=${b}`;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Link
        href={href(prev)}
        className="rounded-lg border border-black/15 px-2.5 py-1 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
      >
        ‹ Bln lalu
      </Link>
      <label className="flex items-center gap-1.5">
        <span className="min-w-[110px] text-center font-medium">{bulanLabel}</span>
        <input
          type="month"
          value={bulanId}
          onChange={(e) => {
            if (e.target.value) router.push(href(e.target.value));
          }}
          className="rounded-lg border border-black/15 px-2 py-1 dark:border-white/20 dark:bg-zinc-800"
          aria-label="Pilih bulan"
        />
      </label>
      <Link
        href={href(next)}
        className="rounded-lg border border-black/15 px-2.5 py-1 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
      >
        Bln depan ›
      </Link>
    </div>
  );
}
