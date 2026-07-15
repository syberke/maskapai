// app/admin/airlines/page.tsx
import prisma from "@/lib/prisma";
import { connection } from "next/server";
import AirlineClient from "./AirlineClient";

export default async function AirlinesPage() {
  await connection();
  const airlines = await prisma.airline.findMany({ orderBy: { name: "asc" } });
  return <AirlineClient initialAirlines={JSON.parse(JSON.stringify(airlines))} />;
}
