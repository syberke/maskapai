// app/api/bookings/route.ts
import {
    BookingStatus,
    PaymentStatus,
    Role,
    SeatClass,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth";
import { deleteBookingAndReleaseSeats } from "@/lib/bookingLifecycle";
import prisma from "@/lib/prisma";
import {
    type PassengerInput,
    validatePassengerManifest,
} from "@/lib/passengerManifest";

type BookingRequestBody = {
    flightId?: number;
    seatIds?: number[];
    passengersCount?: number;
    passengers?: PassengerInput[];
};

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "UNKNOWN_ERROR";
}

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as BookingRequestBody;
        const flightId = Number(body.flightId);
        const seatIds = Array.isArray(body.seatIds)
            ? body.seatIds.map(Number)
            : [];
        const passengersCount = Number(body.passengersCount);
        const passengers = Array.isArray(body.passengers) ? body.passengers : [];
        const session = await getSessionFromCookie();

        if (!session) {
            return NextResponse.json(
                { message: "Sesi login diperlukan untuk booking." },
                { status: 401 },
            );
        }

        if (
            !Number.isInteger(flightId) ||
            flightId <= 0 ||
            seatIds.length === 0 ||
            seatIds.some((seatId) => !Number.isInteger(seatId) || seatId <= 0)
        ) {
            return NextResponse.json(
                { message: "Parameter penerbangan atau kursi tidak valid." },
                { status: 400 },
            );
        }

        if (
            !Number.isInteger(passengersCount) ||
            passengersCount < 1 ||
            passengersCount > 5 ||
            seatIds.length !== passengersCount
        ) {
            return NextResponse.json(
                { message: "Jumlah kursi harus sama dengan jumlah penumpang dan maksimal 5 orang." },
                { status: 400 },
            );
        }

        const manifestValidation = validatePassengerManifest(seatIds, passengers);
        if (!manifestValidation.success) {
            return NextResponse.json(
                { message: manifestValidation.message },
                { status: 400 },
            );
        }

        const passengerBySeatId = new Map(
            manifestValidation.passengers.map((passenger) => [passenger.seatId, passenger]),
        );

        const result = await prisma.$transaction(async (tx) => {
            const flightData = await tx.flight.findUnique({ where: { id: flightId } });
            if (!flightData) throw new Error("FLIGHT_NOT_FOUND");

            const targetedSeats = await tx.flightSeat.findMany({
                where: { id: { in: seatIds }, flightId },
            });

            if (targetedSeats.length !== seatIds.length) {
                throw new Error("SEAT_NOT_FOUND");
            }

            if (targetedSeats.some((seat) => !seat.isAvailable)) {
                throw new Error("DOUBLE_BOOKING_DETECTED");
            }

            const firstSeatClass = targetedSeats[0]?.seatClass || SeatClass.ECONOMY;
            if (targetedSeats.some((seat) => seat.seatClass !== firstSeatClass)) {
                throw new Error("MIXED_SEAT_CLASS");
            }

            let seatPrice = flightData.priceEconomy;
            if (firstSeatClass === SeatClass.BUSINESS) seatPrice = flightData.priceBusiness;
            if (firstSeatClass === SeatClass.FIRST_CLASS) seatPrice = flightData.priceFirstClass;

            const calculatedTotalPrice = Number(seatPrice) * seatIds.length;

            const lockedSeats = await tx.flightSeat.updateMany({
                where: { id: { in: seatIds }, flightId, isAvailable: true },
                data: { isAvailable: false },
            });

            if (lockedSeats.count !== seatIds.length) {
                throw new Error("DOUBLE_BOOKING_DETECTED");
            }

            const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
            const invoiceRandom = Math.floor(100000 + Math.random() * 900000);

            return tx.booking.create({
                data: {
                    status: BookingStatus.PENDING,
                    bookingCode: `BK-${randomString}`,
                    totalPrice: calculatedTotalPrice,
                    flight: { connect: { id: flightId } },
                    user: { connect: { id: session.userId } },
                    bookingSeats: {
                        create: seatIds.map((seatId) => {
                            const passenger = passengerBySeatId.get(seatId);
                            if (!passenger) throw new Error("PASSENGER_SEAT_MISMATCH");

                            return {
                                flightSeatId: seatId,
                                passengerName: passenger.name,
                                passengerNik: passenger.nik,
                                passengerGender: passenger.gender,
                            };
                        }),
                    },
                    payment: {
                        create: {
                            invoiceNumber: `RENGGO-BK-${randomString}-${invoiceRandom}`,
                            amount: calculatedTotalPrice,
                            paymentStatus: PaymentStatus.UNPAID,
                        },
                    },
                },
                include: {
                    bookingSeats: {
                        include: { flightSeat: true },
                    },
                    payment: true,
                },
            });
        });

        return NextResponse.json(
            {
                message: "Booking dan manifest penumpang berhasil disimpan.",
                bookingId: result.id,
                passengerCount: result.bookingSeats.length,
            },
            { status: 201 },
        );
    } catch (error: unknown) {
        console.error("Booking Engine Error:", error);
        const message = getErrorMessage(error);

        if (message === "DOUBLE_BOOKING_DETECTED") {
            return NextResponse.json(
                { message: "Kursi baru saja dipesan orang lain." },
                { status: 409 },
            );
        }
        if (message === "FLIGHT_NOT_FOUND") {
            return NextResponse.json(
                { message: "Penerbangan tidak ditemukan." },
                { status: 404 },
            );
        }
        if (message === "SEAT_NOT_FOUND") {
            return NextResponse.json(
                { message: "Data kursi tidak valid untuk penerbangan ini." },
                { status: 400 },
            );
        }
        if (message === "MIXED_SEAT_CLASS") {
            return NextResponse.json(
                { message: "Semua kursi harus berada di kelas yang sama." },
                { status: 400 },
            );
        }
        if (message === "PASSENGER_SEAT_MISMATCH") {
            return NextResponse.json(
                { message: "Data penumpang tidak sesuai dengan kursi yang dipilih." },
                { status: 400 },
            );
        }

        return NextResponse.json(
            { message: "Gagal memproses booking.", detail: message },
            { status: 500 },
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get("id"));
        const session = await getSessionFromCookie();

        if (!Number.isInteger(id) || id <= 0) {
            return NextResponse.json(
                { message: "ID booking diperlukan." },
                { status: 400 },
            );
        }

        if (!session) {
            return NextResponse.json(
                { message: "Sesi login diperlukan." },
                { status: 401 },
            );
        }

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                payment: true,
                bookingSeats: {
                    include: { flightSeat: true },
                    orderBy: { flightSeat: { seatNumber: "asc" } },
                },
                flight: {
                    include: {
                        departureAirport: true,
                        arrivalAirport: true,
                        plane: { include: { airline: true } },
                    },
                },
            },
        });

        if (!booking) {
            return NextResponse.json(
                { message: "Booking tidak ditemukan." },
                { status: 404 },
            );
        }

        const elevatedRoles: Role[] = [Role.ADMIN, Role.MANAGER, Role.STAFF];
        const canAccess =
            booking.userId === session.userId || elevatedRoles.includes(session.role);

        if (!canAccess) {
            return NextResponse.json(
                { message: "Anda tidak memiliki akses ke booking ini." },
                { status: 403 },
            );
        }

        return NextResponse.json(booking, { status: 200 });
    } catch (error: unknown) {
        console.error("Fetch Booking Error:", error);
        return NextResponse.json(
            { message: "Gagal mengambil data booking.", error: getErrorMessage(error) },
            { status: 500 },
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get("id"));
        const session = await getSessionFromCookie();

        if (!session) {
            return NextResponse.json(
                { message: "Sesi login diperlukan." },
                { status: 401 },
            );
        }

        if (!Number.isInteger(id) || id <= 0) {
            return NextResponse.json(
                { message: "ID booking diperlukan." },
                { status: 400 },
            );
        }

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { payment: true },
        });

        if (!booking) {
            return NextResponse.json(
                { message: "Booking tidak ditemukan." },
                { status: 404 },
            );
        }

        const staffLevelRoles: Role[] = [Role.ADMIN, Role.STAFF];
        const isStaffLevel = staffLevelRoles.includes(session.role);
        const isOwner = booking.userId === session.userId;

        if (!isOwner && !isStaffLevel) {
            return NextResponse.json(
                { message: "Anda tidak memiliki akses ke booking ini." },
                { status: 403 },
            );
        }

        const isPaid = booking.payment?.paymentStatus === PaymentStatus.PAID;

        if (!isStaffLevel && (isPaid || booking.status === BookingStatus.CONFIRMED)) {
            return NextResponse.json(
                {
                    message: "Booking yang sudah dibayar atau dikonfirmasi tidak bisa dihapus oleh user.",
                },
                { status: 409 },
            );
        }

        await prisma.$transaction(async (tx) => {
            await deleteBookingAndReleaseSeats(tx, booking.id);
        });

        return NextResponse.json({
            message: "Booking dihapus dan kursi sudah tersedia kembali.",
        });
    } catch (error: unknown) {
        console.error("Delete Booking Error:", error);
        return NextResponse.json(
            { message: "Gagal menghapus booking.", error: getErrorMessage(error) },
            { status: 500 },
        );
    }
}
