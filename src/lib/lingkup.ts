/**
 * Aturan murni lingkup kelas seorang staf (tanpa DB/sesi — lihat `server/lingkup.ts`).
 *
 * Semantik inti, sengaja dipertahankan dari fitur penilai:
 * **daftar kosong = akses SEMUA kelas.** Admin utama & guru lama tak punya penugasan sehingga
 * perilaku mereka tidak berubah; admin yang ditugasi ≥1 kelas dipersempit ke kelas itu.
 */

export interface Lingkup {
  /** true bila staf dibatasi ke sebagian kelas. */
  dibatasi: boolean;
  /** Label kelas yang boleh diakses. Hanya berarti bila `dibatasi`. */
  labels: string[];
}

/** Bangun lingkup dari daftar kelas yang ditugaskan. */
export function lingkupDari(labels: string[]): Lingkup {
  return { dibatasi: labels.length > 0, labels };
}

/** Bolehkah staf ini mengakses kelas `label`? */
export function bolehKelas(l: Lingkup, label: string): boolean {
  return !l.dibatasi || l.labels.includes(label);
}

/**
 * Potongan `where` Prisma untuk kolom label kelas (mis. `CheckpointResult.kelasLabel`).
 * `undefined` = jangan tambahkan filter apa pun.
 */
export function whereLabel(l: Lingkup): { in: string[] } | undefined {
  return l.dibatasi ? { in: l.labels } : undefined;
}

/** Daftar kelas untuk banner UI; null = tak dibatasi (semua kelas). */
export function dibatasiKe(l: Lingkup): string[] | null {
  return l.dibatasi ? l.labels : null;
}
