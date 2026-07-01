// app/admin/airports/page.tsx
import prisma from "@/lib/prisma";
import AirportClient from "./AirportClient";

export default async function AirportsPage() {
  const airports = await prisma.airport.findMany({ orderBy: { city: "asc" } });
  return <AirportClient initialAirports={JSON.parse(JSON.stringify(airports))} />;
}
