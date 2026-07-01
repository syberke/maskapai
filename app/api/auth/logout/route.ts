import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({
      message: "Berhasil keluar dari sistem",
    });

    // Menghapus cookie token dengan mengatur maxAge ke 0
    response.cookies.set({
      name: "token",
      value: "",
      httpOnly: true,
      expires: new Date(0), // Set expired langsung detik ini juga
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Gagal memproses logout" }, { status: 500 });
  }
}
