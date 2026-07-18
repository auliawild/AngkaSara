"use client";

import { useRouter } from "next/navigation";
import { ikonJurusan } from "@/lib/kelas";

export default function FilterLaporan({
  kelasOpsi,
  semesterOpsi,
  kelas,
  semester,
}: {
  kelasOpsi: string[];
  semesterOpsi: { id: string; label: string }[];
  kelas: string | null;
  semester: string;
}) {
  const router = useRouter();
  const pergi = (k: string, sem: string) => {
    const qs = new URLSearchParams();
    if (k) qs.set("kelas", k);
    qs.set("semester", sem);
    router.push(`/guru/laporan?${qs.toString()}`);
  };

  const sel =
    "rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-white/20";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select className={sel} value={kelas ?? ""} onChange={(e) => pergi(e.target.value, semester)}>
        <option value="">— Pilih kelas —</option>
        {kelasOpsi.map((k) => (
          <option key={k} value={k}>
            {ikonJurusan(k)} {k}
          </option>
        ))}
      </select>
      <select className={sel} value={semester} onChange={(e) => pergi(kelas ?? "", e.target.value)}>
        {semesterOpsi.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
