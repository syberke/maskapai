import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ message: "Email dan kode OTP wajib diisi" }, { status: 400 });
    }

    // 1. Cari user berdasarkan email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    // 2. Cari kode OTP terakhir yang valid berdasarkan userId dari database kamu
    const activeOtp = await prisma.otpVerification.findFirst({
      where: {
        userId: user.id,
        code: otp,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!activeOtp) {
      return NextResponse.json({ message: "Kode OTP salah atau tidak valid" }, { status: 400 });
    }

    // 3. Cek kedaluwarsa kode (expiresAt)
    if (new Date() > new Date(activeOtp.expiresAt)) {
      return NextResponse.json({ message: "Kode OTP telah kedaluwarsa, silakan minta kode baru" }, { status: 400 });
    }

    // 4. Update status dan bersihkan token OTP lama (Transaction)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true }, // Mengubah kolom isVerified database kamu menjadi true
      }),
      prisma.otpVerification.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    return NextResponse.json({ message: "Akun Anda berhasil diverifikasi secara penuh" }, { status: 200 });

  } catch (error) {
    console.error("Error verify-otp:", error);
    return NextResponse.json({ message: "Gagal memproses verifikasi OTP" }, { status: 500 });
  }
}