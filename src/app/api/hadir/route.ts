/**
 * Detak kehadiran siswa (heartbeat). Dipanggil berkala dari halaman siswa
 * (lihat komponen HeartbeatSiswa di layout siswa) untuk memperbarui
 * `Student.lastSeen` → dipakai guru melihat status online di Pantauan.
 *
 * Ringan & tanpa efek samping lain: hanya update timestamp bila ada sesi siswa sah.
 */
import { prisma } from "@/lib/db";
import { sesiSiswa } from "@/server/student-auth";

export async function POST() {
  const sesi = await sesiSiswa();
  if (!sesi) return new Response(null, { status: 204 });
  try {
    await prisma.student.update({
      where: { id: sesi.studentId },
      data: { lastSeen: new Date() },
    });
  } catch {
    // siswa terhapus / balapan — abaikan, jangan ganggu pengalaman siswa.
  }
  return new Response(null, { status: 204 });
}
