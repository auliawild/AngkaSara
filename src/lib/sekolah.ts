/**
 * Identitas sekolah untuk kop & tanda tangan raport cetak.
 * ⚠️ Isi nilai placeholder ("—") dengan data resmi sebelum dipakai mencetak raport asli:
 *    npsn, alamat, telepon, kepalaSekolah, nipKepalaSekolah.
 */
export const SEKOLAH = {
  nama: "SMK NEGERI 1 BADEGAN",
  kabupaten: "Kabupaten Ponorogo",
  provinsi: "Jawa Timur",
  npsn: "—", // TODO: isi NPSN resmi
  alamat: "—", // TODO: isi alamat lengkap
  telepon: "—", // TODO: isi nomor telepon
  email: "—", // TODO: isi email resmi
  kepalaSekolah: "—", // TODO: isi nama Kepala Sekolah
  nipKepalaSekolah: "—", // TODO: isi NIP Kepala Sekolah
  kota: "Ponorogo", // kota untuk baris tanggal tanda tangan
  logo: "/logo-sekolah.webp",
} as const;
