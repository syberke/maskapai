import prisma from "@/lib/prisma";
import FlightClient from "./FlightClient";

export default async function FlightsAdminPage() {
  const [flights, airports, airlines] = await Promise.all([
    prisma.flight.findMany({
      orderBy: { departureTime: "desc" },
      include: {
        departureAirport: true,
        arrivalAirport: true,
        plane: { include: { airline: true } },
        flightSeats: {
          select: { isAvailable: true, seatClass: true },
        },
      },
    }),
    prisma.airport.findMany({ orderBy: [{ city: "asc" }, { code: "asc" }] }),
    prisma.airline.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <FlightClient
      initialFlights={JSON.parse(JSON.stringify(flights))}
      airports={JSON.parse(JSON.stringify(airports))}
      airlines={JSON.parse(JSON.stringify(airlines))}
    />
  );
}
