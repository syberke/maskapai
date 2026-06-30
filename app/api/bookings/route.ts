// app/api/bookings/route.ts
import { PrismaClient, SeatClass } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { flightId, seatIds, passengersCount } = body;

        if (!flightId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
            return NextResponse.json({ message: "Parameter booking tidak lengkap." }, { status: 400 });
        }

        if (seatIds.length !== passengersCount) {
            return NextResponse.json({ message: "Jumlah kursi tidak sesuai." }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const flightData = await tx.flight.findUnique({ where: { id: flightId } });
            if (!flightData) throw new Error("FLIGHT_NOT_FOUND");

            const targetedSeats = await tx.flightSeat.findMany({
                where: { id: { in: seatIds }, flightId: flightId },
            });

            const availableSeats = targetedSeats.filter(s => s.isAvailable);
            if (availableSeats.length !== seatIds.length) throw new Error("DOUBLE_BOOKING_DETECTED");

            const firstSeatClass = targetedSeats[0]?.seatClass || SeatClass.ECONOMY;
            let seatPrice = flightData.priceEconomy;
            if (firstSeatClass === SeatClass.BUSINESS) seatPrice = flightData.priceBusiness;
            else if (firstSeatClass === SeatClass.FIRST_CLASS) seatPrice = flightData.priceFirstClass;

            const calculatedTotalPrice = Number(seatPrice) * seatIds.length;

            // 1. Kunci Kursi
            await tx.flightSeat.updateMany({
                where: { id: { in: seatIds } },
                data: { isAvailable: false },
            });

            const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
            const invoiceRandom = Math.floor(100000 + Math.random() * 900000); // 6 digit angka random untuk invoice

            // 2. Buat Booking terikat ke User ID 3 dan sekaligus buat baris Payment-nya
            return await tx.booking.create({
                data: {
                    status: "PENDING",
                    bookingCode: `BK-${randomString}`,
                    totalPrice: calculatedTotalPrice,
                    flight: { connect: { id: flightId } },
                    user: { connect: { id: 3 } },
                    bookingSeats: {
                        create: seatIds.map((id, index) => ({
                            flightSeatId: id,
                            passengerName: `Passenger ${index + 1}`,
                            passengerNik: `123456789000005${index + 1}`
                        }))
                    },
                    // TAMBAHAN: Otomatis bikin row baru di tabel Payment saat klik booking
                    payment: {
                        create: {
                            invoiceNumber: `RENGGO-BK-${randomString}-${invoiceRandom}`, // Format invoice untuk Midtrans order_id
                            amount: calculatedTotalPrice,
                            paymentStatus: "UNPAID", // Atur status awal payment ke UNPAID (sesuai enum DB)
                        }
                    }
                },
            });
        });

        return NextResponse.json({ message: "Booking sukses!", bookingId: result.id }, { status: 201 });

    } catch (error: any) {
        console.error("Booking Engine Error:", error);
        if (error.message === "DOUBLE_BOOKING_DETECTED") {
            return NextResponse.json({ message: "Kursi baru saja dipesan orang lain!" }, { status: 409 });
        }
        return NextResponse.json({ message: "Gagal memproses booking.", detail: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ message: "ID Booking diperlukan." }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: Number(id) },
            include: {
                payment: true,
                flight: {
                    include: {
                        departureAirport: true,
                        arrivalAirport: true,
                        plane: {
                            include: {
                                airline: true,
                            },
                        },
                    },
                },
            },
        });

        if (!booking) {
            return NextResponse.json({ message: "Booking tidak ditemukan." }, { status: 404 });
        }

        return NextResponse.json(booking, { status: 200 });
    } catch (error: any) {
        console.error("Fetch Booking Error:", error);
        return NextResponse.json({ message: "Gagal mengambil data booking.", error: error.message }, { status: 500 });
    }
}