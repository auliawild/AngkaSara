"use client";
import { useRouter } from "next/navigation";
import { keluarSiswa } from "@/server/student-auth";

export default function KeluarSiswa() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await keluarSiswa();
        router.push("/masuk");
        router.refresh();
      }}
      className="self-start rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
    >
      Keluar
    </button>
  );
}
