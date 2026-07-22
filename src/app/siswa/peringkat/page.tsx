import Link from "next/link";
import { redirect } from "next/navigation";
import { sesiSiswa } from "@/server/student-auth";
import { muatPeringkatSiswa } from "@/server/peringkat";
import { ikonJurusan } from "@/lib/kelas";
import { Blobs, HeroPeringkat } from "@/components/peringkat/hero";
import Podium from "@/components/peringkat/podium";
import Papan from "@/components/peringkat/papan";

export const metadata = { title: "Peringkat — AngkaSara" };

export default async function PeringkatSiswaPage() {
  const sesi = await sesiSiswa();
  if (!sesi) redirect("/masuk?next=/siswa/peringkat");

  const d = await muatPeringkatSiswa();
  // Siswa yang belum pernah berlatih seri di peringkat teratas bersama semua temannya yang juga 0
  // → jangan disebut "juara". Ajak berlatih dulu.
  const sudahBerlatih = (d.sayaSekolah?.nilai ?? 0) > 0;

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <Blobs />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 py-8">
        <Link href="/siswa" className="text-sm font-semibold text-violet-600 hover:underline dark:text-violet-300">
          ← Beranda
        </Link>

        {/* POSISI KAMU */}
        <HeroPeringkat
          sub="Peringkat gabungan kamu"
          judul={sudahBerlatih ? `Juara ke-${d.sayaKelas!.peringkat} di kelas` : "Ayo mulai berlatih!"}
          chips={[
            { emoji: "👥", nilai: sudahBerlatih ? `${d.sayaKelas!.peringkat}/${d.totalKelas}` : "—", label: d.kelasLabel || "kelas" },
            { emoji: "🏫", nilai: sudahBerlatih ? `${d.sayaSekolah!.peringkat}/${d.totalSiswa}` : "—", label: "sekolah" },
            { emoji: "⭐", nilai: `${d.sayaSekolah?.nilai ?? 0}`, label: "nilai gabungan" },
          ]}
          catatan={
            sudahBerlatih ? (
              <>
                🧮 SKIBA {d.sayaSekolah!.nilaiSkiba} · 📖 SKIBACA {d.sayaSekolah!.nilaiSkibaca} — nilai gabungan
                dihitung dari seberapa banyak yang kamu selesaikan <b>dan</b> seberapa tepat jawabanmu.
              </>
            ) : (
              <>
                Kerjakan arena SKIBA Math atau bacaan SKIBACA dulu, ya — begitu ada yang kamu selesaikan,
                peringkatmu langsung muncul di sini. 💪
              </>
            )
          }
        />

        {/* PODIUM 3 BESAR SEKOLAH — sama seperti tampilan guru/admin */}
        <Podium rows={d.teratasSekolah} sayaId={sesi.studentId} />

        <Papan
          judul={`👥 Juara Kelas ${d.kelasLabel}`}
          ikon={ikonJurusan(d.kelasLabel)}
          rows={d.teratasKelas}
          sayaId={sesi.studentId}
          kosong="Belum ada yang berlatih di kelasmu. Jadilah yang pertama!"
        />

        <Papan
          judul="🏫 Juara Sekolah"
          rows={d.teratasSekolah}
          sayaId={sesi.studentId}
          tampilkanKelas
          kosong="Belum ada peringkat. Ayo jadi yang pertama!"
        />
      </main>
    </div>
  );
}
