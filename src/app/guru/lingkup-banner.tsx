/**
 * Pemberitahuan bahwa staf ini hanya melihat sebagian kelas. Tanpa ini, admin ber-lingkup
 * akan mengira datanya hilang/bug. `kelas={null}` = tak dibatasi → tak menampilkan apa pun.
 */
export default function LingkupBanner({ kelas }: { kelas: string[] | null }) {
  if (!kelas || kelas.length === 0) return null;
  return (
    <div className="no-print rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200">
      🏫 Anda ditugasi <b>{kelas.length} kelas</b>: {kelas.join(", ")}. Halaman ini hanya menampilkan
      kelas tersebut. <span className="opacity-80">Papan Peringkat tetap menampilkan seluruh sekolah.</span>
    </div>
  );
}
