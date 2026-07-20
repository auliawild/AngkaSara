import { SEKOLAH } from "@/lib/sekolah";

/** Kop surat sekolah (logo + nama + alamat + kontak) — dipakai lembar raport & progres. */
export default function KopSekolah() {
  return (
    <header className="flex items-center gap-4 border-b-2 border-zinc-800 pb-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SEKOLAH.logo} alt="Logo sekolah" width={68} height={68} className="h-17 w-17 object-contain" />
      <div className="flex-1 text-center leading-snug">
        <h1 className="text-lg font-black tracking-wide">{SEKOLAH.nama}</h1>
        <p className="text-xs">{SEKOLAH.alamat}</p>
        <p className="text-[11px] text-zinc-600">
          Telepon/Faksimile {SEKOLAH.telepon}, Pos-el : {SEKOLAH.email}
        </p>
      </div>
      <div className="w-17" />
    </header>
  );
}
