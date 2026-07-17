"use client";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export default function KeluarStaf() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await signOut();
        router.push("/masuk?tab=staf");
        router.refresh();
      }}
      className="self-start rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
    >
      Keluar
    </button>
  );
}
