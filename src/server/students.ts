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
import { hitungImpor, NISN_RE, type ImporLaporan } from "@/lib/impor";

async function requireStaf(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Sesi staf tidak ditemukan. Silakan masuk kembali.");
}

export interface AksiResult {
  ok: boolean;
  error?: string;
}

/** Impor massal dari berkas .xlsx/.csv. Idempoten terhadap NISN (duplikat dilewati). */
export async function imporSiswa(formData: FormData): Promise<ImporLaporan> {
  await requireStaf();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Berkas belum dipilih.");

  const baris = await parseSiswa(await file.arrayBuffer(), file.name);
  if (baris.length === 0) throw new Error("Berkas tidak berisi data siswa.");

  const kelasRows = await prisma.kelas.findMany({ select: { id: true, label: true } });
  const kelasByLabel = new Map(kelasRows.map((k) => [k.label, k.id]));
  const existing = new Set(
    (await prisma.student.findMany({ select: { nisn: true } })).map((s) => s.nisn),
  );

  const { laporan, toAdd } = hitungImpor(baris, kelasByLabel, existing);
  if (toAdd.length) {
    await prisma.student.createMany({ data: toAdd });
    revalidatePath("/guru/siswa");
  }
  return laporan;
}

/** Tambah satu siswa. */
export async function tambahSiswa(input: { nisn: string; nama: string; kelasId: string }): Promise<AksiResult> {
  await requireStaf();
  const nisn = input.nisn.trim();
  const nama = input.nama.trim().replace(/\s+/g, " ");
  if (!NISN_RE.test(nisn)) return { ok: false, error: "NISN harus 4–15 digit angka." };
  if (!nama) return { ok: false, error: "Nama wajib diisi." };
  const kelas = await prisma.kelas.findUnique({ where: { id: input.kelasId }, select: { id: true } });
  if (!kelas) return { ok: false, error: "Kelas tidak valid." };
  if (await prisma.student.findUnique({ where: { nisn }, select: { id: true } }))
    return { ok: false, error: "NISN sudah terdaftar." };

  await prisma.student.create({ data: { nisn, nama, kelasId: input.kelasId } });
  revalidatePath("/guru/siswa");
  return { ok: true };
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
