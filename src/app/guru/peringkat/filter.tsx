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
    "rounded-xl px-3 py-1.5 text-sm font-medium transition-colors border border-black/10 bg-white/60 backdrop-blur dark:border-white/15 dark:bg-white/5";
  const aktif = "bg-violet-600 text-white border-violet-600 dark:border-violet-600";

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
          className="rounded-xl border border-black/15 bg-white/60 px-3 py-1.5 text-sm outline-none backdrop-blur focus:border-violet-500 dark:border-white/20 dark:bg-white/5"
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
