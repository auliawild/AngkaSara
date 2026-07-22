import type { ReactNode } from "react";

/**
 * Blob dekoratif latar halaman peringkat — sama untuk siswa, guru, & admin supaya
 * latar terasa satu aplikasi. Dipasang di dalam wadah `relative overflow-hidden`.
 */
export function Blobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="as-blob absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-400/30 blur-3xl dark:bg-amber-600/20" />
      <div
        className="as-blob absolute -right-20 top-40 h-72 w-72 rounded-full bg-violet-400/25 blur-3xl dark:bg-violet-700/20"
        style={{ animationDelay: "3s" }}
      />
    </div>
  );
}

export interface ChipData {
  emoji: string;
  nilai: string;
  label: string;
}

function Chip({ emoji, nilai, label }: ChipData) {
  return (
    <div className="rounded-2xl bg-white/15 px-2 py-2.5 text-center backdrop-blur">
      <div className="text-base leading-none">{emoji}</div>
      <div className="mt-1 text-lg font-black leading-none">{nilai}</div>
      <div className="mt-1 text-[10px] font-medium leading-tight text-white/75">{label}</div>
    </div>
  );
}

/**
 * Kartu hero gradien peringkat — bentuk, warna, & animasi identik untuk semua peran.
 * Isi (judul/sub/chip/catatan) berbeda tiap peran, tapi tampilannya satu bahasa desain.
 */
export function HeroPeringkat({
  judul,
  sub,
  chips,
  catatan,
  emojiLatar = "🏆",
}: {
  judul: string;
  sub?: string;
  chips: ChipData[];
  catatan?: ReactNode;
  emojiLatar?: string;
}) {
  return (
    <section className="as-pop relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 text-white shadow-xl shadow-orange-500/20">
      <div aria-hidden className="absolute -right-6 -top-8 select-none text-9xl opacity-20 as-float">
        {emojiLatar}
      </div>
      <div className="relative">
        {sub && <p className="text-sm font-medium text-white/80">{sub}</p>}
        <h1 className="mt-0.5 text-3xl font-black tracking-tight">{judul}</h1>
        {chips.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {chips.map((c) => (
              <Chip key={c.label} {...c} />
            ))}
          </div>
        )}
        {catatan && <p className="mt-3 text-xs font-medium text-white/80">{catatan}</p>}
      </div>
    </section>
  );
}
