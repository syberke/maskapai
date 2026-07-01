// app/api/bookings/route.ts
import { BookingStatus, PaymentStatus, PrismaClient, Role, SeatClass } from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";
import { deleteBookingAndReleaseSeats } from "@/lib/bookingLifecycle";

const prisma = new PrismaClient();

type BookingRequestBody = {
    flightId?: number;
    seatIds?: number[];
    passengersCount?: number;
    passengers?: {
        name?: string;
        nik?: string;
        gender?: string;
    }[];
};

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "UNKNOWN_ERROR";
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as BookingRequestBody;
        const { flightId, seatIds, passengersCount, passengers } = body;
        const session = await getSessionFromCookie();

        if (!session) {
            return NextResponse.json({ message: "Sesi login diperlukan untuk booking." }, { status: 401 });
        }

        if (!flightId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
            return NextResponse.json({ message: "Parameter booking tidak lengkap." }, { status: 400 });
        }

        if (seatIds.length !== passengersCount) {
            return NextResponse.json({ message: "Jumlah kursi tidak sesuai." }, { status: 400 });
        }

        const normalizedPassengers = Array.isArray(passengers)
            ? passengers.map((passenger) => ({
                name: (passenger.name || "").trim(),
                nik: (passenger.nik || "").trim(),
                gender: (passenger.gender || "").trim(),
            }))
            : [];

        if (normalizedPassengers.length !== seatIds.length) {
            return NextResponse.json({ message: "Data penumpang harus lengkap untuk setiap kursi." }, { status: 400 });
        }

        const hasInvalidPassenger = normalizedPassengers.some((passenger) => {
            return !passenger.name || !/^\d{8,20}$/.test(passenger.nik) || !["MALE", "FEMALE"].includes(passenger.gender);
        });

        if (hasInvalidPassenger) {
            return NextResponse.json({ message: "Nama, NIK, dan gender penumpang wajib valid." }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const flightData = await tx.flight.findUnique({ where: { id: flightId } });
            if (!flightData) throw new Error("FLIGHT_NOT_FOUND");

            const targetedSeats = await tx.flightSeat.findMany({
                where: { id: { in: seatIds }, flightId: flightId },
            });

            if (targetedSeats.length !== seatIds.length) throw new Error("SEAT_NOT_FOUND");

            const availableSeats = targetedSeats.filter(s => s.isAvailable);
            if (availableSeats.length !== seatIds.length) throw new Error("DOUBLE_BOOKING_DETECTED");

            const firstSeatClass = targetedSeats[0]?.seatClass || SeatClass.ECONOMY;
            const hasMixedSeatClass = targetedSeats.some((seat) => seat.seatClass !== firstSeatClass);
            if (hasMixedSeatClass) throw new Error("MIXED_SEAT_CLASS");

            let seatPrice = flightData.priceEconomy;
            if (firstSeatClass === SeatClass.BUSINESS) seatPrice = flightData.priceBusiness;
            else if (firstSeatClass === SeatClass.FIRST_CLASS) seatPrice = flightData.priceFirstClass;

            const calculatedTotalPrice = Number(seatPrice) * seatIds.length;

            // 1. Kunci Kursi
            const lockedSeats = await tx.flightSeat.updateMany({
                where: { id: { in: seatIds }, isAvailable: true },
                data: { isAvailable: false },
            });

            if (lockedSeats.count !== seatIds.length) throw new Error("DOUBLE_BOOKING_DETECTED");

            const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
            const invoiceRandom = Math.floor(100000 + Math.random() * 900000); // 6 digit angka random untuk invoice

                    // 2. Buat Booking terikat ke user login dan sekaligus buat baris Payment-nya
            return await tx.booking.create({
                data: {
                    status: "PENDING",
                    bookingCode: `BK-${randomString}`,
                    totalPrice: calculatedTotalPrice,
                    flight: { connect: { id: flightId } },
                    user: { connect: { id: session.userId } },
                    bookingSeats: {
                        create: seatIds.map((id, index) => ({
                            flightSeatId: id,
                            passengerName: normalizedPassengers[index].name,
                            passengerNik: normalizedPassengers[index].nik,
                            passengerGender: normalizedPassengers[index].gender
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

    } catch (error: unknown) {
        console.error("Booking Engine Error:", error);
        const message = getErrorMessage(error);
        if (message === "DOUBLE_BOOKING_DETECTED") {
            return NextResponse.json({ message: "Kursi baru saja dipesan orang lain!" }, { status: 409 });
        }
        if (message === "SEAT_NOT_FOUND") {
            return NextResponse.json({ message: "Data kursi tidak valid." }, { status: 400 });
        }
        if (message === "MIXED_SEAT_CLASS") {
            return NextResponse.json({ message: "Semua kursi harus berada di kelas yang sama." }, { status: 400 });
        }
        return NextResponse.json({ message: "Gagal memproses booking.", detail: message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const session = await getSessionFromCookie();

        if (!id) {
            return NextResponse.json({ message: "ID Booking diperlukan." }, { status: 400 });
        }

        if (!session) {
            return NextResponse.json({ message: "Sesi login diperlukan." }, { status: 401 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id: Number(id) },
            include: {
                payment: true,
                bookingSeats: {
                    include: {
                        flightSeat: true,
                    },
                },
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

        const elevatedRoles: Role[] = [Role.ADMIN, Role.MANAGER, Role.STAFF];
        const canAccess =
            booking.userId === session.userId ||
            elevatedRoles.includes(session.role);

        if (!canAccess) {
            return NextResponse.json({ message: "Anda tidak memiliki akses ke booking ini." }, { status: 403 });
        }

        return NextResponse.json(booking, { status: 200 });
    } catch (error: unknown) {
        console.error("Fetch Booking Error:", error);
        return NextResponse.json({ message: "Gagal mengambil data booking.", error: getErrorMessage(error) }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get("id"));
        const session = await getSessionFromCookie();

        if (!session) {
            return NextResponse.json({ message: "Sesi login diperlukan." }, { status: 401 });
        }

        if (!id) {
            return NextResponse.json({ message: "ID Booking diperlukan." }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { payment: true },
        });

        if (!booking) {
            return NextResponse.json({ message: "Booking tidak ditemukan." }, { status: 404 });
        }

        const staffLevelRoles: Role[] = [Role.ADMIN, Role.STAFF];
        const isStaffLevel = staffLevelRoles.includes(session.role);
        const isOwner = booking.userId === session.userId;

        if (!isOwner && !isStaffLevel) {
            return NextResponse.json({ message: "Anda tidak memiliki akses ke booking ini." }, { status: 403 });
        }

        const isPaid = booking.payment?.paymentStatus === PaymentStatus.PAID;

        if (!isStaffLevel && (isPaid || booking.status === BookingStatus.CONFIRMED)) {
            return NextResponse.json({
                message: "Booking yang sudah dibayar atau dikonfirmasi tidak bisa dihapus oleh user.",
            }, { status: 409 });
        }

        await prisma.$transaction(async (tx) => {
            await deleteBookingAndReleaseSeats(tx, booking.id);
        });

        return NextResponse.json({
            message: "Booking dihapus dan kursi sudah tersedia kembali.",
        });
    } catch (error: unknown) {
        console.error("Delete Booking Error:", error);
        return NextResponse.json({ message: "Gagal menghapus booking.", error: getErrorMessage(error) }, { status: 500 });
    }
}
