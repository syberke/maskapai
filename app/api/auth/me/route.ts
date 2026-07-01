import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // Ambil cookie token dari request headers
    const cookieHeader = request.headers.get("cookie") || "";
    const token = cookieHeader
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ message: "Tidak ada sesi aktif" }, { status: 401 });
    }

    // Dekode isi token JWT
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: number; email: string; role: string };

    // Ambil data nama dari Prisma jika diperlukan, atau langsung return dari isi token agar cepat
    return NextResponse.json({
      user: { 
        id: decoded.userId,
        name: decoded.email.split("@")[0], 
        email: decoded.email,
        role: decoded.role 
      },
    });
  } catch {
    return NextResponse.json({ message: "Token tidak valid" }, { status: 401 });
  }
}
