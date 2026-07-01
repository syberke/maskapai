"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Role, SeatClass } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type FlightFormData = {
  flightNumber: string;
  airlineId: number;
  departureAirportId: number;
  arrivalAirportId: number;
  departureTime: string;
  arrivalTime: string;
  priceEconomy: number;
  priceBusiness: number;
  priceFirstClass: number;
};

function assertValidFlight(data: FlightFormData) {
  if (
    !data.flightNumber ||
    !data.airlineId ||
    !data.departureAirportId ||
    !data.arrivalAirportId ||
    !data.departureTime ||
    !data.arrivalTime
  ) {
    throw new Error("FIELD_REQUIRED");
  }

  if (data.departureAirportId === data.arrivalAirportId) {
    throw new Error("SAME_AIRPORT");
  }

  const departure = new Date(data.departureTime);
  const arrival = new Date(data.arrivalTime);

  if (Number.isNaN(departure.getTime()) || Number.isNaN(arrival.getTime()) || arrival <= departure) {
    throw new Error("INVALID_TIME_RANGE");
  }

  if (data.priceEconomy <= 0 || data.priceBusiness <= 0 || data.priceFirstClass <= 0) {
    throw new Error("INVALID_PRICE");
  }
}

async function getDefaultPlaneId(airlineId: number) {
  const airline = await prisma.airline.findUnique({
    where: { id: airlineId },
    include: { planes: { orderBy: { id: "asc" }, take: 1 } },
  });

  if (!airline) {
    throw new Error("AIRLINE_NOT_FOUND");
  }

  if (airline.planes[0]) {
    return airline.planes[0].id;
  }

  const code = `${airline.code.toUpperCase()}-ADM`;
  const plane = await prisma.plane.create({
    data: {
      name: `${airline.name} Standard Aircraft`,
      code,
      airlineId: airline.id,
    },
  });

  return plane.id;
}

function buildSeatRows(flightId: number) {
  const rows = [
    { seatClass: SeatClass.FIRST_CLASS, count: 4, prefix: "F" },
    { seatClass: SeatClass.BUSINESS, count: 8, prefix: "B" },
    { seatClass: SeatClass.ECONOMY, count: 24, prefix: "E" },
  ];

  return rows.flatMap(({ seatClass, count, prefix }) =>
    Array.from({ length: count }).map((_, index) => ({
      flightId,
      seatClass,
      seatNumber: `${prefix}${index + 1}`,
      isAvailable: true,
    }))
  );
}

export async function createFlight(data: FlightFormData) {
  try {
    await requireRole([Role.ADMIN]);
    assertValidFlight(data);

    const existing = await prisma.flight.findUnique({
      where: { flightNumber: data.flightNumber.toUpperCase() },
    });
    if (existing) throw new Error("FLIGHT_NUMBER_EXISTS");

    const planeId = await getDefaultPlaneId(data.airlineId);

    await prisma.$transaction(async (tx) => {
      const flight = await tx.flight.create({
        data: {
          flightNumber: data.flightNumber.toUpperCase(),
          planeId,
          departureAirportId: data.departureAirportId,
          arrivalAirportId: data.arrivalAirportId,
          departureTime: new Date(data.departureTime),
          arrivalTime: new Date(data.arrivalTime),
          priceEconomy: data.priceEconomy,
          priceBusiness: data.priceBusiness,
          priceFirstClass: data.priceFirstClass,
        },
      });

      await tx.flightSeat.createMany({
        data: buildSeatRows(flight.id),
      });
    });

    revalidatePath("/admin/flights");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" };
  }
}

export async function updateFlight(id: number, data: FlightFormData) {
  try {
    await requireRole([Role.ADMIN]);
    assertValidFlight(data);

    const existing = await prisma.flight.findFirst({
      where: {
        flightNumber: data.flightNumber.toUpperCase(),
        NOT: { id },
      },
    });
    if (existing) throw new Error("FLIGHT_NUMBER_EXISTS");

    const planeId = await getDefaultPlaneId(data.airlineId);

    await prisma.flight.update({
      where: { id },
      data: {
        flightNumber: data.flightNumber.toUpperCase(),
        planeId,
        departureAirportId: data.departureAirportId,
        arrivalAirportId: data.arrivalAirportId,
        departureTime: new Date(data.departureTime),
        arrivalTime: new Date(data.arrivalTime),
        priceEconomy: data.priceEconomy,
        priceBusiness: data.priceBusiness,
        priceFirstClass: data.priceFirstClass,
      },
    });

    revalidatePath("/admin/flights");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" };
  }
}

export async function deleteFlight(id: number) {
  try {
    await requireRole([Role.ADMIN]);
    await prisma.flight.delete({ where: { id } });
    revalidatePath("/admin/flights");
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "UNKNOWN_ERROR" };
  }
}
