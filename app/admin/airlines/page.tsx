// app/admin/airlines/page.tsx
import prisma from "@/lib/prisma";
import AirlineClient from "./AirlineClient";

export default async function AirlinesPage() {
  const airlines = await prisma.airline.findMany({ orderBy: { name: "asc" } });
  return <AirlineClient initialAirlines={JSON.parse(JSON.stringify(airlines))} />;
}
