"use client";

import { useRouter } from "next/navigation";

/** Dropdown saring kelas untuk Target → navigasi ?kelas=. Kosong = semua kelas (dalam lingkup). */
export default function PilihKelas({
  kelasOpsi,
  terpilih,
}: {
  kelasOpsi: string[];
  terpilih: string | null;
}) {
  const router = useRouter();
  return (
    <select
      value={terpilih ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        router.push(v ? `/guru/target?kelas=${encodeURIComponent(v)}` : "/guru/target");
      }}
      className="rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-violet-500 dark:border-white/20"
    >
      <option value="">Semua kelas</option>
      {kelasOpsi.map((k) => (
        <option key={k} value={k}>
          {k}
        </option>
      ))}
    </select>
  );
}
