// app/api/bookings/check-status/route.ts
import { NextResponse } from "next/server";
import { BookingStatus, PaymentStatus, PrismaClient, Role } from "@prisma/client";
import { getSessionFromCookie } from "@/lib/auth";
import {
    cancelBookingAndReleaseSeats,
    markPaymentPaidKeepBookingPending,
} from "@/lib/bookingLifecycle";

const prisma = new PrismaClient();

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Terjadi kesalahan server.";
}

export async function POST(request: Request) {
    try {
        const { bookingId } = await request.json();
        const session = await getSessionFromCookie();

        if (!session) {
            return NextResponse.json({ error: "Sesi login diperlukan" }, { status: 401 });
        }

        if (!bookingId) {
            return NextResponse.json({ error: "ID Booking diperlukan" }, { status: 400 });
        }

        // 1. Cari data booking beserta payment-nya
        const booking = await prisma.booking.findUnique({
            where: { id: Number(bookingId) },
            include: { payment: true },
        });

        if (!booking || !booking.payment) {
            return NextResponse.json({ error: "Data booking/payment tidak ditemukan" }, { status: 404 });
        }

        const elevatedRoles: Role[] = [Role.ADMIN, Role.MANAGER, Role.STAFF];
        const canAccess =
            booking.userId === session.userId ||
            elevatedRoles.includes(session.role);

        if (!canAccess) {
            return NextResponse.json({ error: "Tidak berhak mengakses booking ini" }, { status: 403 });
        }

        if (!process.env.MIDTRANS_SERVER_KEY) {
            return NextResponse.json({ error: "Konfigurasi Midtrans belum lengkap" }, { status: 500 });
        }

        // 2. Tembak langsung ke server Midtrans untuk tanya status aslinya
        const secretKey = Buffer.from(`${process.env.MIDTRANS_SERVER_KEY}:`).toString("base64");
        const response = await fetch(
            `https://api.sandbox.midtrans.com/v2/${booking.payment.invoiceNumber}/status`,
            {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Basic ${secretKey}`
                }
            }
        );

        const midtransData = await response.json();

        // 3. Proses status dari Midtrans dan update DB lokal
        const transactionStatus = midtransData.transaction_status;

        if (transactionStatus === "settlement" || transactionStatus === "capture") {
            const updatedBooking = await prisma.$transaction(async (tx) => {
                return markPaymentPaidKeepBookingPending(tx, booking.id);
            });

            return NextResponse.json({
                status: updatedBooking.status,
                paymentStatus: updatedBooking.payment?.paymentStatus ?? PaymentStatus.PAID,
                message: updatedBooking.status === BookingStatus.PENDING
                    ? "Pembayaran diterima. Booking menunggu konfirmasi staff."
                    : "Status pembayaran sudah tersinkron.",
            });
        } else if (["deny", "cancel", "expire"].includes(transactionStatus)) {
            const newBookingStatus = transactionStatus === "expire" ? BookingStatus.EXPIRED : BookingStatus.CANCELLED;
            const updatedBooking = await prisma.$transaction(async (tx) => {
                return cancelBookingAndReleaseSeats(tx, booking.id, newBookingStatus, PaymentStatus.FAILED);
            });

            return NextResponse.json({
                status: updatedBooking.status,
                paymentStatus: PaymentStatus.FAILED,
                message: "Pembayaran gagal/kedaluwarsa. Kursi sudah dilepas kembali.",
            });
        }

        return NextResponse.json({
            status: booking.status,
            paymentStatus: booking.payment.paymentStatus,
        });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
