import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose"; // Menggunakan jose karena ringan di lingkungan Edge Middleware

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // 1. Tentukan rute mana saja yang WAJIB login baru bisa diakses
  const isProtectedRoute = 
    pathname.startsWith("/booking") || 
    pathname.startsWith("/dashboard") || 
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/manager") ||
    pathname.startsWith("/staff");

  // 2. Tentukan rute autentikasi (kalau sudah login, tidak boleh ke sini lagi)
  const isAuthRoute = 
    pathname.startsWith("/auth/login") || 
    pathname.startsWith("/auth/register") || 
    pathname.startsWith("/auth/verify");

  // JIKA BELUM LOGIN dan mencoba masuk ke rute terproteksi
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // JIKA SUDAH LOGIN
  if (token) {
    try {
      // Validasi apakah tokennya valid atau palsu
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "SUPER_SECRET_RENGGO_MASKAPAI_BAZMA");
      const { payload } = await jwtVerify(token, secret);
      const role = payload.role as string | undefined;

      // Proteksi khusus Admin: Hanya role ADMIN yang boleh masuk /admin
      if (pathname.startsWith("/admin") && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Proteksi khusus Manager: Hanya role MANAGER yang boleh masuk /manager
      if (pathname.startsWith("/manager") && role !== "MANAGER") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Proteksi khusus Staff: Hanya role STAFF yang boleh masuk /staff
      if (pathname.startsWith("/staff") && role !== "STAFF") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Jika mencoba masuk ke halaman login/register lagi
      if (isAuthRoute) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      // Jika token kedaluwarsa/palsu, hapus cookie tokennya
      const response = isProtectedRoute 
        ? NextResponse.redirect(new URL("/auth/login", request.url))
        : NextResponse.next();
      response.cookies.delete("token");
      return response;
    }
  }

  return NextResponse.next();
}

// Konfigurasi rute mana saja yang akan dipantau oleh middleware
export const config = {
  matcher: [
    "/booking/:path*",
    "/bookings/:path*",
    "/dashboard/:path*", 
    "/checkout/:path*", 
    "/auth/:path*",
    "/admin/:path*",
    "/manager/:path*",
    "/staff/:path*"
  ],
};
