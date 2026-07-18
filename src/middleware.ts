/**
 * Proteksi rute (Edge). Cek OPTIMISTIK berbasis cookie (tanpa query DB):
 *  - /guru/*  → butuh cookie sesi Better Auth (staf). Kalau tak ada → /masuk?tab=staf
 *  - /siswa/* → butuh cookie sesi siswa (jose) yang SAH. Kalau tidak → /masuk
 * Verifikasi penuh (peran, keaktifan) tetap dilakukan di server component/action.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { verifyStudentSession, STUDENT_COOKIE } from "@/lib/student-session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/guru")) {
    const staf = getSessionCookie(req); // presence check, edge-safe
    if (!staf) {
      const url = req.nextUrl.clone();
      url.pathname = "/masuk";
      // Halaman khusus admin → arahkan ke tab Admin; sisanya tab Guru.
      url.searchParams.set("tab", pathname.startsWith("/guru/staf") ? "admin" : "guru");
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/siswa")) {
    const sesi = await verifyStudentSession(req.cookies.get(STUDENT_COOKIE)?.value);
    if (!sesi) {
      const url = req.nextUrl.clone();
      url.pathname = "/masuk";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/guru/:path*", "/siswa/:path*"],
};
