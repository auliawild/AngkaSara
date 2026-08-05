"use client";

import { useRouter } from "next/navigation";

/** Dropdown saring kelas untuk Pantauan → navigasi ?kelas=. Kosong = semua kelas. */
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
        router.push(v ? `/guru/pantau?kelas=${encodeURIComponent(v)}` : "/guru/pantau");
      }}
      className="rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-white/20"
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
