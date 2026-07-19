"use client";

import { useRouter } from "next/navigation";
import { ikonJurusan } from "@/lib/kelas";

/** Pemilih lingkup papan peringkat: seluruh sekolah / satu kelas / antar kelas. */
export default function FilterPeringkat({
  kelasOpsi,
  lingkup,
  kelas,
}: {
  kelasOpsi: string[];
  lingkup: "sekolah" | "kelas" | "antarkelas";
  kelas: string;
}) {
  const router = useRouter();
  const pergi = (l: string, k: string) => {
    const qs = new URLSearchParams({ lingkup: l });
    if (l === "kelas" && k) qs.set("kelas", k);
    router.push(`/guru/peringkat?${qs.toString()}`);
  };

  const tab =
    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors border border-black/10 dark:border-white/15";
  const aktif = "bg-blue-600 text-white border-blue-600 dark:border-blue-600";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(
        [
          ["sekolah", "🏫 Seluruh Siswa"],
          ["kelas", "👥 Per Kelas"],
          ["antarkelas", "🏆 Antar Kelas"],
        ] as const
      ).map(([id, label]) => (
        <button key={id} type="button" onClick={() => pergi(id, kelas)} className={`${tab} ${lingkup === id ? aktif : ""}`}>
          {label}
        </button>
      ))}
      {lingkup === "kelas" && (
        <select
          className="rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-white/20"
          value={kelas}
          onChange={(e) => pergi("kelas", e.target.value)}
        >
          <option value="">— Pilih kelas —</option>
          {kelasOpsi.map((k) => (
            <option key={k} value={k}>
              {ikonJurusan(k)} {k}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
