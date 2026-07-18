import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { templateStaf } from "@/lib/excel-staf";

// Unduh template Excel kosong (Nama, NIP). Hanya ADMIN.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role ?? "GURU";
  if (!session || role !== "ADMIN") return new Response("Tidak diizinkan.", { status: 401 });

  const buf = await templateStaf();
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-guru-staf-angkasara.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
