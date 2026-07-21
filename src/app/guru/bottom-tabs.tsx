"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/guru", emoji: "🏠", label: "Beranda" },
  { href: "/guru/evaluasi", emoji: "📊", label: "Evaluasi" },
  { href: "/guru/laporan", emoji: "📄", label: "Laporan" },
  { href: "/guru/peringkat", emoji: "🏆", label: "Peringkat" },
  { href: "/guru/profil", emoji: "👤", label: "Profil" },
];

/** Tab bar bawah untuk layar sempit. Rute cetak (lembar A4) disembunyikan. */
export default function BottomTabs() {
  const path = usePathname() ?? "";
  if (path.includes("/cetak")) return null;

  const aktif = (href: string) => (href === "/guru" ? path === "/guru" : path.startsWith(href));

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/85"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-3 py-2">
        {TABS.map((t) => {
          const on = aktif(t.href);
          return (
            <Link key={t.href} href={t.href} className="flex flex-1 flex-col items-center gap-0.5 py-1">
              <span
                className="text-[22px] leading-none transition-[filter]"
                style={{ filter: on ? "none" : "grayscale(1) opacity(.55)" }}
              >
                {t.emoji}
              </span>
              <span
                className={
                  on
                    ? "text-[10px] font-extrabold text-violet-700 dark:text-violet-300"
                    : "text-[10px] font-semibold text-zinc-500 dark:text-zinc-400"
                }
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
