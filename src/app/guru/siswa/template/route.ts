import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { templateSiswa } from "@/lib/excel";

// Unduh template Excel kosong (46 kelas × 40 baris). Hanya staf.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return new Response("Tidak diizinkan.", { status: 401 });

  const buf = await templateSiswa();
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-siswa-angkasara.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
