import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { muatRingkasanSekolah } from "@/server/dashboard";

export const metadata = { title: "Dasbor Guru — AngkaSara" };

/** Salam menurut waktu setempat (tanpa honorifik gender). */
function salam(d = new Date()): string {
  const h = d.getHours();
  if (h >= 4 && h < 11) return "Selamat pagi";
  if (h >= 11 && h < 15) return "Selamat siang";
  if (h >= 15 && h < 19) return "Selamat sore";
  return "Selamat malam";
}

interface Modul {
  href: string;
  emoji: string;
  title: string;
  desc: string;
  grad: string;
  shadow: string;
  admin?: boolean;
}

const MODUL: Modul[] = [
  {
    href: "/guru/siswa",
    emoji: "👥",
    title: "Kelola Siswa",
    desc: "Tambah, edit, hapus, impor siswa dari Excel.",
    grad: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    shadow: "0 16px 34px -20px rgba(99,102,241,.55)",
    admin: true,
  },
  {
    href: "/guru/staf",
    emoji: "🧑‍🏫",
    title: "Kelola Guru & Staf",
    desc: "Impor guru/staf (NIP), reset sandi, hapus akun.",
    grad: "linear-gradient(135deg,#0ea5e9,#2563eb)",
    shadow: "0 16px 34px -20px rgba(37,99,235,.5)",
    admin: true,
  },
  {
    href: "/guru/kelas",
    emoji: "🏫",
    title: "Kelola Kelas",
    desc: "Pilih kelas yang aktif dikelola (aktif/nonaktifkan kelas).",
    grad: "linear-gradient(135deg,#7c3aed,#2563eb)",
    shadow: "0 16px 34px -20px rgba(124,58,237,.5)",
    admin: true,
  },
  {
    href: "/guru/simulasi",
    emoji: "🧪",
    title: "Simulasi Modul",
    desc: "Coba SKIBA Math & SKIBACA seperti siswa — hasil tak masuk peringkat.",
    grad: "linear-gradient(135deg,#0d9488,#0ea5e9)",
    shadow: "0 16px 34px -20px rgba(13,148,136,.5)",
  },
  {
    href: "/guru/laporan",
    emoji: "📄",
    title: "Laporan Progres",
    desc: "Progres siswa per kelas & semester, raport siap cetak.",
    grad: "linear-gradient(135deg,#f59e0b,#ea580c)",
    shadow: "0 16px 34px -20px rgba(234,88,12,.5)",
  },
  {
    href: "/guru/evaluasi",
    emoji: "📊",
    title: "Evaluasi",
    desc: "Nilai Check Point per kelas & periode, grafik, ekspor.",
    grad: "linear-gradient(135deg,#10b981,#0d9488)",
    shadow: "0 16px 34px -20px rgba(13,148,136,.5)",
  },
  {
    href: "/guru/peringkat",
    emoji: "🏆",
    title: "Peringkat Gabungan",
    desc: "Ranking SKIBA Math + SKIBACA seluruh siswa & kelas.",
    grad: "linear-gradient(135deg,#f43f5e,#db2777)",
    shadow: "0 16px 34px -20px rgba(219,39,119,.5)",
  },
  {
    href: "/guru/skibaca",
    emoji: "✍️",
    title: "Nilai Ringkasan SKIBACA",
    desc: "Nilai ringkasan/parafrase (bacaan 16–20) + catatan.",
    grad: "linear-gradient(135deg,#d946ef,#9333ea)",
    shadow: "0 16px 34px -20px rgba(147,51,234,.5)",
  },
];

/** Warna angka persentase Check Point mengikuti klasifikasi app. */
function warnaPersen(p: number): string {
  if (p >= 75) return "#16a34a";
  if (p >= 60) return "#ca8a04";
  return "#dc2626";
}

const KARTU =
  "rounded-[20px] bg-white p-3.5 shadow-[0_8px_22px_-16px_rgba(30,20,60,.4)] ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10";
const ANGKA = "text-[22px] font-black leading-none text-zinc-900 dark:text-zinc-50";
const LABEL = "mt-2 text-[11.5px] font-semibold text-zinc-500 dark:text-zinc-400";

