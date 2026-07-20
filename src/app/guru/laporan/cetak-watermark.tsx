import { SEKOLAH } from "@/lib/sekolah";

/**
 * Watermark lambang sekolah yang tercetak di SETIAP halaman. Hanya tampil saat cetak
 * (kelas `.cetak-watermark` di globals.css memakai `position: fixed` sehingga diulang
 * per halaman oleh mesin cetak). Dipasang sekali per halaman cetak (raport/progres).
 */
export default function CetakWatermark() {
  return (
    <div aria-hidden className="cetak-watermark">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SEKOLAH.logo} alt="" />
    </div>
  );
}
