// app/api/payments/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const midtransClient = require("midtrans-client");

const prisma = new PrismaClient();

// Inisialisasi Midtrans menggunakan server key
const snap = new midtransClient.Snap({
  isProduction: false, // false berarti menggunakan mode Sandbox simulasi
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ message: "ID Booking diperlukan." }, { status: 400 });
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

    if (!booking.payment) {
      return NextResponse.json({ message: "Data pembayaran untuk booking ini tidak ditemukan." }, { status: 404 });
    }

    // Tambahkan komponen flat pajak bandara Rp 50.000 seperti di invoice
    const finalPrice = Number(booking.totalPrice) + 50000;

    // Buat order_id unik yang menyertakan timestamp agar selalu segar di Midtrans
    const orderId = `RENGGO-BK-${booking.bookingCode.replace("BK-", "")}-${Date.now()}`;

    // 2. Susun parameter payload transaksi sesuai standar Midtrans
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: finalPrice,
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
        snapToken: transaction.token,
      },
    });

    return NextResponse.json({ 
      token: transaction.token,
      redirectUrl: transaction.redirect_url 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Midtrans Token Error:", error);
    return NextResponse.json({ message: "Gagal membuat token pembayaran.", error: error.message }, { status: 500 });
  }
}