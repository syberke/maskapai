import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "SUPER_SECRET_RENGGO_MASKAPAI_BAZMA") as any;

    // Ambil data nama dari Prisma jika diperlukan, atau langsung return dari isi token agar cepat
    return NextResponse.json({
      user: { name: decoded.email.split("@")[0], role: decoded.role }, // Ambil nama depan email sebagai nama panggung dummy
    });
  } catch (error) {
    return NextResponse.json({ message: "Token tidak valid" }, { status: 401 });
  }
}