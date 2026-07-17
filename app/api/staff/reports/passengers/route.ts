import prisma from "@/lib/prisma";
import { getSessionFromCookie } from "@/lib/auth";
import { passengerGenderLabel } from "@/lib/passengerManifest";
import { PaymentStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ message: "Sesi login diperlukan." }, { status: 401 });
  }

  if (session.role !== Role.STAFF) {
    return NextResponse.json({ message: "Akses report hanya untuk staff." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const flightId = Number(searchParams.get("flightId"));

  if (!Number.isInteger(flightId) || flightId <= 0) {
    return NextResponse.json({ message: "flightId tidak valid." }, { status: 400 });
  }

  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
    include: {
      departureAirport: true,
      arrivalAirport: true,
      bookings: {
        include: {
          user: true,
          payment: true,
          bookingSeats: { include: { flightSeat: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!flight) {
    return NextResponse.json({ message: "Penerbangan tidak ditemukan." }, { status: 404 });
  }

  const rows = flight.bookings
    .flatMap((booking) =>
      booking.bookingSeats.map((seat) => [
        booking.bookingCode,
        booking.user.name,
        seat.passengerName,
        seat.passengerNik,
        passengerGenderLabel(seat.passengerGender),
        seat.flightSeat.seatNumber,
        seat.flightSeat.seatClass,
        booking.status,
        booking.payment?.paymentStatus ?? PaymentStatus.UNPAID,
        booking.isBoarded ? "Sudah Boarding" : "Belum Boarding",
      ]),
    )
    .sort((left, right) =>
      String(left[5]).localeCompare(String(right[5]), "id", { numeric: true }),
    );

  const header = [
    "Kode Booking",
    "Nama Akun",
    "Nama Penumpang",
    "NIK",
    "Gender",
    "Kursi",
    "Kelas",
    "Status Booking",
    "Status Pembayaran",
    "Status Boarding",
  ];

  const csv = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");

  const filename = `manifest-${flight.flightNumber}-${flight.departureAirport.code}-${flight.arrivalAirport.code}.csv`
    .replace(/[^a-zA-Z0-9._-]/g, "-");

  return new Response(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
