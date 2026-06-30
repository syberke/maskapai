import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, password, captchaToken } = await request.json();

    // 1. Proteksi Captcha
    const googleVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`;
    const captchaRes = await fetch(googleVerifyUrl, { method: "POST" });
    const captchaData = await captchaRes.json();

    if (!captchaData.success) {
      return NextResponse.json({ message: "Selesaikan Captcha dengan benar" }, { status: 400 });
    }

    // 2. Tarik data user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: "Email atau Password salah" }, { status: 401 });
    }

    // 3. Cek Kolom isVerified database kamu (Ketentuan PRD 12.2)
    if (!user.isVerified) {
      // Jika bernilai false, lempar instruksi ke frontend untuk meminta verifikasi OTP
      return NextResponse.json({ 
        message: "Akun Anda belum terverifikasi OTP", 
        unverified: true 
      }, { status: 403 });
    }

    // 4. Cek Password ke Bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ message: "Email atau Password salah" }, { status: 401 });
    }

    // 5. Build secure token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "SUPER_SECRET_RENGGO",
      { expiresIn: "24h" }
    );

    const response = NextResponse.json({
      message: "Berhasil masuk ke dalam sistem",
      user: { name: user.name, role: user.role },
    });

    // 6. Set HttpOnly Cookie
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60,
    });

    return response;

  } catch (error) {
    console.error("Error login:", error);
    return NextResponse.json({ message: "Terjadi kegagalan sistem login" }, { status: 500 });
  }
}