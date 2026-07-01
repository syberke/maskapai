// app/api/payments/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import midtransClient from "midtrans-client";
import { getSessionFromCookie } from "@/lib/auth";

const prisma = new PrismaClient();

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan server.";
}

// Inisialisasi Midtrans menggunakan server key
const snap = new midtransClient.Snap({
  isProduction: false, // false berarti menggunakan mode Sandbox simulasi
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json();
    const session = await getSessionFromCookie();

    if (!bookingId) {
      return NextResponse.json({ message: "ID Booking diperlukan." }, { status: 400 });
    }

    if (!session) {
      return NextResponse.json({ message: "Sesi login diperlukan untuk pembayaran." }, { status: 401 });
    }

    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY) {
      return NextResponse.json({ message: "Konfigurasi Midtrans belum lengkap." }, { status: 500 });
    }

    // 1. Ambil data booking lengkap dengan relasi User, Penerbangan, dan Payment
    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
      include: {
        user: true,
        flight: true,
        payment: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ message: "Data booking tidak ditemukan." }, { status: 404 });
    }

    if (booking.userId !== session.userId) {
      return NextResponse.json({ message: "Anda tidak memiliki akses ke booking ini." }, { status: 403 });
    }

    if (!booking.payment) {
      return NextResponse.json({ message: "Data pembayaran untuk booking ini tidak ditemukan." }, { status: 404 });
    }

    if (["CANCELLED", "EXPIRED"].includes(booking.status)) {
      return NextResponse.json({ message: "Booking ini sudah tidak aktif." }, { status: 409 });
    }

    if (booking.payment.paymentStatus === "PAID") {
      return NextResponse.json({ message: "Pembayaran sudah diterima dan sedang menunggu konfirmasi staff." }, { status: 409 });
    }

    // Tambahkan komponen flat pajak bandara Rp 50.000 seperti di invoice
    const finalPrice = Number(booking.totalPrice) + 50000;

    // Buat order_id unik yang menyertakan timestamp agar selalu segar di Midtrans
    const orderId = `RENGGO-BK-${booking.bookingCode.replace("BK-", "")}-${Date.now()}`;

    // Ambil base URL dari env, jika belum diatur arahkan ke localhost:3000 sebagai fallback cadangan
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 2. Susun parameter payload transaksi sesuai standar Midtrans
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: finalPrice,
      },
      // 🎯 DI SINI TEMPATNYA: Menambahkan rute balik otomatis setelah bayar sukses / gagal
      callbacks: {
        finish: `${baseUrl}/dashboard/bookings?payment=paid`,
        unfinish: `${baseUrl}/dashboard/bookings?payment=pending`,
        error: `${baseUrl}/dashboard/bookings?payment=error`,
      },
      customer_details: {
        first_name: booking.user?.name || "Passenger",
        email: booking.user?.email || "guest@example.com",
      },
      item_details: [
        {
          id: `FLIGHT-${booking.flightId}`,
          price: finalPrice,
          quantity: 1,
          name: `Tiket Penerbangan ${booking.bookingCode}`,
        },
      ],
    };

    // 3. Minta token kasir Snap ke Midtrans
    const transaction = await snap.createTransaction(parameter);

    // 4. Update data invoiceNumber (orderId baru) dan snapToken di database agar selaras untuk cek status
    await prisma.payment.update({
      where: { bookingId: booking.id },
      data: {
        invoiceNumber: orderId,
        amount: finalPrice,
        snapToken: transaction.token,
      },
    });

    return NextResponse.json({ 
      token: transaction.token,
      redirectUrl: transaction.redirect_url 
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("Midtrans Token Error:", error);
    return NextResponse.json({ message: "Gagal membuat token pembayaran.", error: getErrorMessage(error) }, { status: 500 });
  }
}
