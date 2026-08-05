"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Menyegarkan data server (router.refresh) tiap `detik` untuk kesan real-time.
 * Bisa dijeda. Tak menyentuh scroll (refresh lembut Next).
 */
export default function AutoRefresh({ detik = 30 }: { detik?: number }) {
  const router = useRouter();
  const [aktif, setAktif] = useState(true);

  useEffect(() => {
    if (!aktif) return;
    const t = setInterval(() => router.refresh(), detik * 1000);
    return () => clearInterval(t);
  }, [aktif, detik, router]);

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500">
      <span className={"inline-block h-2 w-2 rounded-full " + (aktif ? "animate-pulse bg-green-500" : "bg-zinc-400")} />
      <button
        onClick={() => setAktif((v) => !v)}
        className="rounded-md border border-black/10 px-2 py-1 font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        title="Segarkan otomatis"
      >
        {aktif ? `Auto ${detik}s` : "Dijeda"}
      </button>
      <button
        onClick={() => router.refresh()}
        className="rounded-md border border-black/10 px-2 py-1 font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
      >
        Segarkan
      </button>
    </div>
  );
}
