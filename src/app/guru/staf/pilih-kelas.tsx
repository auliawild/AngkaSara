"use client";

export interface OpsiKelas {
  id: string;
  label: string;
  tingkat: string;
}

const TINGKAT = ["X", "XI", "XII"];

/** Pemilih kelas (checkbox) terkontrol, dikelompokkan per tingkat. Dipakai Tambah Admin & editor staf. */
export default function PilihKelas({
  opsi,
  nilai,
  onChange,
}: {
  opsi: OpsiKelas[];
  nilai: string[];
  onChange: (ids: string[]) => void;
}) {
  const set = new Set(nilai);
  const toggle = (id: string) => {
    const n = new Set(set);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    onChange([...n]);
  };
  const toggleTingkat = (list: OpsiKelas[], on: boolean) => {
    const n = new Set(set);
    for (const o of list) {
      if (on) n.add(o.id);
      else n.delete(o.id);
    }
    onChange([...n]);
  };
  const groups = TINGKAT.map((t) => ({ t, list: opsi.filter((o) => o.tingkat === t) })).filter((g) => g.list.length);

  return (
    <div className="flex flex-col gap-3">
      {groups.map((g) => {
        const semua = g.list.every((o) => set.has(o.id));
        return (
          <div key={g.t}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500">Tingkat {g.t}</span>
              <button
                type="button"
                onClick={() => toggleTingkat(g.list, !semua)}
                className="text-[11px] font-semibold text-violet-600 hover:underline dark:text-violet-400"
              >
                {semua ? "Kosongkan" : "Pilih semua"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {g.list.map((o) => {
                const on = set.has(o.id);
                return (
                  <button
                    type="button"
                    key={o.id}
                    onClick={() => toggle(o.id)}
                    aria-pressed={on}
                    className={
                      "rounded-lg border px-2 py-1.5 text-left text-xs font-medium transition-colors " +
                      (on
                        ? "border-violet-500 bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200"
                        : "border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10")
                    }
                  >
                    <span className="mr-1">{on ? "☑" : "☐"}</span>
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
