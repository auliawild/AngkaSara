/**
 * Pembaca lingkup kelas staf dari sesi + DB. Aturan murninya ada di `lib/lingkup.ts`.
 *
 * Dipakai bersama oleh Nilai Ringkasan SKIBACA, Laporan/Progres, dan Evaluasi.
 * Peringkat gabungan SENGAJA tidak memakainya: papan peringkat tetap se-sekolah
 * (lihat `server/peringkat.ts`).
 */
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { lingkupDari, type Lingkup } from "@/lib/lingkup";

// Diteruskan agar pemanggil cukup mengimpor satu modul.
export { bolehKelas, whereLabel, dibatasiKe, type Lingkup } from "@/lib/lingkup";

/** Baca lingkup kelas staf yang sedang login. Melempar bila tak ada sesi staf (sekaligus penjaga auth). */
export async function lingkupKelas(): Promise<Lingkup> {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) throw new Error("Sesi staf tidak ditemukan.");
  const u = await prisma.user.findUnique({
    where: { id: s.user.id },
    select: { kelasDinilai: { select: { label: true } } },
  });
  return lingkupDari((u?.kelasDinilai ?? []).map((k) => k.label));
}