export default async function GuruPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/masuk?tab=staf&next=/guru");

  const { user } = session;
  const role = (user as { role?: string }).role ?? "GURU";
  const r = await muatRingkasanSekolah();
  const modul = MODUL.filter((m) => !m.admin || role === "ADMIN");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-[18px] px-4 pb-8 pt-6 sm:px-6">
      {/* Kartu sapaan */}
      <section
        className="as-pop relative overflow-hidden rounded-[28px] p-[22px] text-white"
        style={{
          background: "linear-gradient(135deg,#4f46e5,#7c3aed 55%,#c026d3)",
          boxShadow: "0 20px 40px -18px rgba(124,58,237,.7)",
        }}
      >
        <div
          aria-hidden
          className="as-float pointer-events-none absolute -top-3.5 right-[-6px] select-none text-[110px] opacity-20"
        >
          🎓
        </div>
        <div className="relative">
          <p className="m-0 text-[13px] font-semibold text-white/80">{salam()} 👋</p>
          <h1 className="mt-0.5 text-[27px] font-black tracking-tight">{user.name}</h1>
          <div className="mt-2.5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[11.5px] font-bold backdrop-blur">
            <span>🏫 SMKN 1 Badegan</span>
            <span className="opacity-50">·</span>
            <span className="tracking-wide">{role}</span>
          </div>
        </div>
      </section>

      {/* Ringkasan Sekolah */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-sm font-extrabold text-zinc-800 dark:text-zinc-100">Ringkasan Sekolah</h2>
          <span className="text-[11px] font-semibold text-zinc-400">{r.bulanTahun}</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className={`as-pop ${KARTU}`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">🧑‍🎓</span>
              <span className={ANGKA}>{r.totalSiswa}</span>
            </div>
            <p className={LABEL}>Total Siswa</p>
          </div>
          <div className={`as-pop ${KARTU}`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏫</span>
              <span className={ANGKA}>{r.kelasAktif}</span>
            </div>
            <p className={LABEL}>Kelas Aktif</p>
          </div>
          <div className={`as-pop ${KARTU}`}>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[22px] font-black leading-none" style={{ color: warnaPersen(r.cpPersen) }}>
                {r.cpPersen}
              </span>
              <span className="text-[13px] font-extrabold" style={{ color: warnaPersen(r.cpPersen) }}>
                %
              </span>
            </div>
            <p className={LABEL}>Check Point {r.cpBulan} dikerjakan</p>
          </div>
          <div className={`as-pop ${KARTU}`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">🧑‍🏫</span>
              <span className={ANGKA}>{r.guruStaf}</span>
            </div>
            <p className={LABEL}>Guru &amp; Staf</p>
          </div>
        </div>
      </section>

      {/* Menu Pengelolaan */}
      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-sm font-extrabold text-zinc-800 dark:text-zinc-100">Menu Pengelolaan</h2>
        <div className="grid gap-3">
          {modul.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="as-pop as-lift relative flex items-center gap-3.5 overflow-hidden rounded-3xl p-4 text-white"
              style={{ background: m.grad, boxShadow: m.shadow }}
            >
              <div aria-hidden className="pointer-events-none absolute -bottom-4 right-[-10px] select-none text-[88px] opacity-15">
                {m.emoji}
              </div>
              <div className="relative flex h-[52px] w-[52px] flex-none items-center justify-center rounded-2xl bg-white/20 text-[26px] backdrop-blur">
                {m.emoji}
              </div>
              <div className="relative min-w-0 flex-1">
                <h3 className="m-0 text-base font-black leading-tight">{m.title}</h3>
                <p className="mt-1 text-[11.5px] leading-snug text-white/85">{m.desc}</p>
              </div>
              <div className="relative flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-white/20 text-base font-extrabold">
                ›
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Tip */}
      {r.kelasBelumTuntas > 0 && (
        <div className="as-pop flex items-center gap-3 rounded-[20px] bg-white/70 px-4 py-3.5 ring-1 ring-black/5 backdrop-blur dark:bg-zinc-900/70 dark:ring-white/10">
          <span className="as-float text-2xl">💡</span>
          <span className="text-[12.5px] font-semibold leading-snug text-zinc-600 dark:text-zinc-300">
            {r.kelasBelumTuntas} kelas belum menuntaskan Check Point {r.cpBulan}.{" "}
            <Link href="/guru/laporan" className="font-bold text-violet-700 underline-offset-2 hover:underline dark:text-violet-300">
              Ketuk Laporan
            </Link>{" "}
            untuk memantau.
          </span>
        </div>
      )}
    </main>
  );
}
