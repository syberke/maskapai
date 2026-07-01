// app/admin/airports/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "UNKNOWN_ERROR";
}

export async function getAirports() {
  return await prisma.airport.findMany({ orderBy: { city: "asc" } });
}

export async function createAirport(data: { code: string; name: string; city: string; country: string }) {
  try {
    await requireRole([Role.ADMIN]);

    // Validasi kode unik bandara
    const existing = await prisma.airport.findUnique({ where: { code: data.code.toUpperCase() } });
    if (existing) {
      throw new Error("KODE_ALREADY_EXISTS");
    }

    await prisma.airport.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        city: data.city,
        country: data.country,
      },
    });
    revalidatePath("/admin/airports");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateAirport(id: number, data: { code: string; name: string; city: string; country: string }) {
  try {
    await requireRole([Role.ADMIN]);

    const existing = await prisma.airport.findFirst({
      where: {
        code: data.code.toUpperCase(),
        NOT: { id },
      },
    });
    if (existing) {
      throw new Error("KODE_ALREADY_EXISTS");
    }

    await prisma.airport.update({
      where: { id },
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        city: data.city,
        country: data.country,
      },
    });
    revalidatePath("/admin/airports");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function deleteAirport(id: number) {
  try {
    await requireRole([Role.ADMIN]);

    await prisma.airport.delete({ where: { id } });
    revalidatePath("/admin/airports");
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}
