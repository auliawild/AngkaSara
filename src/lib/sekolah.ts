/**
 * Identitas sekolah untuk kop & tanda tangan raport cetak.
 * Kop tercetak 3 baris: nama (besar) → alamat → telepon/faks + pos-el.
 * Nama pejabat (Wali Kelas & Kepala Sekolah) beserta NIP diisi lewat form di halaman raport
 * (tersimpan di browser), bukan di sini — lihat tanda-tangan.tsx.
 */
export const SEKOLAH = {
  nama: "SMK NEGERI 1 BADEGAN PONOROGO",
  alamat: "Jalan Suyudono No 1 Badegan, Badegan, Ponorogo, Jawa Timur, 63455",
  telepon: "0352-751034", // Telepon/Faksimile
  email: "smkn1badegan@gmail.com",
  kota: "Ponorogo", // dipakai pada baris tanggal tanda tangan
  logo: "/logo-sekolah.webp",
} as const;
