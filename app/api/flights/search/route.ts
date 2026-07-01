import { NextResponse } from "next/server";
import { PrismaClient, SeatClass } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const from = searchParams.get("from") || ""; // Kode Bandara Asal (e.g., CGK)
    const to = searchParams.get("to") || "";     // Kode Bandara Tujuan (e.g., DPS)
    const date = searchParams.get("date") || "";   // Format: YYYY-MM-DD
    const requestedSeatClass = searchParams.get("class") || SeatClass.ECONOMY;
    const seatClass = Object.values(SeatClass).includes(requestedSeatClass as SeatClass)
      ? (requestedSeatClass as SeatClass)
      : SeatClass.ECONOMY;

    // Validasi basic
    if (!from || !to || !date) {
      return NextResponse.json(
        { message: "Parameter pencarian tidak lengkap" },
        { status: 400 }
      );
    }

    // Mengatur rentang waktu tanggal keberangkatan (00:00:00 - 23:59:59)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Query ke PostgreSQL menggunakan Prisma
    const flights = await prisma.flight.findMany({
      where: {
        departureAirport: { code: from },
        arrivalAirport: { code: to },
        departureTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        departureAirport: true,
        arrivalAirport: true,
        plane: {
          include: {
            airline: true, // Ambil nama maskapai dan logoUrl
          },
        },
        // Hitung sisa kursi yang masih tersedia untuk kelas yang dipilih
        flightSeats: {
          where: {
            seatClass,
            isAvailable: true,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        departureTime: "asc",
      },
    });

    // Format data agar lebih mudah dikonsumsi oleh komponen UI list penerbangan
    const formattedFlights = flights.map((flight) => {
      // Pilih harga dinamis sesuai kelas kursi yang dicari user
      let selectedPrice = flight.priceEconomy;
      if (seatClass === "BUSINESS") selectedPrice = flight.priceBusiness;
      if (seatClass === "FIRST_CLASS") selectedPrice = flight.priceFirstClass;

      return {
        id: flight.id,
        flightNumber: flight.flightNumber,
        airlineName: flight.plane.airline.name,
        airlineLogo: flight.plane.airline.logoUrl,
        planeName: flight.plane.name,
        originCity: flight.departureAirport.city,
        originCode: flight.departureAirport.code,
        destCity: flight.arrivalAirport.city,
        destCode: flight.arrivalAirport.code,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        price: selectedPrice,
        availableSeats: flight.flightSeats.length,
      };
    });

    return NextResponse.json({ flights: formattedFlights });
  } catch (error) {
    console.error("Error searching flights:", error);
    return NextResponse.json(
      { message: "Gagal memuat data jadwal penerbangan" },
      { status: 500 }
    );
  }
}
