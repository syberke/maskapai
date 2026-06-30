// app/api/bookings/check-status/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { bookingId } = await request.json();

        // 1. Cari data booking beserta payment-nya
        const booking = await prisma.booking.findUnique({
            where: { id: Number(bookingId) },
            include: { payment: true },
        });

        if (!booking || !booking.payment) {
            return NextResponse.json({ error: "Data booking/payment tidak ditemukan" }, { status: 404 });
        }

        // 2. Tembak langsung ke server Midtrans untuk tanya status aslinya
        const secretKey = btoa(process.env.MIDTRANS_SERVER_KEY + ":");
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
            await prisma.booking.update({
                where: { id: booking.id },
                data: { 
                    status: "CONFIRMED",
                    payment: {
                        update: {
                            paymentStatus: "PAID"
                        }
                    }
                },
            });
            return NextResponse.json({ status: "CONFIRMED" });
        } else if (["deny", "cancel", "expire"].includes(transactionStatus)) {
            const newBookingStatus = transactionStatus === "expire" ? "EXPIRED" : "CANCELLED";
            await prisma.booking.update({
                where: { id: booking.id },
                data: {
                    status: newBookingStatus,
                    payment: {
                        update: {
                            paymentStatus: "FAILED"
                        }
                    }
                }
            });
            return NextResponse.json({ status: newBookingStatus });
        }

        return NextResponse.json({ status: booking.status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}