"use server";
/**
 * Server actions KELOLA SISWA (staf): impor massal Excel/CSV, tambah/edit/hapus.
 * Semua aksi butuh sesi staf (Better Auth). Validasi kelas lewat `normalKelas`
 * (tolak kelas tak-ada spt "XII TPTUP 1"); NISN wajib unik. Penilaian data
 * dilakukan di server — klien tak dipercaya.
 */
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseSiswa } from "@/lib/excel";
import { hitungImpor, NISN_RE, type ImporLaporan, type KelasImpor } from "@/lib/impor";
import type { Tingkat } from "@/lib/kelas";
import { prefixUsername, buatUsername, urutanBerikut } from "@/lib/username";

async function requireStaf(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Sesi staf tidak ditemukan. Silakan masuk kembali.");
}

export interface AksiResult {
  ok: boolean;
  error?: string;
  /** Diisi tambahSiswa saat UserName dibuat otomatis, agar UI bisa menampilkannya. */
  username?: string;
}

/** Impor massal dari berkas .xlsx/.csv. Idempoten terhadap NISN (duplikat dilewati). */
export async function imporSiswa(formData: FormData): Promise<ImporLaporan> {
  await requireStaf();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Berkas belum dipilih.");

  const baris = await parseSiswa(await file.arrayBuffer(), file.name);
  if (baris.length === 0) throw new Error("Berkas tidak berisi data siswa.");

  // Hanya kelas AKTIF yang boleh menerima impor (kelas nonaktif ditolak, lihat hitungImpor).
  const kelasRows = await prisma.kelas.findMany({
    where: { aktif: true },
    select: { id: true, label: true, tingkat: true, rombel: true, jurusan: { select: { kode: true } } },
  });
  const kelasByLabel = new Map<string, KelasImpor>(
    kelasRows.map((k) => [
      k.label,
      { id: k.id, tingkat: k.tingkat as Tingkat, jurusanKode: k.jurusan.kode, rombel: k.rombel },
    ]),
  );
  const existing = await prisma.student.findMany({ select: { nisn: true, nama: true, kelasId: true } });

  const { laporan, toAdd } = hitungImpor(baris, kelasByLabel, existing);
  if (toAdd.length) {
    await prisma.student.createMany({ data: toAdd });
    revalidatePath("/guru/siswa");
  }
  return laporan;
}

/**
 * Tambah satu siswa. Bila `nisn` dikosongkan, UserName 8-digit dibuat OTOMATIS dari kelas
 * ([angkatan][jurusan][rombel][urutan]); lihat [[username]]. Bila diisi, dipakai apa adanya
 * (untuk siswa yang memang punya NISN).
 */
export async function tambahSiswa(input: { nisn: string; nama: string; kelasId: string }): Promise<AksiResult> {
  await requireStaf();
  let nisn = input.nisn.trim();
  const nama = input.nama.trim().replace(/\s+/g, " ");
  if (!nama) return { ok: false, error: "Nama wajib diisi." };

  const kelas = await prisma.kelas.findUnique({
    where: { id: input.kelasId },
    select: { id: true, tingkat: true, rombel: true, jurusan: { select: { kode: true } } },
  });
  if (!kelas) return { ok: false, error: "Kelas tidak valid." };

  let dibuatOtomatis = false;
  if (!nisn) {
    // Auto-generate UserName dari kelas + nomor urut berikutnya.
    const prefix = prefixUsername(kelas.tingkat as Tingkat, kelas.jurusan.kode, kelas.rombel);
    if (!prefix) return { ok: false, error: "Kelas ini tidak bisa dibuatkan UserName otomatis." };
    const adaNisn = (
      await prisma.student.findMany({ where: { kelasId: kelas.id }, select: { nisn: true } })
    ).map((s) => s.nisn);
    // Cari nomor bebas: mulai dari urutan berikutnya, naikkan bila bentrok (NISN nyata / balapan).
    let urut = urutanBerikut(prefix, adaNisn);
    let terpakai = true;
    for (let i = 0; i < 500 && terpakai; i++) {
      const kandidat = buatUsername(prefix, urut);
      const bentrok = await prisma.student.findUnique({ where: { nisn: kandidat }, select: { id: true } });
      if (bentrok) urut++;
      else {
        nisn = kandidat;
        terpakai = false;
      }
    }
    if (terpakai) return { ok: false, error: "Gagal membuat UserName unik untuk kelas ini." };
    dibuatOtomatis = true;
  } else {
    if (!NISN_RE.test(nisn)) return { ok: false, error: "UserName/NISN harus 4–15 digit angka." };
    if (await prisma.student.findUnique({ where: { nisn }, select: { id: true } }))
      return { ok: false, error: "UserName/NISN sudah terdaftar." };
  }

  await prisma.student.create({ data: { nisn, nama, kelasId: input.kelasId } });
  revalidatePath("/guru/siswa");
  return { ok: true, username: dibuatOtomatis ? nisn : undefined };
}

/** Ubah data siswa (NISN/nama/kelas/aktif). */
export async function editSiswa(
  id: string,
  input: { nisn: string; nama: string; kelasId: string; aktif: boolean },
): Promise<AksiResult> {
  await requireStaf();
  const nisn = input.nisn.trim();
  const nama = input.nama.trim().replace(/\s+/g, " ");
  if (!NISN_RE.test(nisn)) return { ok: false, error: "NISN harus 4–15 digit angka." };
  if (!nama) return { ok: false, error: "Nama wajib diisi." };
  const kelas = await prisma.kelas.findUnique({ where: { id: input.kelasId }, select: { id: true } });
  if (!kelas) return { ok: false, error: "Kelas tidak valid." };
  const bentrok = await prisma.student.findUnique({ where: { nisn }, select: { id: true } });
  if (bentrok && bentrok.id !== id) return { ok: false, error: "NISN sudah dipakai siswa lain." };

  await prisma.student.update({
    where: { id },
    data: { nisn, nama, kelasId: input.kelasId, aktif: input.aktif },
  });
  revalidatePath("/guru/siswa");
  return { ok: true };
}

/** Hapus siswa (beserta aktivitas & hasil Check Point-nya, via cascade). */
export async function hapusSiswa(id: string): Promise<AksiResult> {
  await requireStaf();
  await prisma.student.delete({ where: { id } });
  revalidatePath("/guru/siswa");
  return { ok: true };
}
