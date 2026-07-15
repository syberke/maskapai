// app/admin/airports/page.tsx
import prisma from "@/lib/prisma";
import { connection } from "next/server";
import AirportClient from "./AirportClient";

export default async function AirportsPage() {
  await connection();
  const airports = await prisma.airport.findMany({ orderBy: { city: "asc" } });
  return <AirportClient initialAirports={JSON.parse(JSON.stringify(airports))} />;
}
