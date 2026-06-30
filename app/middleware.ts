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
    pathname.startsWith("/checkout");

  // 2. Tentukan rute autentikasi (kalau sudah login, tidak boleh ke sini lagi)
  const isAuthRoute = 
    pathname.startsWith("/auth/login") || 
    pathname.startsWith("/auth/register") || 
    pathname.startsWith("/auth/verify");

  // JIKA BELUM LOGIN dan mencoba masuk ke rute terproteksi
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // JIKA SUDAH LOGIN dan mencoba masuk ke halaman login/register lagi
  if (token && isAuthRoute) {
    try {
      // Validasi apakah tokennya valid atau palsu
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "SUPER_SECRET_RENGGO_MASKAPAI_BAZMA");
      await jwtVerify(token, secret);
      
      // Jika valid, tendang ke halaman utama (/) karena sudah login
      return NextResponse.redirect(new URL("/", request.url));
    } catch (err) {
      // Jika token kedaluwarsa/palsu, hapus cookie tokennya dan biarkan akses halaman auth
      const response = NextResponse.next();
      response.cookies.delete("token");
      return response;
    }
  }

  return NextResponse.next();
}

// Konfigurasi rute mana saja yang akan dipantau oleh middleware
export const config = {
  matcher: ["/booking/:path*", "/dashboard/:path*", "/checkout/:path*", "/auth/:path*"],
};