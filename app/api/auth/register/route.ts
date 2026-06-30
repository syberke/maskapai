import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer"; 

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { name, email, password, captchaToken } = await request.json();

    if (!name || !email || !password || !captchaToken) {
      return NextResponse.json({ message: "Semua data wajib diisi" }, { status: 400 });
    }

    // 1. Validasi reCAPTCHA v2
    const googleVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`;
    const captchaRes = await fetch(googleVerifyUrl, { method: "POST" });
    const captchaData = await captchaRes.json();

    if (!captchaData.success) {
      return NextResponse.json({ message: "Verifikasi Captcha Gagal" }, { status: 400 });
    }

    // 2. Cek duplikasi email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: "Email sudah terdaftar" }, { status: 400 });
    }

    // 3. Hash Password dengan bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Generate OTP 6 Digit
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 Menit aktif

    // 5. Database Transaction
    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "USER", 
        },
      });

      await tx.otpVerification.create({
        data: {
          code: otpCode,
          expiresAt: expiresAt,
          userId: newUser.id,
        },
      });
    });

    // 6. PROSES KIRIM EMAIL ASLI KE MAILTRAP (Sudah Diperbaiki untuk Localhost)
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT || "2525"), 
      secure: false, // Wajib false untuk port 2525 / 587
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Wajib ada agar tidak memblokir koneksi di localhost
      },
    });

    const mailOptions = {
      from: process.env.MAIL_FROM || '"Renggo Maskapai" <no-reply@renggo.id>',
      to: email,
      subject: "Kode OTP Verifikasi Akun Renggo",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #0f172a;">
          <h2>Halo ${name},</h2>
          <p>Terima kasih telah mendaftar di Renggo Maskapai. Gunakan kode OTP di bawah ini untuk memverifikasi akun Anda:</p>
          <div style="background: #f1f5f9; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; border-radius: 12px; margin: 20px 0;">
            ${otpCode}
          </div>
          <p style="font-size: 11px; color: #64748b;">Kode ini berlaku selama 5 menit. Jangan sebarkan kode ini kepada siapa pun.</p>
        </div>
      `,
    };

    // Eksekusi pengiriman via SMTP
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      message: "Registrasi berhasil, silakan cek kode OTP di email Anda" 
    }, { status: 201 });

  } catch (error) {
    console.error("Error register:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server internal" }, { status: 500 });
  }
}